import { BaseModel, BaseRecord, ModelConfig } from '../lib/base-model';
import { v4 } from '../lib/uuid';

export interface Product extends BaseRecord {
  name: string;
  sku: string;
  category: string;
  unit: string;
  cost_price: number;
  sale_price: number;
  reorder_point: number;
  current_stock: number;
  warehouse_id: string;
}

export interface Warehouse extends BaseRecord {
  name: string;
  location: string;
  manager_id: string;
  capacity: number;
}

export type StockMoveType = 'in' | 'out' | 'transfer' | 'adjustment' | 'production_in' | 'production_out';

export interface StockMove extends BaseRecord {
  reference: string;
  product_id: string;
  product_name: string;
  move_type: StockMoveType;
  quantity: number;
  from_warehouse_id: string;
  to_warehouse_id: string;
  unit_cost: number;
  source_document: string; // PO ref, SO ref, MO ref
  notes: string;
}

export class ProductModel extends BaseModel<Product> {
  constructor(config: ModelConfig) {
    super('products', config);
  }

  create(data: Omit<Product, keyof BaseRecord>): Product {
    return {
      ...(this.buildBase() as Product),
      status: 'active',
      current_stock: 0,
      ...data,
    };
  }

  async adjustStock(productId: string, delta: number): Promise<Product | null> {
    const product = await this.get(productId);
    if (!product) return null;
    const updated = { ...product, current_stock: Math.max(0, product.current_stock + delta) };
    return this.save(updated);
  }
}

export class WarehouseModel extends BaseModel<Warehouse> {
  constructor(config: ModelConfig) {
    super('warehouses', config);
  }

  create(data: Omit<Warehouse, keyof BaseRecord>): Warehouse {
    return {
      ...(this.buildBase() as Warehouse),
      status: 'active',
      ...data,
    };
  }
}

export class StockMoveModel extends BaseModel<StockMove> {
  private productModel: ProductModel;

  constructor(config: ModelConfig, productModel: ProductModel) {
    super('stock_moves', config);
    this.productModel = productModel;
  }

  create(data: Omit<StockMove, keyof BaseRecord>): StockMove {
    return {
      ...(this.buildBase() as StockMove),
      reference: `SM-${Date.now()}`,
      ...data,
    };
  }

  protected async beforeSave(record: StockMove): Promise<void> {
    // Automatically adjust product stock when a move is confirmed
    if (record.status === 'active') {
      if (['in', 'production_in'].includes(record.move_type)) {
        await this.productModel.adjustStock(record.product_id, record.quantity);
      } else if (['out', 'production_out'].includes(record.move_type)) {
        await this.productModel.adjustStock(record.product_id, -record.quantity);
      }
    }
  }
}

export { v4 };
