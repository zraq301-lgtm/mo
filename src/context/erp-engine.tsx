import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { GitHubClient } from '../lib/github-client';
import { SyncManager } from '../lib/sync-manager';
import { ModelConfig } from '../lib/base-model';

// استيراد الموديلات - تأكد أن المسارات صحيحة في مشروعك
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

// --- البيانات التي ستجعل التطبيق يفتح فوراً ولا يعطي صفحة بيضاء ---
const INITIAL_DATA: Tenant = {
  id: 'nawah-core',
  name: 'مصنع المعلم',
  githubToken: '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', // التوكن الخاص بك
  userId: 'admin'
};

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

  return {
    tenant,
    vendors: new VendorModel(config),
    purchaseOrders: new PurchaseOrderModel(config),
    products,
    warehouses: new WarehouseModel(config),
    stockMoves,
    employees: new EmployeeModel(config),
    bom: new BOMModel(config),
    manufacturingOrders: new ManufacturingOrderModel(config, stockMoves, products),
    customers,
    salesOrders: new SalesOrderModel(config, ledger, stockMoves, customers),
    invoices: new InvoiceModel(config),
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

export function ERPProvider({ children }: { children: ReactNode }) {
  // هنا نضمن عدم ظهور الصفحة البيضاء بإعطاء قيمة ابتدائية صحيحة دائماً
  const [engine, setEngine] = useState<ERPEngine | null>(() => buildEngine(INITIAL_DATA));
  const [pendingSync, setPendingSync] = useState(0);

  useEffect(() => {
    if (engine) {
      const interval = setInterval(() => {
        setPendingSync(engine.syncManager.getPendingSyncCount());
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [engine]);

  const login = (tenant: Tenant) => {
    setEngine(buildEngine(tenant));
  };

  const logout = () => {
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
