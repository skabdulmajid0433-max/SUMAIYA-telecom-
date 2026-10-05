import React, { useState } from 'react';
import {
  LayoutDashboard,
  Wrench,
  ShoppingCart,
  Package,
  Menu,
  X,
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
import { NavigationTab } from './DesktopSidebar';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';

interface MobileBottomNavProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ currentTab, onSelectTab }) => {
  const { lowStockProducts, pendingRepairsCount } = useShop();
  const { canAccessFinances, canManageSettings, canManageStaff } = useAuth();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const handleSelect = (tab: NavigationTab) => {
    onSelectTab(tab);
    setShowMoreMenu(false);
  };

  const moreItems = [
    { id: 'customers' as NavigationTab, label: 'Customers', icon: Users },
    { id: 'dues' as NavigationTab, label: 'Customer Dues', icon: CreditCard },
    { id: 'stock-ledger' as NavigationTab, label: 'Stock Ledger', icon: History },
    { id: 'suppliers' as NavigationTab, label: 'Suppliers & Purchases', icon: Truck, hidden: !canAccessFinances },
    { id: 'staff' as NavigationTab, label: 'Staff & Wages', icon: UserCheck, hidden: !canManageStaff },
    { id: 'expenses' as NavigationTab, label: 'Shop Expenses', icon: Receipt, hidden: !canAccessFinances },
    { id: 'reports' as NavigationTab, label: 'Reports & P&L', icon: BarChart3, hidden: !canAccessFinances },
    { id: 'settings' as NavigationTab, label: 'Settings & Backup', icon: Settings, hidden: !canManageSettings },
    { id: 'audit' as NavigationTab, label: 'Audit Trail', icon: ShieldCheck, hidden: !canManageSettings }
  ];

  return (
    <>
      {/* Mobile Drawer Modal for "More" */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-black/60 backdrop-blur-xs">
          <div className="bg-slate-900 border-t border-slate-800 rounded-t-2xl p-4 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="font-bold text-white text-base">More Features</span>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mt-3">
              {moreItems
                .filter((i) => !i.hidden)
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      className={`flex items-center space-x-3 p-3 rounded-xl text-left border transition ${
                        isActive
                          ? 'bg-blue-600 text-white border-blue-500 font-semibold'
                          : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700/60'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-medium">{item.label}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-1 shadow-2xl safe-area-bottom">
        <div className="flex items-center justify-around">
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`flex flex-col items-center py-1.5 px-2 rounded-lg transition ${
              currentTab === 'dashboard' ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-medium">Home</span>
          </button>

          <button
            onClick={() => onSelectTab('repairs')}
            className={`relative flex flex-col items-center py-1.5 px-2 rounded-lg transition ${
              currentTab === 'repairs' ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wrench className="w-5 h-5" />
            {pendingRepairsCount > 0 && (
              <span className="absolute top-1 right-2 w-4 h-4 bg-blue-600 text-white font-bold text-[9px] rounded-full flex items-center justify-center">
                {pendingRepairsCount}
              </span>
            )}
            <span className="text-[10px] mt-1 font-medium">Repairs</span>
          </button>

          {/* POS Bill Center Action */}
          <button
            onClick={() => onSelectTab('pos')}
            className="flex flex-col items-center -mt-4 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-3 rounded-full shadow-lg shadow-blue-500/40 active:scale-95 transition"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="sr-only">POS Sale</span>
          </button>

          <button
            onClick={() => onSelectTab('inventory')}
            className={`relative flex flex-col items-center py-1.5 px-2 rounded-lg transition ${
              currentTab === 'inventory' ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-5 h-5" />
            {lowStockProducts.length > 0 && (
              <span className="absolute top-1 right-2 w-4 h-4 bg-amber-500 text-slate-900 font-bold text-[9px] rounded-full flex items-center justify-center">
                {lowStockProducts.length}
              </span>
            )}
            <span className="text-[10px] mt-1 font-medium">Stock</span>
          </button>

          <button
            onClick={() => setShowMoreMenu(true)}
            className={`flex flex-col items-center py-1.5 px-2 rounded-lg transition ${
              showMoreMenu ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-medium">More</span>
          </button>
        </div>
      </nav>
    </>
  );
};
