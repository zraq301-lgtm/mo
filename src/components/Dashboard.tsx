import { useEffect, useState } from 'react';
import { useERP } from '../context/erp-engine';
import { TrendingUp, Package, Factory, ShoppingCart, DollarSign, Users, AlertTriangle, GitCommitVertical as GitCommit } from 'lucide-react';
import { Product } from '../models/inventory.model';
import { SalesOrder } from '../models/sales.model';
import { ManufacturingOrder } from '../models/manufacturing.model';
import { Expense } from '../models/finance.model';

interface Stats {
  totalProducts: number;
  lowStockCount: number;
  openSalesOrders: number;
  openManufacturingOrders: number;
  totalEmployees: number;
  totalExpenses: number;
  recentSales: SalesOrder[];
}

export default function Dashboard() {
  const { engine } = useERP();
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    lowStockCount: 0,
    openSalesOrders: 0,
    openManufacturingOrders: 0,
    totalEmployees: 0,
    totalExpenses: 0,
    recentSales: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!engine) return;
    (async () => {
      try {
        const [products, salesOrders, mfgOrders, employees, expenses] = await Promise.all([
          engine.products.list() as Promise<Product[]>,
          engine.salesOrders.list() as Promise<SalesOrder[]>,
          engine.manufacturingOrders.list() as Promise<ManufacturingOrder[]>,
          engine.employees.list(),
          engine.expenses.list() as Promise<Expense[]>,
        ]);

        const activeSales = salesOrders.filter((s) => s.status !== 'archived');
        setStats({
          totalProducts: products.filter((p) => p.status === 'active').length,
          lowStockCount: products.filter(
            (p) => p.status === 'active' && p.current_stock <= p.reorder_point
          ).length,
          openSalesOrders: activeSales.filter((s) => s.status === 'draft').length,
          openManufacturingOrders: mfgOrders.filter((m) => m.status === 'draft').length,
          totalEmployees: employees.filter((e) => e.status === 'active').length,
          totalExpenses: expenses
            .filter((e) => e.status === 'active')
            .reduce((s, e) => s + e.amount, 0),
          recentSales: activeSales.slice(-5).reverse(),
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [engine]);

  const cards = [
    { label: 'Active Products', value: stats.totalProducts, icon: Package, color: 'text-blue-400', bg: 'bg-blue-950' },
    { label: 'Low Stock Alerts', value: stats.lowStockCount, icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-950' },
    { label: 'Open Sales Orders', value: stats.openSalesOrders, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-950' },
    { label: 'Mfg. Orders', value: stats.openManufacturingOrders, icon: Factory, color: 'text-cyan-400', bg: 'bg-cyan-950' },
    { label: 'Employees', value: stats.totalEmployees, icon: Users, color: 'text-violet-400', bg: 'bg-violet-950' },
    { label: 'Total Expenses', value: `$${stats.totalExpenses.toLocaleString()}`, icon: DollarSign, color: 'text-rose-400', bg: 'bg-rose-950' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500 text-sm">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-0.5">System overview for {engine?.tenant.name}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-slate-400 text-xs font-medium mb-1">{card.label}</div>
                  <div className="text-2xl font-bold text-white">{card.value}</div>
                </div>
                <div className={`${card.bg} p-2 rounded-lg`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Sales */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-white font-semibold text-sm">Recent Sales Orders</h2>
          <ShoppingCart className="w-4 h-4 text-slate-500" />
        </div>
        {stats.recentSales.length === 0 ? (
          <div className="px-5 py-8 text-center text-slate-500 text-sm">No sales orders yet</div>
        ) : (
          <div className="divide-y divide-slate-800">
            {stats.recentSales.map((sale) => (
              <div key={sale.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <div className="text-white text-sm font-medium">{sale.reference}</div>
                  <div className="text-slate-500 text-xs">{sale.customer_name}</div>
                </div>
                <div className="text-right">
                  <div className="text-white text-sm font-semibold">
                    ${sale.total?.toLocaleString()}
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      sale.status === 'active'
                        ? 'bg-emerald-950 text-emerald-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {sale.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* GitHub path info */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
          <GitCommit className="w-3.5 h-3.5" />
          <span className="font-medium text-slate-400">Storage Path</span>
        </div>
        <code className="text-xs text-slate-400 bg-slate-800 rounded px-2 py-1 block">
          shggy/database/{engine?.tenant.id}/{'{module}/{record_id}'}.json
        </code>
      </div>
    </div>
  );
}
