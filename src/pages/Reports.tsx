import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Wrench,
  Package,
  Receipt,
  Download,
  Printer,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const Reports: React.FC = () => {
  const {
    invoices,
    repairs,
    products,
    expenses,
    purchases,
    formatCurrency,
    formatDate
  } = useShop();

  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('month');

  // Filter calculations based on range
  const {
    totalSalesIncome,
    totalRepairIncome,
    totalRevenue,
    totalExpenses,
    estimatedCostOfGoods,
    estimatedGrossProfit,
    estimatedNetProfit,
    repairsDeliveredCount,
    repairsPendingCount
  } = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    if (dateRange === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (dateRange === 'week') {
      startDate = new Date(now.getTime() - 7 * 86400000);
    } else if (dateRange === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      startDate = new Date(2000, 0, 1);
    }

    const filteredInvoices = invoices.filter((i) => new Date(i.createdAt) >= startDate);
    const filteredExpenses = expenses.filter((e) => new Date(e.date) >= startDate);
    const filteredRepairs = repairs.filter((r) => new Date(r.createdAt) >= startDate);

    const salesIncome = filteredInvoices
      .filter((i) => i.invoiceType === 'sales')
      .reduce((sum, i) => sum + i.paidAmount, 0);

    const repairIncome = filteredInvoices
      .filter((i) => i.invoiceType === 'repair' || i.invoiceType === 'combined')
      .reduce((sum, i) => sum + i.paidAmount, 0);

    const revenue = salesIncome + repairIncome;
    const totalExp = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Approximate cost of goods sold based on items
    let cogs = 0;
    for (const inv of filteredInvoices) {
      if (Array.isArray(inv.items)) {
        for (const item of inv.items) {
          if (item.productId) {
            const prod = products.find((p) => p.id === item.productId);
            if (prod) {
              cogs += (prod.purchasePrice || 0) * (item.quantity || 1);
            }
          }
        }
      }
    }

    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - totalExp;

    const deliveredCount = filteredRepairs.filter((r) => r.status === 'Delivered').length;
    const pendingCount = filteredRepairs.filter((r) =>
      ['Received', 'Checking', 'Repairing', 'Ready'].includes(r.status)
    ).length;

    return {
      totalSalesIncome: salesIncome,
      totalRepairIncome: repairIncome,
      totalRevenue: revenue,
      totalExpenses: totalExp,
      estimatedCostOfGoods: cogs,
      estimatedGrossProfit: grossProfit,
      estimatedNetProfit: netProfit,
      repairsDeliveredCount: deliveredCount,
      repairsPendingCount: pendingCount
    };
  }, [invoices, expenses, repairs, products, dateRange]);

  // Stock valuation
  const inventoryValuation = useMemo(() => {
    const totalCost = products.reduce((sum, p) => sum + (p.purchasePrice * p.quantity), 0);
    const totalRetail = products.reduce((sum, p) => sum + (p.sellingPrice * p.quantity), 0);
    const potentialMargin = totalRetail - totalCost;
    return { totalCost, totalRetail, potentialMargin };
  }, [products]);

  // Export CSV
  const exportReportCsv = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Period', dateRange.toUpperCase()],
      ['Accessories Sales Income', totalSalesIncome],
      ['Mobile Repair Income', totalRepairIncome],
      ['Total Cash Received', totalRevenue],
      ['Cost of Goods / Parts Sold', estimatedCostOfGoods],
      ['Shop Expenses Logged', totalExpenses],
      ['Estimated Net Profit', estimatedNetProfit],
      ['Total Stock Inventory Cost', inventoryValuation.totalCost],
      ['Total Stock Retail Valuation', inventoryValuation.totalRetail]
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sumaiya_telecom_profit_report_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <span>Business Reports & Profit & Loss Analysis</span>
          </h1>
          <p className="text-xs text-slate-400">
            Real financial calculations: Sales + Repair Income - Parts Cost - Expenses = Estimated Profit
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Date range picker */}
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
            {(['today', 'week', 'month', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-3 py-1 rounded-lg font-semibold capitalize transition ${
                  dateRange === r
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {r === 'all' ? 'All Time' : r}
              </button>
            ))}
          </div>

          <button
            onClick={exportReportCsv}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Profit & Loss Master Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="font-bold text-sm text-white uppercase tracking-wider flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Estimated Profit & Loss Summary ({dateRange.toUpperCase()})</span>
          </span>
          <span className="text-xs text-slate-400">Sumaiya telecom</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400">Total Income (Cash Received)</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">
              {formatCurrency(totalRevenue)}
            </div>
            <div className="text-[11px] text-slate-400 flex justify-between pt-1">
              <span>Sales: {formatCurrency(totalSalesIncome)}</span>
              <span>Repair: {formatCurrency(totalRepairIncome)}</span>
            </div>
          </div>

          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400">Total Cost (Parts Cost + Expenses)</span>
            <div className="text-2xl sm:text-3xl font-black text-rose-400">
              {formatCurrency(estimatedCostOfGoods + totalExpenses)}
            </div>
            <div className="text-[11px] text-slate-400 flex justify-between pt-1">
              <span>COGS: {formatCurrency(estimatedCostOfGoods)}</span>
              <span>Shop Exp: {formatCurrency(totalExpenses)}</span>
            </div>
          </div>

          <div className="p-4 bg-blue-950/40 rounded-xl border border-blue-800/40 space-y-1">
            <span className="text-xs text-blue-300 font-bold uppercase">Estimated Net Profit</span>
            <div className={`text-2xl sm:text-3xl font-black ${estimatedNetProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatCurrency(estimatedNetProfit)}
            </div>
            <span className="text-[10px] text-slate-400 block pt-1">
              Revenue minus actual inventory purchase cost & shop expenses
            </span>
          </div>
        </div>
      </div>

      {/* Inventory Valuation & Repair Performance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Inventory Valuation */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Package className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-sm sm:text-base text-white">
              Inventory Stock Valuation
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-850 rounded-xl flex justify-between items-center">
              <span className="text-slate-400">Total Stock Investment (Purchase Cost):</span>
              <span className="font-black text-base text-white">{formatCurrency(inventoryValuation.totalCost)}</span>
            </div>

            <div className="p-3 bg-slate-850 rounded-xl flex justify-between items-center">
              <span className="text-slate-400">Expected Stock Retail Valuation:</span>
              <span className="font-black text-base text-emerald-400">{formatCurrency(inventoryValuation.totalRetail)}</span>
            </div>

            <div className="p-3 bg-purple-950/40 border border-purple-800/40 rounded-xl flex justify-between items-center">
              <span className="text-purple-300 font-semibold">Unrealized Gross Margin:</span>
              <span className="font-black text-base text-purple-300">{formatCurrency(inventoryValuation.potentialMargin)}</span>
            </div>
          </div>
        </div>

        {/* Repair Performance */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Wrench className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-sm sm:text-base text-white">
              Repair Workshop Productivity
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs text-center">
            <div className="p-3.5 bg-slate-850 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Repairs Delivered</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">{repairsDeliveredCount}</p>
              <span className="text-[10px] text-slate-500">Phones successfully returned</span>
            </div>

            <div className="p-3.5 bg-slate-850 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Active in Workshop</span>
              <p className="text-2xl font-black text-blue-400 mt-1">{repairsPendingCount}</p>
              <span className="text-[10px] text-slate-500">Currently in repair queue</span>
            </div>
          </div>

          <div className="p-3 bg-slate-850 rounded-xl text-xs flex justify-between items-center">
            <span className="text-slate-400">Average Repair Ticket Size:</span>
            <span className="font-bold text-white">
              {formatCurrency(repairs.length > 0 ? totalRepairIncome / Math.max(1, repairsDeliveredCount) : 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
