import React, { useState, useMemo } from 'react';
import { ShieldCheck, Search, Filter, Clock } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const AuditLogs: React.FC = () => {
  const { auditLogs, formatDateTime } = useShop();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('All');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (actionFilter !== 'All' && !log.action.includes(actionFilter)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          log.action.toLowerCase().includes(q) ||
          log.entityType.toLowerCase().includes(q) ||
          log.entityId.toLowerCase().includes(q) ||
          log.details.toLowerCase().includes(q) ||
          log.performedBy.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [auditLogs, actionFilter, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <span>Security & Financial Audit Trail</span>
          </h1>
          <p className="text-xs text-slate-400">
            Immutable transaction history of all critical shop actions, stock edits, billings, and logins
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto pb-1 scrollbar-none">
          {['All', 'REPAIR', 'INVOICE', 'STOCK', 'PRODUCT', 'USER', 'SETTINGS'].map((act) => (
            <button
              key={act}
              onClick={() => setActionFilter(act)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                actionFilter === act
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {act}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action, details, user..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-850 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-3">Action Event</th>
                <th className="py-3 px-3">Target Entity</th>
                <th className="py-3 px-3">Audit Details</th>
                <th className="py-3 px-4 text-right">Performed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                    {formatDateTime(log.timestamp)}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-indigo-300 font-bold border border-slate-700">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-400">
                    {log.entityType} ({log.entityId})
                  </td>
                  <td className="py-3 px-3 font-medium text-white max-w-md">
                    {log.details}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-300">
                    {log.performedBy}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No matching audit records found.
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
