import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Search,
  MessageCircle,
  Phone,
  Printer,
  CheckCircle,
  AlertTriangle,
  Calendar,
  X,
  Check
} from 'lucide-react';
import { Invoice } from '../types';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { WhatsAppReminderModal } from '../components/WhatsAppReminderModal';

export const CustomerDues: React.FC = () => {
  const { invoices, formatCurrency, formatDate, refreshData, showToast } = useShop();
  const { currentUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'All' | 'Overdue' | 'Highest'>('All');

  // Receive Payment Modal state
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // WhatsApp reminder modal
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderTarget, setReminderTarget] = useState<Invoice | null>(null);

  // Due invoices
  const dueInvoices = useMemo(() => {
    let list = invoices.filter((inv) => inv.dueAmount > 0);

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (inv) =>
          inv.customerName.toLowerCase().includes(q) ||
          inv.customerPhone.includes(q) ||
          inv.id.toLowerCase().includes(q) ||
          (inv.repairId && inv.repairId.toLowerCase().includes(q))
      );
    }

    if (filterMode === 'Highest') {
      list = [...list].sort((a, b) => b.dueAmount - a.dueAmount);
    } else if (filterMode === 'Overdue') {
      const now = new Date().toISOString().split('T')[0];
      list = list.filter((inv) => inv.dueDate && inv.dueDate < now);
    }

    return list;
  }, [invoices, searchQuery, filterMode]);

  const totalOutstanding = useMemo(() => {
    return dueInvoices.reduce((sum, inv) => sum + inv.dueAmount, 0);
  }, [dueInvoices]);

  const openReceivePayment = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setPaymentAmount(inv.dueAmount);
    setPaymentMethod('Cash');
    setReferenceNumber('');
    setPaymentNotes('Due clearance payment');
    setShowPaymentModal(true);
  };

  const handleReceivePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    try {
      await api.payInvoice(selectedInvoice.id, {
        amount: Number(paymentAmount) || 0,
        method: paymentMethod,
        referenceNumber,
        notes: paymentNotes,
        performedBy: currentUser?.name || 'Staff'
      });
      showToast(`Payment of ₹${paymentAmount} recorded successfully!`, 'success');
      setShowPaymentModal(false);
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to record payment', 'error');
    }
  };

  const openReminder = (inv: Invoice) => {
    setReminderTarget(inv);
    setShowReminderModal(true);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-red-950/40 to-slate-900 p-5 rounded-2xl border border-red-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 text-[11px] font-bold bg-red-500/20 text-red-300 border border-red-500/30 rounded">
              Accounts Receivable
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
            Customer Outstanding Dues Management
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Track unpaid bills, send WhatsApp payment links, and collect pending balances
          </p>
        </div>

        <div className="bg-slate-900/90 p-3.5 rounded-xl border border-red-900/50 text-right min-w-[200px]">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Outstanding</span>
          <div className="text-2xl sm:text-3xl font-black text-red-400 mt-0.5">
            {formatCurrency(totalOutstanding)}
          </div>
          <span className="text-[11px] text-slate-400">Across {dueInvoices.length} pending bills</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center space-x-2 overflow-x-auto w-full md:w-auto pb-1">
          {[
            { id: 'All', label: 'All Pending Dues' },
            { id: 'Highest', label: 'Highest Due First' },
            { id: 'Overdue', label: 'Overdue Only' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterMode(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                filterMode === tab.id
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customer name, phone, bill ID..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
          />
        </div>
      </div>

      {/* Dues Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-850 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Bill Ref & Date</th>
                <th className="py-3 px-3">Customer Name & Phone</th>
                <th className="py-3 px-3">Type / Device</th>
                <th className="py-3 px-3 text-right">Total Bill</th>
                <th className="py-3 px-3 text-right">Paid Amount</th>
                <th className="py-3 px-3 text-right">Outstanding Due</th>
                <th className="py-3 px-3">Due Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {dueInvoices.length > 0 ? (
                dueInvoices.map((inv) => {
                  const nowStr = new Date().toISOString().split('T')[0];
                  const isOverdue = inv.dueDate && inv.dueDate < nowStr;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-bold text-red-300">{inv.id}</span>
                        <div className="text-[10px] text-slate-500">{formatDate(inv.createdAt)}</div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-white text-sm">{inv.customerName}</div>
                        <div className="text-[11px] text-emerald-400 font-mono mt-0.5">{inv.customerPhone}</div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 uppercase font-semibold">
                          {inv.invoiceType}
                        </span>
                        {inv.repairId && (
                          <div className="text-[10px] font-mono text-blue-400 mt-0.5">
                            Job: {inv.repairId}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right font-medium text-slate-300">
                        {formatCurrency(inv.totalAmount)}
                      </td>

                      <td className="py-3 px-3 text-right text-slate-400 font-medium">
                        {formatCurrency(inv.paidAmount)}
                      </td>

                      <td className="py-3 px-3 text-right font-black text-sm text-red-400">
                        {formatCurrency(inv.dueAmount)}
                      </td>

                      <td className="py-3 px-3">
                        {inv.dueDate ? (
                          <span
                            className={`text-[11px] font-medium ${
                              isOverdue ? 'text-red-400 font-bold' : 'text-slate-400'
                            }`}
                          >
                            {formatDate(inv.dueDate)}
                            {isOverdue && <span className="block text-[9px] uppercase text-red-400">Overdue</span>}
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openReceivePayment(inv)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-sm transition"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Collect</span>
                          </button>

                          <button
                            onClick={() => openReminder(inv)}
                            title="Send WhatsApp Reminder"
                            className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg border border-emerald-500/30 transition"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>

                          <a
                            href={`tel:${inv.customerPhone}`}
                            title="Call Customer"
                            className="p-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg border border-blue-500/30 transition"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No outstanding customer dues found. All bills settled!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECEIVE DUE PAYMENT MODAL */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">Receive Customer Due Payment</h3>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReceivePayment} className="p-4 space-y-4">
              <div className="p-3 bg-slate-800 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Customer:</span>
                  <span className="font-bold text-white">{selectedInvoice.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Bill Number:</span>
                  <span className="font-mono text-blue-300 font-semibold">{selectedInvoice.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Billed:</span>
                  <span className="text-white font-medium">{formatCurrency(selectedInvoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-700 font-bold text-sm">
                  <span className="text-red-400">Outstanding Due:</span>
                  <span className="text-red-400">{formatCurrency(selectedInvoice.dueAmount)}</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  Payment Amount to Collect (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedInvoice.dueAmount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-base font-black text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="Bank Transfer">Bank Transfer / NEFT</option>
                  <option value="Card">Debit / Credit Card</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  Reference / Transaction ID (Optional)
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. UPI/2026/..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WHATSAPP REMINDER MODAL */}
      {showReminderModal && reminderTarget && (
        <WhatsAppReminderModal
          isOpen={showReminderModal}
          onClose={() => setShowReminderModal(false)}
          customerName={reminderTarget.customerName}
          phone={reminderTarget.customerPhone}
          amount={reminderTarget.dueAmount}
          repairId={reminderTarget.id}
          initialType="payment_due"
        />
      )}
    </div>
  );
};
