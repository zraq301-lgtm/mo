import { motion, AnimatePresence } from 'framer-motion'; // 1. استيراد المكتبة
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
  X // استيراد أيقونة الإغلاق
} from 'lucide-react';
import { useERP } from '../context/erp-engine';

// ... (نفس كائن AR_LANG و NAV و Module و NavItem بدون تغيير)

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
    pending: 'قيد المزامنة',
    synced: 'تم المزامنة مع GitHub',
    settings: 'الإعدادات',
    logout: 'تسجيل الخروج'
  }
};

export type Module = 'dashboard' | 'purchases' | 'inventory' | 'manufacturing' | 'sales' | 'finance' | 'employees' | 'warehouses';

interface SidebarProps {
  active: Module;
  onNavigate: (m: Module) => void;
  isOpen: boolean; // 2. خاصية لمعرفة هل القائمة مفتوحة
  onClose: () => void; // 3. دالة لإغلاق القائمة
}

export default function Sidebar({ active, onNavigate, isOpen, onClose }: SidebarProps) {
  const { engine, pendingSync, logout } = useERP();
  const groups = [...new Set(NAV.map((n) => n.group))];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* خلفية معتمة عند فتح القائمة */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* القائمة المتحركة */}
          <motion.aside
            initial={{ x: '100%' }} // تبدأ من اليمين خارج الشاشة
            animate={{ x: 0 }}       // تدخل للشاشة
            exit={{ x: '100%' }}    // تخرج لليمين عند الإغلاق
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            dir="rtl"
            className="fixed right-0 top-0 w-64 bg-slate-900 border-l border-slate-800 flex flex-col h-full z-50 shadow-2xl"
          >
            {/* Header مع زر إغلاق */}
            <div className="px-5 py-5 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div className="text-white font-semibold text-sm leading-tight">معمول ERP</div>
              </div>
              <button onClick={onClose} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
              {groups.map((group) => (
                <div key={group}>
                  {AR_LANG.groups[group as keyof typeof AR_LANG.groups] && (
                    <div className="text-xs font-semibold text-slate-600 uppercase tracking-widest px-2 mb-1.5 text-right">
                      {AR_LANG.groups[group as keyof typeof AR_LANG.groups]}
                    </div>
                  )}
                  <div className="space-y-0.5">
                    {NAV.filter((n) => n.group === group).map((item) => {
                      const Icon = item.icon;
                      const isActive = active === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => { onNavigate(item.id); onClose(); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                            isActive ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Footer كما هو */}
            <div className="px-3 py-4 border-t border-slate-800 space-y-1">
               <div className="flex items-center gap-2.5 px-3 py-2 text-xs">
                {pendingSync > 0 ? (
                  <>
                    <CloudOff className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-amber-500">{pendingSync} معلق مزامنة</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-500">{AR_LANG.status.synced}</span>
                  </>
                )}
              </div>
              <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                <Settings className="w-4 h-4" />
                {AR_LANG.status.settings}
              </button>
              <button onClick={logout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all">
                <LogOut className="w-4 h-4" />
                {AR_LANG.status.logout}
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
