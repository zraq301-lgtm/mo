import { useState } from 'react';
import { ERPProvider, useERP } from './context/erp-engine';
import LoginScreen from './components/LoginScreen';
import Sidebar, { Module } from './components/Sidebar';
import Dashboard from './components/Dashboard';
import InventoryModule from './modules/InventoryModule';
import SalesModule from './modules/SalesModule';
import PurchasesModule from './modules/PurchasesModule';
import ManufacturingModule from './modules/ManufacturingModule';
import EmployeesModule from './modules/EmployeesModule';
import FinanceModule from './modules/FinanceModule';
import WarehousesModule from './modules/WarehousesModule';

function ERPApp() {
  const { engine } = useERP();
  const [module, setModule] = useState<Module>('dashboard');

  if (!engine) return <LoginScreen />;

  const renderModule = () => {
    switch (module) {
      case 'dashboard': return <Dashboard />;
      case 'inventory': return <InventoryModule />;
      case 'sales': return <SalesModule />;
      case 'purchases': return <PurchasesModule />;
      case 'manufacturing': return <ManufacturingModule />;
      case 'employees': return <EmployeesModule />;
      case 'finance': return <FinanceModule />;
      case 'warehouses': return <WarehousesModule />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <Sidebar active={module} onNavigate={setModule} />
      <main className="flex-1 overflow-y-auto">
        {renderModule()}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ERPProvider>
      <ERPApp />
    </ERPProvider>
  );
}
