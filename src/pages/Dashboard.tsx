import React from 'react';
import {
  TrendingUp,
  Wrench,
  CreditCard,
  Package,
  AlertTriangle,
  Receipt,
  Users,
  CheckCircle,
  Clock,
  Truck,
  Plus,
  ArrowRight,
  Phone,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { NavigationTab } from '../components/DesktopSidebar';

interface DashboardProps {
  onNavigate: (tab: NavigationTab, meta?: any) => void;
  onOpenQuickAction: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onOpenQuickAction }) => {
  const {
    settings,
    stats,
    repairs,
    lowStockProducts,
    invoices,
    formatCurrency,
    formatDate
  } = useShop();

  const recentRepairs = repairs.slice(0, 5);
  const urgentRepairs = repairs.filter(
    (r) => r.active && (r.priority === 'Urgent' || r.status === 'Ready')
  ).slice(0, 4);

  const overdueInvoices = invoices.filter((inv) => inv.dueAmount > 0).slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full">
                Shop Operations Center
              </span>
              <span className="text-xs text-slate-400">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-tight">
              {settings.shopName || 'Sumaiya telecom'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Owner: <strong className="text-white">{settings.ownerName}</strong> • Phone & WhatsApp: <strong className="text-emerald-400">{settings.phone}</strong>
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => onNavigate('repairs', { openNewModal: true })}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center space-x-2 shadow-lg shadow-blue-600/30 active:scale-95 transition"
            >
              <Wrench className="w-4 h-4" />
              <span>+ New Repair</span>
            </button>
            <button
              onClick={() => onNavigate('pos')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center space-x-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Sale / Bill</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Action Ribbon */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1.5 scrollbar-thin">
        {[
          { label: '+ Repair Job', tab: 'repairs' as NavigationTab, meta: { openNewModal: true }, color: 'bg-blue-900/40 border-blue-700/50 text-blue-300' },
          { label: '+ Sale / POS', tab: 'pos' as NavigationTab, color: 'bg-emerald-900/40 border-emerald-700/50 text-emerald-300' },
          { label: '+ Add Stock', tab: 'inventory' as NavigationTab, meta: { openAddModal: true }, color: 'bg-purple-900/40 border-purple-700/50 text-purple-300' },
          { label: '+ Customer Due', tab: 'dues' as NavigationTab, color: 'bg-amber-900/40 border-amber-700/50 text-amber-300' },
          { label: '+ Purchase', tab: 'purchases' as NavigationTab, meta: { openNewPurchase: true }, color: 'bg-cyan-900/40 border-cyan-700/50 text-cyan-300' },
          { label: '+ Attendance', tab: 'staff' as NavigationTab, color: 'bg-indigo-900/40 border-indigo-700/50 text-indigo-300' },
          { label: '+ Expense', tab: 'expenses' as NavigationTab, meta: { openAddExpense: true }, color: 'bg-rose-900/40 border-rose-700/50 text-rose-300' }
        ].map((btn, idx) => (
          <button
            key={idx}
            onClick={() => onNavigate(btn.tab, btn.meta)}
            className={`whitespace-nowrap px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition hover:brightness-125 flex-shrink-0 ${btn.color}`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Today's Sales */}
        <div
          onClick={() => onNavigate('pos')}
          className="bg-slate-900 p-4 rounded-2xl border border-slate-800 hover:border-slate-700 cursor-pointer transition shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Today's Sales</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white mt-1.5">
            {formatCurrency(stats.todaySales)}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center">
            <span>Direct accessories & parts</span>
          </div>
        </div>

        {/* Today's Repair Income */}
        <div
          onClick={() => onNavigate('repairs')}
          className="bg-slate-900 p-4 rounded-2xl border border-slate-800 hover:border-slate-700 cursor-pointer transition shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Repair Income</span>
            <Wrench className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white mt-1.5">
            {formatCurrency(stats.todayRepairIncome)}
          </div>
          <div className="text-[11px] text-blue-400 mt-1">
            <span>Labor & fitted spares</span>
          </div>
        </div>

        {/* Customer Outstanding */}
        <div
          onClick={() => onNavigate('dues')}
          className="bg-slate-900 p-4 rounded-2xl border border-slate-800 hover:border-red-900/50 cursor-pointer transition shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Customer Dues</span>
            <CreditCard className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-red-400 mt-1.5">
            {formatCurrency(stats.customerOutstanding)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            <span>Pending collection</span>
          </div>
        </div>

        {/* Supplier Outstanding */}
        <div
          onClick={() => onNavigate('suppliers')}
          className="bg-slate-900 p-4 rounded-2xl border border-slate-800 hover:border-slate-700 cursor-pointer transition shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Supplier Dues</span>
            <Truck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-300 mt-1.5">
            {formatCurrency(stats.supplierOutstanding)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            <span>Payable to suppliers</span>
          </div>
        </div>

        {/* Total Stock Value */}
        <div
          onClick={() => onNavigate('inventory')}
          className="bg-slate-900 p-4 rounded-2xl border border-slate-800 hover:border-slate-700 cursor-pointer transition shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Stock Value</span>
            <Package className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white mt-1.5">
            {formatCurrency(stats.totalStockValue)}
          </div>
          <div className="text-[11px] text-purple-300 mt-1">
            <span>At purchase cost</span>
          </div>
        </div>

        {/* Low Stock Items */}
        <div
          onClick={() => onNavigate('inventory')}
          className="bg-slate-900 p-4 rounded-2xl border border-slate-800 hover:border-slate-700 cursor-pointer transition shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Low Stock Items</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-400 mt-1.5">
            {lowStockProducts.length} Items
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            <span>Need supplier reorder</span>
          </div>
        </div>

        {/* Today's Expenses */}
        <div
          onClick={() => onNavigate('expenses')}
          className="bg-slate-900 p-4 rounded-2xl border border-slate-800 hover:border-slate-700 cursor-pointer transition shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Today's Expenses</span>
            <Receipt className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white mt-1.5">
            {formatCurrency(stats.todayExpenses)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            <span>Tea, rent & shop running</span>
          </div>
        </div>

        {/* Staff Present */}
        <div
          onClick={() => onNavigate('staff')}
          className="bg-slate-900 p-4 rounded-2xl border border-slate-800 hover:border-slate-700 cursor-pointer transition shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Staff Present</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white mt-1.5">
            {stats.todayStaffPresent} Active
          </div>
          <div className="text-[11px] text-emerald-400 mt-1">
            <span>Attendance marked</span>
          </div>
        </div>
      </div>

      {/* Repair Workbench Pipeline Counter */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Wrench className="w-5 h-5 text-blue-400" />
            <h2 className="font-bold text-base text-white">Repair Jobs Status Pipeline</h2>
          </div>
          <button
            onClick={() => onNavigate('repairs')}
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center space-x-1"
          >
            <span>View All Repairs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            onClick={() => onNavigate('repairs', { filterStatus: 'Pending' })}
            className="p-3 bg-blue-950/40 border border-blue-800/40 rounded-xl cursor-pointer hover:bg-blue-900/30 transition"
          >
            <span className="text-[11px] text-blue-300 uppercase font-semibold">Under Repair / Queue</span>
            <div className="text-2xl font-black text-white mt-1">{stats.pendingRepairs}</div>
            <span className="text-[10px] text-slate-400">On technician desk</span>
          </div>

          <div
            onClick={() => onNavigate('repairs', { filterStatus: 'Ready' })}
            className="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-xl cursor-pointer hover:bg-emerald-900/30 transition"
          >
            <span className="text-[11px] text-emerald-300 uppercase font-semibold">Ready for Delivery</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">{stats.completedRepairs}</div>
            <span className="text-[10px] text-emerald-400/80">Ready to collect</span>
          </div>

          <div
            onClick={() => onNavigate('repairs', { filterStatus: 'Delivered' })}
            className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl cursor-pointer hover:bg-slate-800 transition"
          >
            <span className="text-[11px] text-slate-300 uppercase font-semibold">Delivered</span>
            <div className="text-2xl font-black text-white mt-1">{stats.deliveredRepairs}</div>
            <span className="text-[10px] text-slate-400">Customer received</span>
          </div>

          <div
            onClick={() => onNavigate('repairs', { openNewModal: true })}
            className="p-3 bg-slate-800/40 border border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-800 transition"
          >
            <Plus className="w-5 h-5 text-blue-400 mb-1" />
            <span className="text-xs font-semibold text-white">Intake Phone</span>
            <span className="text-[10px] text-slate-400">New repair job card</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Urgent Repairs & Pending Dues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent & Ready Repairs Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm sm:text-base text-white">
                  Active & Ready Repair Jobs
                </h3>
              </div>
              <button
                onClick={() => onNavigate('repairs')}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                View all
              </button>
            </div>

            <div className="divide-y divide-slate-800 mt-2">
              {urgentRepairs.length > 0 ? (
                urgentRepairs.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => onNavigate('repairs', { selectedRepairId: r.id })}
                    className="py-3 flex items-center justify-between hover:bg-slate-800/50 px-2 rounded-lg cursor-pointer transition"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-blue-300">{r.id}</span>
                        <span className="text-xs font-semibold text-white">
                          {r.brand} {r.model}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            r.status === 'Ready'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {r.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {r.customerName} ({r.customerPhone}) • {r.problemDescription}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-white">{formatCurrency(r.estimatedCost)}</div>
                      <div className="text-[11px] text-amber-400">Due: {formatCurrency(r.remainingAmount)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No pending urgent repairs. Great job!
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('repairs', { openNewModal: true })}
            className="w-full mt-4 py-2 text-xs font-semibold text-blue-300 bg-blue-900/30 hover:bg-blue-900/50 border border-blue-700/40 rounded-xl transition"
          >
            + Create New Repair Entry
          </button>
        </div>

        {/* Customer Dues Alert Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-red-400" />
                <h3 className="font-bold text-sm sm:text-base text-white">
                  Top Customer Pending Dues
                </h3>
              </div>
              <button
                onClick={() => onNavigate('dues')}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                View all dues
              </button>
            </div>

            <div className="divide-y divide-slate-800 mt-2">
              {overdueInvoices.length > 0 ? (
                overdueInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="py-3 flex items-center justify-between hover:bg-slate-800/50 px-2 rounded-lg transition"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-white">{inv.customerName}</span>
                        <span className="font-mono text-[10px] text-slate-400">{inv.id}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 flex items-center space-x-2">
                        <span>Ph: {inv.customerPhone}</span>
                        {inv.dueDate && <span>• Due: {formatDate(inv.dueDate)}</span>}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="text-xs font-bold text-red-400">{formatCurrency(inv.dueAmount)}</div>
                        <div className="text-[10px] text-slate-400">Total: {formatCurrency(inv.totalAmount)}</div>
                      </div>

                      <a
                        href={`https://wa.me/91${inv.customerPhone.replace(/[^0-9]/g, '')}?text=Dear%20${encodeURIComponent(inv.customerName)},%20your%20due%20amount%20of%20Rs%20${inv.dueAmount}%20is%20pending%20at%20Sumaiya%20telecom.%20Please%20visit%20our%20shop%20to%20clear.%20Thank%20you.`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg border border-emerald-500/30"
                        title="WhatsApp Reminder"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No customer dues pending! All accounts clear.
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('dues')}
            className="w-full mt-4 py-2 text-xs font-semibold text-red-300 bg-red-900/30 hover:bg-red-900/50 border border-red-700/40 rounded-xl transition"
          >
            Open Customer Dues Manager
          </button>
        </div>
      </div>
    </div>
  );
};
