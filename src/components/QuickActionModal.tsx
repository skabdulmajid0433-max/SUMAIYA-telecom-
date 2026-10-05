import React from 'react';
import {
  X,
  Wrench,
  ShoppingCart,
  UserPlus,
  PackagePlus,
  Truck,
  CreditCard,
  UserCheck,
  Receipt
} from 'lucide-react';
import { NavigationTab } from './DesktopSidebar';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (actionKey: string, targetTab: NavigationTab) => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  isOpen,
  onClose,
  onSelectAction
}) => {
  if (!isOpen) return null;

  const actions = [
    {
      key: 'new_repair',
      tab: 'repairs' as NavigationTab,
      title: 'New Repair Job',
      description: 'Intake mobile phone for screen, battery, or charging repair',
      icon: Wrench,
      color: 'from-blue-600 to-indigo-600',
      badge: 'Most Popular'
    },
    {
      key: 'new_sale',
      tab: 'pos' as NavigationTab,
      title: 'New Sale / POS Bill',
      description: 'Quick billing for mobile accessories, cables, chargers & parts',
      icon: ShoppingCart,
      color: 'from-emerald-600 to-teal-600',
      badge: 'Fast POS'
    },
    {
      key: 'new_customer',
      tab: 'customers' as NavigationTab,
      title: 'Add Customer',
      description: 'Register new customer profile and contact number',
      icon: UserPlus,
      color: 'from-cyan-600 to-blue-600'
    },
    {
      key: 'stock_in',
      tab: 'inventory' as NavigationTab,
      title: 'Add / Inward Stock',
      description: 'Increase inventory for LCDs, parts, or accessories',
      icon: PackagePlus,
      color: 'from-purple-600 to-pink-600'
    },
    {
      key: 'new_purchase',
      tab: 'purchases' as NavigationTab,
      title: 'Supplier Purchase',
      description: 'Record wholesale purchase invoice from supplier',
      icon: Truck,
      color: 'from-amber-600 to-orange-600'
    },
    {
      key: 'receive_payment',
      tab: 'dues' as NavigationTab,
      title: 'Receive Customer Due',
      description: 'Record customer payment against pending balances',
      icon: CreditCard,
      color: 'from-green-600 to-emerald-600'
    },
    {
      key: 'staff_attendance',
      tab: 'staff' as NavigationTab,
      title: 'Staff Attendance',
      description: 'Mark daily attendance and calculate daily wages',
      icon: UserCheck,
      color: 'from-violet-600 to-indigo-600'
    },
    {
      key: 'shop_expense',
      tab: 'expenses' as NavigationTab,
      title: 'Shop Expense',
      description: 'Record tea, electricity, rent, tools, or transport expense',
      icon: Receipt,
      color: 'from-rose-600 to-red-600'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-white">Quick Action Hub</h3>
            <p className="text-xs text-slate-400">
              Select an action to launch instantly
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Grid */}
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[75vh] overflow-y-auto">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.key}
                onClick={() => {
                  onSelectAction(act.key, act.tab);
                  onClose();
                }}
                className="flex items-start space-x-3 p-3.5 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/70 hover:border-slate-600 rounded-xl text-left transition group active:scale-[0.98]"
              >
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${act.color} text-white flex items-center justify-center flex-shrink-0 shadow-md`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-white group-hover:text-blue-300 transition">
                      {act.title}
                    </span>
                    {act.badge && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                        {act.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-snug line-clamp-2">
                    {act.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
