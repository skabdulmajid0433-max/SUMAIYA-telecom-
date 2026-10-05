import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Wrench,
  Users,
  Package,
  Receipt,
  Phone,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { NavigationTab } from './DesktopSidebar';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavigationTab, meta?: any) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const { customers, repairs, products, invoices, formatCurrency } = useShop();
  const [query, setQuery] = useState('');

  const trimmed = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!trimmed) {
      return { customers: [], repairs: [], products: [], invoices: [] };
    }

    const matchedCustomers = customers.filter(
      (c) =>
        c.name.toLowerCase().includes(trimmed) ||
        c.phone.includes(trimmed) ||
        c.id.toLowerCase().includes(trimmed) ||
        (c.altPhone && c.altPhone.includes(trimmed))
    ).slice(0, 5);

    const matchedRepairs = repairs.filter(
      (r) =>
        r.id.toLowerCase().includes(trimmed) ||
        r.customerName.toLowerCase().includes(trimmed) ||
        r.customerPhone.includes(trimmed) ||
        r.brand.toLowerCase().includes(trimmed) ||
        r.model.toLowerCase().includes(trimmed) ||
        r.imei1.includes(trimmed) ||
        (r.imei2 && r.imei2.includes(trimmed))
    ).slice(0, 5);

    const matchedProducts = products.filter(
      (p) =>
        p.name.toLowerCase().includes(trimmed) ||
        p.sku.toLowerCase().includes(trimmed) ||
        p.barcode.includes(trimmed) ||
        p.compatibleModels.toLowerCase().includes(trimmed) ||
        p.brand.toLowerCase().includes(trimmed) ||
        p.rackLocation.toLowerCase().includes(trimmed)
    ).slice(0, 5);

    const matchedInvoices = invoices.filter(
      (inv) =>
        inv.id.toLowerCase().includes(trimmed) ||
        inv.customerName.toLowerCase().includes(trimmed) ||
        inv.customerPhone.includes(trimmed)
    ).slice(0, 5);

    return {
      customers: matchedCustomers,
      repairs: matchedRepairs,
      products: matchedProducts,
      invoices: matchedInvoices
    };
  }, [trimmed, customers, repairs, products, invoices]);

  if (!isOpen) return null;

  const totalFound =
    results.customers.length +
    results.repairs.length +
    results.products.length +
    results.invoices.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 px-3 bg-black/70 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[85vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center space-x-3 bg-slate-850">
          <Search className="w-5 h-5 text-blue-400 flex-shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search phone number, IMEI, repair ID, customer, SKU, product..."
            className="w-full bg-transparent border-0 text-white placeholder-slate-400 text-sm sm:text-base focus:ring-0 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700"
          >
            Esc
          </button>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {!trimmed && (
            <div className="py-8 text-center text-slate-400 space-y-2">
              <p className="text-sm font-medium">Quick Global Search</p>
              <p className="text-xs text-slate-500">
                Type customer phone (e.g. 9876543210), repair ID (REP-2026-0001), IMEI number, or product SKU.
              </p>
            </div>
          )}

          {trimmed && totalFound === 0 && (
            <div className="py-10 text-center text-slate-400">
              <p className="text-sm">No records found matching "{query}"</p>
              <p className="text-xs text-slate-500 mt-1">Try another search term or number</p>
            </div>
          )}

          {/* Repairs */}
          {results.repairs.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <Wrench className="w-3.5 h-3.5" />
                <span>Repair Jobs ({results.repairs.length})</span>
              </div>
              <div className="space-y-1.5">
                {results.repairs.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => {
                      onNavigate('repairs', { selectedRepairId: r.id });
                      onClose();
                    }}
                    className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl cursor-pointer flex items-center justify-between transition group"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-blue-300">{r.id}</span>
                        <span className="text-xs font-medium text-white">
                          {r.brand} {r.model}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-semibold">
                          {r.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Customer: <strong className="text-slate-200">{r.customerName}</strong> ({r.customerPhone})
                        {r.imei1 && <span className="ml-2 font-mono text-[11px] text-slate-500">IMEI: {r.imei1}</span>}
                      </p>
                    </div>
                    <div className="text-right flex items-center space-x-3">
                      <div>
                        <div className="text-xs font-bold text-slate-200">{formatCurrency(r.estimatedCost)}</div>
                        <div className="text-[10px] text-amber-400">Due: {formatCurrency(r.remainingAmount)}</div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-blue-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customers */}
          {results.customers.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>Customers ({results.customers.length})</span>
              </div>
              <div className="space-y-1.5">
                {results.customers.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl flex items-center justify-between transition"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs text-slate-400">{c.id}</span>
                        <span className="text-sm font-semibold text-white">{c.name}</span>
                      </div>
                      <p className="text-xs text-emerald-400 font-mono mt-0.5">{c.phone}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <a
                        href={`https://wa.me/91${c.phone}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg border border-emerald-500/30"
                        title="WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                      <a
                        href={`tel:${c.phone}`}
                        className="p-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg border border-blue-500/30"
                        title="Call"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => {
                          onNavigate('customers', { selectedCustomerId: c.id });
                          onClose();
                        }}
                        className="text-xs px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200"
                      >
                        Ledger
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Products */}
          {results.products.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <Package className="w-3.5 h-3.5" />
                <span>Inventory & Spare Parts ({results.products.length})</span>
              </div>
              <div className="space-y-1.5">
                {results.products.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onNavigate('inventory', { selectedProductId: p.id });
                      onClose();
                    }}
                    className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl cursor-pointer flex items-center justify-between transition group"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-semibold text-purple-300">{p.sku}</span>
                        <span className="text-xs font-medium text-white">{p.name}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Rack: <strong className="text-slate-300">{p.rackLocation}</strong> • Model: {p.compatibleModels}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-100">{formatCurrency(p.sellingPrice)}</div>
                      <div
                        className={`text-[10px] font-semibold ${
                          p.quantity <= (p.minStockLevel || 3) ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      >
                        Stock: {p.quantity} {p.unit}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invoices */}
          {results.invoices.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <Receipt className="w-3.5 h-3.5" />
                <span>Invoices ({results.invoices.length})</span>
              </div>
              <div className="space-y-1.5">
                {results.invoices.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => {
                      onNavigate('pos', { selectedInvoiceId: inv.id });
                      onClose();
                    }}
                    className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl cursor-pointer flex items-center justify-between transition group"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-amber-300">{inv.id}</span>
                        <span className="text-xs font-medium text-white">{inv.customerName}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{inv.customerPhone}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-100">{formatCurrency(inv.totalAmount)}</div>
                      <div
                        className={`text-[10px] font-semibold ${
                          inv.dueAmount > 0 ? 'text-red-400' : 'text-emerald-400'
                        }`}
                      >
                        {inv.dueAmount > 0 ? `Due: ${formatCurrency(inv.dueAmount)}` : 'PAID'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
