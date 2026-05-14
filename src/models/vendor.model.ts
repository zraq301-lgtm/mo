import { BaseModel, BaseRecord, ModelConfig } from '../lib/base-model';
import { v4 } from '../lib/uuid';

export interface Vendor extends BaseRecord {
  name: string;
  email: string;
  phone: string;
  address: string;
  tax_id: string;
  payment_terms: number; // days
  balance: number;
  currency: string;
}

export interface PurchaseOrderLine {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface PurchaseOrder extends BaseRecord {
  reference: string;
  vendor_id: string;
  vendor_name: string;
  order_date: string;
  expected_date: string;
  lines: PurchaseOrderLine[];
  total: number;
  currency: string;
  notes: string;
}

export class VendorModel extends BaseModel<Vendor> {
  constructor(config: ModelConfig) {
    super('vendors', config);
  }

  create(data: Omit<Vendor, keyof BaseRecord>): Vendor {
    return {
      ...(this.buildBase() as Vendor),
      status: 'active',
      ...data,
    };
  }
}

export class PurchaseOrderModel extends BaseModel<PurchaseOrder> {
  constructor(config: ModelConfig) {
    super('purchase_orders', config);
  }

  create(data: Omit<PurchaseOrder, keyof BaseRecord>): PurchaseOrder {
    return {
      ...(this.buildBase() as PurchaseOrder),
      reference: `PO-${Date.now()}`,
      ...data,
    };
  }

  buildLine(data: Omit<PurchaseOrderLine, 'id' | 'total'>): PurchaseOrderLine {
    return {
      id: v4(),
      total: data.quantity * data.unit_price,
      ...data,
    };
  }

  computeTotal(lines: PurchaseOrderLine[]): number {
    return lines.reduce((sum, l) => sum + l.total, 0);
  }
}
