import React, { useState, useMemo } from 'react';
import { History, Search, ArrowUpRight, ArrowDownLeft, Filter } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { StockMovementType } from '../types';

export const StockLedger: React.FC = () => {
  const { stockMovements, products, formatDate, formatDateTime } = useShop();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [productFilter, setProductFilter] = useState<string>('All');

  const filteredMovements = useMemo(() => {
    return stockMovements.filter((m) => {
      if (typeFilter !== 'All' && m.type !== typeFilter) return false;
      if (productFilter !== 'All' && m.productId !== productFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          m.productName.toLowerCase().includes(q) ||
          m.sku.toLowerCase().includes(q) ||
          m.referenceId.toLowerCase().includes(q) ||
          m.reason.toLowerCase().includes(q) ||
          m.user.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [stockMovements, typeFilter, productFilter, searchQuery]);

  const getTypeBadge = (type: StockMovementType) => {
    switch (type) {
      case 'PURCHASE':
        return 'bg-blue-900/40 text-blue-300 border-blue-700/50';
      case 'SALE':
        return 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50';
      case 'REPAIR':
        return 'bg-purple-900/40 text-purple-300 border-purple-700/50';
      case 'RETURN':
        return 'bg-amber-900/40 text-amber-300 border-amber-700/50';
      case 'DAMAGE':
        return 'bg-red-900/40 text-red-300 border-red-700/50';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <History className="w-5 h-5 text-blue-400" />
            <span>Complete Stock Movement Ledger</span>
          </h1>
          <p className="text-xs text-slate-400">
            Real-time audit trail of all purchases, sales, repair usage, and manual stock changes
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {['All', 'PURCHASE', 'SALE', 'REPAIR', 'RETURN', 'DAMAGE', 'ADJUSTMENT'].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                typeFilter === t
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none"
          >
            <option value="All">All Products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku})
              </option>
            ))}
          </select>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference, product, reason..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-850 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-3">Product Name & SKU</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3 text-center">Stock In (+)</th>
                <th className="py-3 px-3 text-center">Stock Out (-)</th>
                <th className="py-3 px-3 text-center">New Balance</th>
                <th className="py-3 px-3">Reference / Reason</th>
                <th className="py-3 px-4 text-right">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {filteredMovements.length > 0 ? (
                filteredMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400">
                      {formatDateTime(m.date)}
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-white">{m.productName}</div>
                      <div className="font-mono text-[10px] text-purple-300">{m.sku}</div>
                    </td>

                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getTypeBadge(m.type)}`}>
                        {m.type}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      {m.quantityIn > 0 ? (
                        <span className="font-bold text-emerald-400 flex items-center justify-center">
                          <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +{m.quantityIn}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {m.quantityOut > 0 ? (
                        <span className="font-bold text-red-400 flex items-center justify-center">
                          <ArrowDownLeft className="w-3.5 h-3.5 mr-0.5" /> -{m.quantityOut}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center font-black text-slate-100">
                      {m.balance}
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-mono text-[11px] text-blue-300 font-semibold">{m.referenceId}</div>
                      <div className="text-[11px] text-slate-400">{m.reason}</div>
                    </td>

                    <td className="py-3 px-4 text-right text-slate-400">
                      {m.user}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No stock movement records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
