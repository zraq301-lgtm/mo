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
import { Menu } from 'lucide-react'; // استيراد أيقونة القائمة

function ERPApp() {
  const { engine } = useERP();
  const [module, setModule] = useState<Module>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // التحكم في فتح وإغلاق القائمة

  // إذا لم يتم تسجيل الدخول، تظهر شاشة الدخول
  if (!engine) return <LoginScreen />;

  // اختيار الموديول المناسب للعرض
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
    <div className="flex h-screen bg-slate-950 overflow-hidden" dir="rtl">
      {/* زر الهامبرجر - يظهر فقط في الموبايل لفتح القائمة */}
      <button 
        onClick={() => setIsSidebarOpen(true)}
        className="fixed top-4 right-4 z-30 p-2 bg-slate-900 border border-slate-800 rounded-lg lg:hidden text-slate-400 hover:text-white"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* القائمة الجانبية - مررنا لها الخصائص الجديدة للتحكم في الظهور */}
      <Sidebar 
        active={module} 
        onNavigate={(m) => {
          setModule(m);
          setIsSidebarOpen(false); // غلق القائمة تلقائياً بعد اختيار موديول (للموبايل)
        }} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* المحتوى الرئيسي */}
      <main className="flex-1 relative overflow-y-auto custom-scrollbar">
        <div className="min-h-full w-full">
          {renderModule()}
        </div>
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
