import { BaseModel, BaseRecord, ModelConfig } from '../lib/base-model';
import { v4 } from '../lib/uuid';
import { LedgerModel } from './finance.model';
import { StockMoveModel } from './inventory.model';

export interface Customer extends BaseRecord {
  name: string;
  email: string;
  phone: string;
  address: string;
  tax_id: string;
  credit_limit: number;
  balance: number;
  currency: string;
}

export interface SalesOrderLine {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
}

export interface SalesOrder extends BaseRecord {
  reference: string;
  customer_id: string;
  customer_name: string;
  order_date: string;
  delivery_date: string;
  lines: SalesOrderLine[];
  subtotal: number;
  tax_amount: number;
  total: number;
  currency: string;
  warehouse_id: string;
  notes: string;
  invoice_id: string;
}

export interface Invoice extends BaseRecord {
  reference: string;
  sales_order_id: string;
  customer_id: string;
  customer_name: string;
  issue_date: string;
  due_date: string;
  lines: SalesOrderLine[];
  subtotal: number;
  tax_amount: number;
  total: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
}

export class CustomerModel extends BaseModel<Customer> {
  constructor(config: ModelConfig) {
    super('customers', config);
  }

  create(data: Omit<Customer, keyof BaseRecord>): Customer {
    return {
      ...(this.buildBase() as Customer),
      status: 'active',
      balance: 0,
      ...data,
    };
  }

  async updateBalance(customerId: string, delta: number): Promise<Customer | null> {
    const customer = await this.get(customerId);
    if (!customer) return null;
    const updated = { ...customer, balance: customer.balance + delta };
    return this.save(updated);
  }
}

export class SalesOrderModel extends BaseModel<SalesOrder> {
  private ledgerModel: LedgerModel;
  private stockMoveModel: StockMoveModel;
  private customerModel: CustomerModel;

  constructor(
    config: ModelConfig,
    ledgerModel: LedgerModel,
    stockMoveModel: StockMoveModel,
    customerModel: CustomerModel
  ) {
    super('sales_orders', config);
    this.ledgerModel = ledgerModel;
    this.stockMoveModel = stockMoveModel;
    this.customerModel = customerModel;
  }

  create(data: Omit<SalesOrder, keyof BaseRecord>): SalesOrder {
    return {
      ...(this.buildBase() as SalesOrder),
      reference: `SO-${Date.now()}`,
      invoice_id: '',
      ...data,
    };
  }

  buildLine(data: Omit<SalesOrderLine, 'id' | 'total'>): SalesOrderLine {
    const subtotal = data.quantity * data.unit_price;
    const discounted = subtotal - (subtotal * (data.discount / 100));
    return { id: v4(), total: discounted, ...data };
  }

  computeTotals(lines: SalesOrderLine[], taxRate = 0.15) {
    const subtotal = lines.reduce((s, l) => s + l.total, 0);
    const tax_amount = subtotal * taxRate;
    return { subtotal, tax_amount, total: subtotal + tax_amount };
  }

  // Sales-Finance Hook
  protected async beforeSave(record: SalesOrder): Promise<void> {
    if (record.status !== 'active') return;

    const previous = await this.get(record.id);
    if (previous?.status === 'active') return;

    // Update customer balance
    await this.customerModel.updateBalance(record.customer_id, record.total);

    // Create revenue ledger entry
    const entry = this.ledgerModel.create({
      reference: record.reference,
      entry_date: new Date().toISOString().split('T')[0],
      description: `Revenue from SO: ${record.reference}`,
      debit_account: 'accounts_receivable',
      credit_account: 'sales_revenue',
      amount: record.total,
      currency: record.currency,
      source_document: record.id,
      source_module: 'sales_orders',
    });
    entry.status = 'active';
    await this.ledgerModel.save(entry);

    // Move stock out per line
    for (const line of record.lines) {
      const move = this.stockMoveModel.create({
        product_id: line.product_id,
        product_name: line.product_name,
        move_type: 'out',
        quantity: line.quantity,
        from_warehouse_id: record.warehouse_id,
        to_warehouse_id: '',
        unit_cost: line.unit_price,
        source_document: record.reference,
        notes: `Delivered for SO: ${record.reference}`,
        reference: `${record.reference}-OUT-${line.product_id}`,
        status: 'active',
      });
      await this.stockMoveModel.save(move);
    }
  }
}

export class InvoiceModel extends BaseModel<Invoice> {
  constructor(config: ModelConfig) {
    super('invoices', config);
  }

  create(data: Omit<Invoice, keyof BaseRecord>): Invoice {
    return {
      ...(this.buildBase() as Invoice),
      reference: `INV-${Date.now()}`,
      amount_paid: 0,
      ...data,
    };
  }

  fromSalesOrder(order: SalesOrder): Invoice {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    return this.create({
      sales_order_id: order.id,
      customer_id: order.customer_id,
      customer_name: order.customer_name,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      lines: order.lines,
      subtotal: order.subtotal,
      tax_amount: order.tax_amount,
      total: order.total,
      amount_due: order.total,
      currency: order.currency,
    });
  }
}
