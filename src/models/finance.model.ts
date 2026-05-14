import { BaseModel, BaseRecord, ModelConfig } from '../lib/base-model';

export interface LedgerEntry extends BaseRecord {
  reference: string;
  entry_date: string;
  description: string;
  debit_account: string;
  credit_account: string;
  amount: number;
  currency: string;
  source_document: string;
  source_module: string;
}

export interface Expense extends BaseRecord {
  reference: string;
  expense_date: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  employee_id: string;
  approved_by: string;
  receipt_url: string;
}

export interface WasteRecord extends BaseRecord {
  reference: string;
  waste_date: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_cost: number;
  total_loss: number;
  reason: string;
  warehouse_id: string;
}

export class LedgerModel extends BaseModel<LedgerEntry> {
  constructor(config: ModelConfig) {
    super('ledger', config);
  }

  create(data: Omit<LedgerEntry, keyof BaseRecord>): LedgerEntry {
    return {
      ...(this.buildBase() as LedgerEntry),
      status: 'draft',
      ...data,
    };
  }

  async getBalance(account: string): Promise<{ debit: number; credit: number; net: number }> {
    const entries = (await this.list()) as LedgerEntry[];
    const active = entries.filter((e) => e.status === 'active');
    const debit = active
      .filter((e) => e.debit_account === account)
      .reduce((s, e) => s + e.amount, 0);
    const credit = active
      .filter((e) => e.credit_account === account)
      .reduce((s, e) => s + e.amount, 0);
    return { debit, credit, net: debit - credit };
  }
}

export class ExpenseModel extends BaseModel<Expense> {
  constructor(config: ModelConfig) {
    super('expenses', config);
  }

  create(data: Omit<Expense, keyof BaseRecord>): Expense {
    return {
      ...(this.buildBase() as Expense),
      reference: `EXP-${Date.now()}`,
      ...data,
    };
  }
}

export class WasteModel extends BaseModel<WasteRecord> {
  constructor(config: ModelConfig) {
    super('waste_records', config);
  }

  create(data: Omit<WasteRecord, keyof BaseRecord>): WasteRecord {
    const total_loss = (data.quantity ?? 0) * (data.unit_cost ?? 0);
    return {
      ...(this.buildBase() as WasteRecord),
      reference: `WST-${Date.now()}`,
      total_loss,
      ...data,
    };
  }
}
