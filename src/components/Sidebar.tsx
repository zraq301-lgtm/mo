import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Factory,
  TrendingUp,
  DollarSign,
  Users,
  Warehouse,
  FileText,
  Settings,
  LogOut,
  CloudOff,
  Cloud,
  X
} from 'lucide-react';
import { useERP } from '../context/erp-engine';

// 1. تعريف أنواع الموديلات
export type Module = 'dashboard' | 'purchases' | 'inventory' | 'manufacturing' | 'sales' | 'finance' | 'employees' | 'warehouses';

// 2. كائن الترجمة العربية
const AR_LANG = {
  modules: {
    dashboard: 'لوحة التحكم',
    purchases: 'المشتريات',
    inventory: 'المخزون',
    warehouses: 'المستودعات',
    manufacturing: 'أوامر التصنيع',
    employees: 'الموظفين',
    sales: 'المبيعات',
    finance: 'المالية',
  },
  groups: {
    main: 'الرئيسية',
    operations: 'العمليات',
    production: 'الإنتاج',
    revenue: 'الإيرادات',
  },
  status: {
    pending: 'معلق مزامنة',
    synced: 'تم المزامنة مع GitHub',
    settings: 'الإعدادات',
    logout: 'تسجيل الخروج'
  }
};

// 3. مصفوفة الروابط (NAV) - كانت مفقودة وهي سبب الشاشة السوداء
const NAV = [
  { id: 'dashboard', label: AR_LANG.modules.dashboard, icon: LayoutDashboard, group: 'main' },
  { id: 'purchases', label: AR_LANG.modules.purchases, icon: ShoppingCart, group: 'operations' },
  { id: 'inventory', label: AR_LANG.modules.inventory, icon: Package, group: 'operations' },
  { id: 'warehouses', label: AR_LANG.modules.warehouses, icon: Warehouse, group: 'operations' },
  { id: 'manufacturing', label: AR_LANG.modules.manufacturing, icon: Factory, group: 'production' },
  { id: 'employees', label: AR_LANG.modules.employees, icon: Users, group: 'production' },
  { id: 'sales', label: AR_LANG.modules.sales, icon: TrendingUp, group: 'revenue' },
  { id: 'finance', label: AR_LANG.modules.finance, icon: DollarSign, group: 'revenue' },
];

interface SidebarProps {
  active: Module;
  onNavigate: (m: Module) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ active, onNavigate, isOpen, onClose }: SidebarProps) {
  const { engine, pendingSync, logout } = useERP();
  
  // استخراج المجموعات الفريدة
  const groups = ['main', 'operations', 'production', 'revenue'];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* خلفية معتمة (Overlay) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* القائمة الجانبية (Sidebar) */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            dir="rtl"
            className="fixed right-0 top-0 w-72 bg-slate-900 border-l border-slate-800 flex flex-col h-full z-50 shadow-2xl"
          >
            {/* Header */}
            <div className="px-6 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/20">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-white font-bold text-sm leading-tight">معمول ERP</div>
                  <div className="text-slate-500 text-[10px] font-medium tracking-wider uppercase">نواة AI-OS</div>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Body */}
            <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-7 custom-scrollbar">
              {groups.map((group) => (
                <div key={group} className="space-y-2">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-3 mb-3 text-right">
                    {AR_LANG.groups[group as keyof typeof AR_LANG.groups]}
                  </div>
                  <div className="space-y-1">
                    {NAV.filter((n) => n.group === group).map((item) => {
                      const Icon = item.icon;
                      const isActive = active === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onNavigate(item.id as Module);
                            onClose();
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                            isActive 
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 font-semibold' 
                              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Footer Section */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-2">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/30">
                {pendingSync > 0 ? (
                  <>
                    <div className="relative">
                      <CloudOff className="w-4 h-4 text-amber-500" />
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full animate-ping" />
                    </div>
                    <span className="text-xs font-medium text-amber-500">{pendingSync} {AR_LANG.status.pending}</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-medium text-emerald-500">{AR_LANG.status.synced}</span>
                  </>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button className="flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                  <Settings className="w-4 h-4" />
                  <span>{AR_LANG.status.settings}</span>
                </button>
                <button 
                  onClick={logout}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-950/20 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{AR_LANG.status.logout}</span>
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
