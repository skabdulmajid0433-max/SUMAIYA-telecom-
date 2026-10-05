import React from 'react';
import {
  LayoutDashboard,
  Wrench,
  ShoppingCart,
  Package,
  Users,
  CreditCard,
  Truck,
  UserCheck,
  Receipt,
  BarChart3,
  Settings,
  ShieldCheck,
  History
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';

export type NavigationTab =
  | 'dashboard'
  | 'repairs'
  | 'pos'
  | 'inventory'
  | 'stock-ledger'
  | 'customers'
  | 'dues'
  | 'suppliers'
  | 'purchases'
  | 'staff'
  | 'expenses'
  | 'reports'
  | 'settings'
  | 'audit';

interface DesktopSidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ currentTab, onSelectTab }) => {
  const { lowStockProducts, pendingRepairsCount, readyRepairsCount, stats } = useShop();
  const { canAccessFinances, canManageSettings, canManageStaff } = useAuth();

  const navItems = [
    {
      id: 'dashboard' as NavigationTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'repairs' as NavigationTab,
      label: 'Repair Jobs',
      icon: Wrench,
      badge: pendingRepairsCount > 0 ? `${pendingRepairsCount}` : null,
      badgeColor: 'bg-blue-600 text-white'
    },
    {
      id: 'pos' as NavigationTab,
      label: 'POS & Billing',
      icon: ShoppingCart,
      badge: 'Fast'
    },
    {
      id: 'inventory' as NavigationTab,
      label: 'Inventory & Stock',
      icon: Package,
      badge: lowStockProducts.length > 0 ? `${lowStockProducts.length} low` : null,
      badgeColor: 'bg-amber-500 text-slate-900 font-bold'
    },
    {
      id: 'stock-ledger' as NavigationTab,
      label: 'Stock Ledger',
      icon: History,
      badge: null
    },
    {
      id: 'customers' as NavigationTab,
      label: 'Customers',
      icon: Users,
      badge: null
    },
    {
      id: 'dues' as NavigationTab,
      label: 'Customer Dues',
      icon: CreditCard,
      badge: stats.customerOutstanding > 0 ? `₹${Math.round(stats.customerOutstanding)}` : null,
      badgeColor: 'bg-red-500/20 text-red-400 border border-red-500/40'
    },
    {
      id: 'suppliers' as NavigationTab,
      label: 'Simple Register & Suppliers',
      icon: Truck,
      badge: 'Simple',
      badgeColor: 'bg-amber-400 text-slate-950 font-black',
      hidden: !canAccessFinances
    },
    {
      id: 'staff' as NavigationTab,
      label: 'Staff & Wages',
      icon: UserCheck,
      badge: null,
      hidden: !canManageStaff
    },
    {
      id: 'expenses' as NavigationTab,
      label: 'Shop Expenses',
      icon: Receipt,
      badge: null,
      hidden: !canAccessFinances
    },
    {
      id: 'reports' as NavigationTab,
      label: 'Reports & P&L',
      icon: BarChart3,
      badge: null,
      hidden: !canAccessFinances
    },
    {
      id: 'settings' as NavigationTab,
      label: 'Settings & Backup',
      icon: Settings,
      badge: null,
      hidden: !canManageSettings
    },
    {
      id: 'audit' as NavigationTab,
      label: 'Audit Trail',
      icon: ShieldCheck,
      badge: null,
      hidden: !canManageSettings
    }
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 h-[calc(100vh-4rem)] sticky top-16 select-none">
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Main Menu
        </div>
        {navItems
          .filter((item) => !item.hidden)
          .map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      item.badgeColor || (isActive ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-300')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
      </div>

      {/* Shop Info Footer */}
      <div className="p-3 m-3 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs text-slate-400">
        <div className="font-semibold text-slate-200">Sumaiya telecom</div>
        <div className="text-[11px] text-slate-400 mt-0.5">Mobile Repairing & Accessories</div>
        <div className="mt-2 text-[10px] text-emerald-400 font-mono flex items-center justify-between">
          <span>● System Online</span>
          <span>v2.4 Pro</span>
        </div>
      </div>
    </aside>
  );
};
