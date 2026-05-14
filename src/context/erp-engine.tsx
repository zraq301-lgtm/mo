import { createContext, useContext, useState, ReactNode } from 'react';
import { GitHubClient } from '../lib/github-client';
import { SyncManager } from '../lib/sync-manager';
import { ModelConfig } from '../lib/base-model';
import { VendorModel, PurchaseOrderModel } from '../models/vendor.model';
import { ProductModel, WarehouseModel, StockMoveModel } from '../models/inventory.model';
import { EmployeeModel, BOMModel, ManufacturingOrderModel } from '../models/manufacturing.model';
import { LedgerModel, ExpenseModel, WasteModel } from '../models/finance.model';
import { CustomerModel, SalesOrderModel, InvoiceModel } from '../models/sales.model';

export interface Tenant {
  id: string;
  name: string;
  githubToken: string;
  userId: string;
}

export interface ERPEngine {
  tenant: Tenant;
  vendors: VendorModel;
  purchaseOrders: PurchaseOrderModel;
  products: ProductModel;
  warehouses: WarehouseModel;
  stockMoves: StockMoveModel;
  employees: EmployeeModel;
  bom: BOMModel;
  manufacturingOrders: ManufacturingOrderModel;
  customers: CustomerModel;
  salesOrders: SalesOrderModel;
  invoices: InvoiceModel;
  ledger: LedgerModel;
  expenses: ExpenseModel;
  waste: WasteModel;
  syncManager: SyncManager;
}

function buildEngine(tenant: Tenant): ERPEngine {
  const github = new GitHubClient(tenant.githubToken);
  const syncManager = new SyncManager();

  const config: ModelConfig = {
    tenantId: tenant.id,
    userId: tenant.userId,
    githubClient: github,
    syncManager,
  };

  const ledger = new LedgerModel(config);
  const products = new ProductModel(config);
  const stockMoves = new StockMoveModel(config, products);
  const customers = new CustomerModel(config);
  const invoices = new InvoiceModel(config);
  const salesOrders = new SalesOrderModel(config, ledger, stockMoves, customers);
  const manufacturingOrders = new ManufacturingOrderModel(config, stockMoves, products);

  return {
    tenant,
    vendors: new VendorModel(config),
    purchaseOrders: new PurchaseOrderModel(config),
    products,
    warehouses: new WarehouseModel(config),
    stockMoves,
    employees: new EmployeeModel(config),
    bom: new BOMModel(config),
    manufacturingOrders,
    customers,
    salesOrders,
    invoices,
    ledger,
    expenses: new ExpenseModel(config),
    waste: new WasteModel(config),
    syncManager,
  };
}

interface ERPContextValue {
  engine: ERPEngine | null;
  pendingSync: number;
  login: (tenant: Tenant) => void;
  logout: () => void;
}

const ERPContext = createContext<ERPContextValue>({
  engine: null,
  pendingSync: 0,
  login: () => {},
  logout: () => {},
});

const TENANT_KEY = 'maamoul:tenant';

export function ERPProvider({ children }: { children: ReactNode }) {
  const [engine, setEngine] = useState<ERPEngine | null>(() => {
    const raw = localStorage.getItem(TENANT_KEY);
    if (!raw) return null;
    try {
      const tenant = JSON.parse(raw) as Tenant;
      return buildEngine(tenant);
    } catch {
      return null;
    }
  });

  const [pendingSync, setPendingSync] = useState(() => {
    const raw = localStorage.getItem(TENANT_KEY);
    if (!raw) return 0;
    try {
      const tenant = JSON.parse(raw) as Tenant;
      const sm = new SyncManager();
      return sm.getPendingSyncCount();
    } catch {
      return 0;
    }
  });

  const login = (tenant: Tenant) => {
    localStorage.setItem(TENANT_KEY, JSON.stringify(tenant));
    const newEngine = buildEngine(tenant);
    setEngine(newEngine);
    setPendingSync(newEngine.syncManager.getPendingSyncCount());
  };

  const logout = () => {
    localStorage.removeItem(TENANT_KEY);
    setEngine(null);
  };

  return (
    <ERPContext.Provider value={{ engine, pendingSync, login, logout }}>
      {children}
    </ERPContext.Provider>
  );
}

export function useERP() {
  return useContext(ERPContext);
}
