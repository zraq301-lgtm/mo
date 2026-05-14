import { BaseModel, BaseRecord, ModelConfig } from '../lib/base-model';
import { v4 } from '../lib/uuid';
import { StockMoveModel, ProductModel } from './inventory.model';

export interface Employee extends BaseRecord {
  name: string;
  employee_number: string;
  department: string;
  position: string;
  hire_date: string;
  hourly_rate: number;
  email: string;
  phone: string;
}

export interface BOMLine {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit: string;
}

export interface BillOfMaterials extends BaseRecord {
  product_id: string; // finished good
  product_name: string;
  quantity_output: number;
  lines: BOMLine[]; // raw materials
}

export interface ManufacturingOrderLine {
  id: string;
  product_id: string;
  product_name: string;
  planned_qty: number;
  actual_qty: number;
}

export interface ManufacturingOrder extends BaseRecord {
  reference: string;
  product_id: string;
  product_name: string;
  bom_id: string;
  planned_qty: number;
  actual_qty: number;
  start_date: string;
  end_date: string;
  assigned_employees: string[]; // employee IDs
  components: ManufacturingOrderLine[];
  labor_hours: number;
  labor_cost: number;
  total_cost: number;
  warehouse_id: string;
}

export class EmployeeModel extends BaseModel<Employee> {
  constructor(config: ModelConfig) {
    super('employees', config);
  }

  create(data: Omit<Employee, keyof BaseRecord>): Employee {
    return {
      ...(this.buildBase() as Employee),
      status: 'active',
      ...data,
    };
  }
}

export class BOMModel extends BaseModel<BillOfMaterials> {
  constructor(config: ModelConfig) {
    super('bom', config);
  }

  create(data: Omit<BillOfMaterials, keyof BaseRecord>): BillOfMaterials {
    return {
      ...(this.buildBase() as BillOfMaterials),
      status: 'active',
      ...data,
    };
  }

  buildLine(data: Omit<BOMLine, 'id'>): BOMLine {
    return { id: v4(), ...data };
  }
}

export class ManufacturingOrderModel extends BaseModel<ManufacturingOrder> {
  private stockMoveModel: StockMoveModel;
  private productModel: ProductModel;

  constructor(config: ModelConfig, stockMoveModel: StockMoveModel, productModel: ProductModel) {
    super('manufacturing_orders', config);
    this.stockMoveModel = stockMoveModel;
    this.productModel = productModel;
  }

  create(data: Omit<ManufacturingOrder, keyof BaseRecord>): ManufacturingOrder {
    return {
      ...(this.buildBase() as ManufacturingOrder),
      reference: `MO-${Date.now()}`,
      actual_qty: 0,
      labor_hours: 0,
      labor_cost: 0,
      total_cost: 0,
      ...data,
    };
  }

  // Stock-Production Hook: deduct raw materials, add finished goods
  protected async beforeSave(record: ManufacturingOrder): Promise<void> {
    if (record.status !== 'active') return;

    const previous = await this.get(record.id);
    if (previous?.status === 'active') return; // already processed

    // Deduct raw material components
    for (const comp of record.components) {
      const moveOut = this.stockMoveModel.create({
        product_id: comp.product_id,
        product_name: comp.product_name,
        move_type: 'production_out',
        quantity: comp.actual_qty || comp.planned_qty,
        from_warehouse_id: record.warehouse_id,
        to_warehouse_id: '',
        unit_cost: 0,
        source_document: record.reference,
        notes: `Consumed in MO: ${record.reference}`,
        reference: `${record.reference}-OUT-${comp.product_id}`,
        status: 'active',
      });
      await this.stockMoveModel.save(moveOut);
    }

    // Add finished product to stock
    const product = await this.productModel.get(record.product_id);
    const moveIn = this.stockMoveModel.create({
      product_id: record.product_id,
      product_name: record.product_name,
      move_type: 'production_in',
      quantity: record.actual_qty || record.planned_qty,
      from_warehouse_id: '',
      to_warehouse_id: record.warehouse_id,
      unit_cost: product ? product.cost_price : 0,
      source_document: record.reference,
      notes: `Produced in MO: ${record.reference}`,
      reference: `${record.reference}-IN`,
      status: 'active',
    });
    await this.stockMoveModel.save(moveIn);
  }
}
