import React, { useState } from 'react';
import {
  Wrench,
  Search,
  Bell,
  User as UserIcon,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  Phone,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onOpenGlobalSearch: () => void;
  onOpenQuickAction: () => void;
  onOpenNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenGlobalSearch,
  onOpenQuickAction
}) => {
  const { settings, lowStockProducts, pendingRepairsCount, readyRepairsCount, users } = useShop();
  const { currentUser, loginAsUser } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const totalNotifs = lowStockProducts.length + (readyRepairsCount > 0 ? 1 : 0);

  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Shop Logo & Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">
                  {settings.shopName || 'Sumaiya telecom'}
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-semibold tracking-wide bg-blue-500/20 text-blue-300 rounded border border-blue-500/30 uppercase">
                  Repair & Accessories
                </span>
              </div>
              <div className="text-xs text-slate-400 hidden sm:flex items-center space-x-2">
                <span>Owner: <strong className="text-slate-200">{settings.ownerName}</strong></span>
                <span>•</span>
                <span className="flex items-center text-emerald-400">
                  <Phone className="w-3 h-3 mr-1 inline" /> {settings.phone}
                </span>
              </div>
            </div>
          </div>

          {/* Search Trigger */}
          <div className="flex-1 max-w-md mx-3 hidden md:block">
            <button
              onClick={onOpenGlobalSearch}
              className="w-full flex items-center justify-between px-3.5 py-2 text-sm text-slate-400 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-lg shadow-inner transition group"
            >
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
                <span>Search customer, repair ID, IMEI, phone, stock...</span>
              </div>
              <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-slate-900 border border-slate-700 rounded text-slate-400">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Quick Actions & User Badges */}
          <div className="flex items-center space-x-2">
            {/* Mobile search icon */}
            <button
              onClick={onOpenGlobalSearch}
              className="md:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"
              title="Global Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Quick Action Button */}
            <button
              onClick={onOpenQuickAction}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs sm:text-sm px-3 py-2 rounded-lg shadow-sm hover:shadow transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Action</span>
              <span className="sm:hidden">+ New</span>
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {totalNotifs > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-amber-500 text-slate-950 font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse">
                    {totalNotifs}
                  </span>
                )}
              </button>

              {showNotifMenu && (
                <div
                  className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 text-slate-200"
                  onClick={() => setShowNotifMenu(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-700 flex justify-between items-center">
                    <span className="font-semibold text-xs text-slate-400 uppercase tracking-wider">
                      Shop Alerts
                    </span>
                    <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-300">
                      {totalNotifs} new
                    </span>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-700/60">
                    {readyRepairsCount > 0 && (
                      <div className="p-3 hover:bg-slate-700/40 flex items-start space-x-3">
                        <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-slate-100">
                            {readyRepairsCount} Repair(s) Ready for Delivery
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Phones ready for customer collection and final billing.
                          </p>
                        </div>
                      </div>
                    )}

                    {lowStockProducts.slice(0, 4).map((p) => (
                      <div key={p.id} className="p-3 hover:bg-slate-700/40 flex items-start space-x-3">
                        <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-slate-100">{p.name}</p>
                          <p className="text-[11px] text-amber-300/80">
                            Only {p.quantity} {p.unit} left! Min threshold: {p.minStockLevel}
                          </p>
                        </div>
                      </div>
                    ))}

                    {pendingRepairsCount > 0 && (
                      <div className="p-3 hover:bg-slate-700/40 flex items-start space-x-3">
                        <Clock className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-slate-100">
                            {pendingRepairsCount} Pending Repairs In Progress
                          </p>
                          <p className="text-[11px] text-slate-400">Check technician workbench queue.</p>
                        </div>
                      </div>
                    )}

                    {totalNotifs === 0 && (
                      <div className="p-4 text-center text-xs text-slate-400">
                        All systems smooth. No urgent alerts!
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Active User Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 pl-2 pr-3 py-1.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition"
              >
                <div className="w-7 h-7 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-300 flex items-center justify-center font-bold text-xs">
                  {currentUser?.name.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="hidden sm:block text-left text-xs">
                  <div className="font-medium text-slate-200 leading-tight truncate max-w-[110px]">
                    {currentUser?.name || 'Staff'}
                  </div>
                  <div className="text-[10px] text-blue-400 uppercase font-semibold">
                    {currentUser?.role || 'staff'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 text-slate-200">
                  <div className="px-4 py-2 border-b border-slate-700">
                    <p className="text-xs text-slate-400">Logged in as:</p>
                    <p className="text-sm font-semibold text-white">{currentUser?.name}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 text-[10px] bg-blue-900/60 text-blue-300 border border-blue-700 rounded uppercase font-semibold">
                      {currentUser?.role}
                    </span>
                  </div>

                  <div className="py-1">
                    <p className="px-4 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Switch Active User
                    </p>
                    {users.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          loginAsUser(u);
                          setShowUserMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-slate-700 transition ${
                          currentUser?.id === u.id ? 'bg-slate-700/60 text-blue-300 font-semibold' : 'text-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <UserIcon className="w-3.5 h-3.5" />
                          <span>{u.name}</span>
                        </div>
                        <span className="text-[10px] uppercase text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">
                          {u.role}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-slate-700 pt-1 mt-1">
                    <button
                      onClick={() => setShowUserMenu(false)}
                      className="w-full text-left px-4 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 flex items-center space-x-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Close Menu</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
