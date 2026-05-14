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
  Truck,
} from 'lucide-react';
import { useERP } from '../context/erp-engine';

export type Module =
  | 'dashboard'
  | 'purchases'
  | 'inventory'
  | 'manufacturing'
  | 'sales'
  | 'finance'
  | 'employees'
  | 'warehouses';

interface NavItem {
  id: Module;
  label: string;
  icon: React.ElementType;
  group: string;
}

const NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'main' },
  { id: 'purchases', label: 'Purchases', icon: ShoppingCart, group: 'operations' },
  { id: 'inventory', label: 'Inventory', icon: Package, group: 'operations' },
  { id: 'warehouses', label: 'Warehouses', icon: Warehouse, group: 'operations' },
  { id: 'manufacturing', label: 'Manufacturing', icon: Factory, group: 'production' },
  { id: 'employees', label: 'Employees', icon: Users, group: 'production' },
  { id: 'sales', label: 'Sales', icon: TrendingUp, group: 'revenue' },
  { id: 'finance', label: 'Finance', icon: DollarSign, group: 'revenue' },
];

const GROUP_LABELS: Record<string, string> = {
  main: '',
  operations: 'Operations',
  production: 'Production',
  revenue: 'Revenue',
};

interface SidebarProps {
  active: Module;
  onNavigate: (m: Module) => void;
}

export default function Sidebar({ active, onNavigate }: SidebarProps) {
  const { engine, pendingSync, logout } = useERP();

  const groups = [...new Set(NAV.map((n) => n.group))];

  return (
    <aside className="w-60 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0">
      {/* Header */}
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-white font-semibold text-sm leading-tight">Maamoul ERP</div>
            <div className="text-slate-500 text-xs truncate max-w-[120px]">
              {engine?.tenant.name}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {groups.map((group) => (
          <div key={group}>
            {GROUP_LABELS[group] && (
              <div className="text-xs font-semibold text-slate-600 uppercase tracking-widest px-2 mb-1.5">
                {GROUP_LABELS[group]}
              </div>
            )}
            <div className="space-y-0.5">
              {NAV.filter((n) => n.group === group).map((item) => {
                const Icon = item.icon;
                const isActive = active === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white font-medium'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
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

      {/* Footer */}
      <div className="px-3 py-4 border-t border-slate-800 space-y-1">
        {/* Sync status */}
        <div className="flex items-center gap-2.5 px-3 py-2 text-xs">
          {pendingSync > 0 ? (
            <>
              <CloudOff className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-amber-500">{pendingSync} pending sync</span>
            </>
          ) : (
            <>
              <Cloud className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-500">Synced to GitHub</span>
            </>
          )}
        </div>

        <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
          <Settings className="w-4 h-4" />
          Settings
        </button>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
