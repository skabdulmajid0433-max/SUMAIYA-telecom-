import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  MessageCircle,
  Wrench,
  Receipt,
  Printer,
  ChevronRight,
  ExternalLink,
  Edit2,
  X
} from 'lucide-react';
import { Customer } from '../types';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { WhatsAppReminderModal } from '../components/WhatsAppReminderModal';

interface CustomersProps {
  initialCustomerId?: string;
}

export const Customers: React.FC<CustomersProps> = ({ initialCustomerId }) => {
  const { customers, invoices, repairs, formatCurrency, formatDate, formatDateTime, refreshData, showToast } = useShop();
  const { currentUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(() => {
    return initialCustomerId || (customers[0]?.id || '');
  });

  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Reminder modal state
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderData, setReminderData] = useState<{ name: string; phone: string; amount: number }>({
    name: '',
    phone: '',
    amount: 0
  });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    altPhone: '',
    whatsapp: '',
    email: '',
    address: '',
    notes: ''
  });

  // Filter customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (!c.active) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.id.toLowerCase().includes(q) ||
          (c.altPhone && c.altPhone.includes(q)) ||
          (c.address && c.address.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [customers, searchQuery]);

  // Selected customer details
  const activeCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || customers[0] || null;
  }, [customers, selectedCustomerId]);

  // Customer transactions
  const customerInvoices = useMemo(() => {
    if (!activeCustomer) return [];
    return invoices.filter((inv) => inv.customerId === activeCustomer.id || inv.customerPhone === activeCustomer.phone);
  }, [invoices, activeCustomer]);

  const customerRepairs = useMemo(() => {
    if (!activeCustomer) return [];
    return repairs.filter((r) => r.customerId === activeCustomer.id || r.customerPhone === activeCustomer.phone);
  }, [repairs, activeCustomer]);

  const totalBilled = customerInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPaid = customerInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const totalDue = customerInvoices.reduce((sum, inv) => sum + inv.dueAmount, 0);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      phone: '',
      altPhone: '',
      whatsapp: '',
      email: '',
      address: '',
      notes: ''
    });
    setShowAddCustomerModal(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      phone: c.phone,
      altPhone: c.altPhone || '',
      whatsapp: c.whatsapp || c.phone,
      email: c.email || '',
      address: c.address || '',
      notes: c.notes || ''
    });
    setShowAddCustomerModal(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      showToast('Name and mobile number are required', 'error');
      return;
    }

    try {
      if (editingCustomer) {
        await api.updateCustomer(editingCustomer.id, formData, currentUser?.name || 'Staff');
        showToast(`Customer ${formData.name} updated!`, 'success');
      } else {
        const res = await api.createCustomer(formData, currentUser?.name || 'Staff');
        showToast(`Customer ${formData.name} added!`, 'success');
        setSelectedCustomerId(res.customer.id);
      }
      setShowAddCustomerModal(false);
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save customer', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <span>Customer Profiles & Ledger</span>
          </h1>
          <p className="text-xs text-slate-400">
            Customer directory, repair job history, billing invoices & outstanding balances
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center space-x-2 shadow-md shadow-emerald-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Customer</span>
        </button>
      </div>

      {/* Main Split Layout: Left Customer List, Right Profile & Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Customer List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer name, phone, address..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-2 max-h-[calc(100vh-17rem)] overflow-y-auto pr-1">
            {filteredCustomers.map((c) => {
              const isSelected = activeCustomer?.id === c.id;
              // Check due for customer
              const due = invoices
                .filter((inv) => inv.customerId === c.id || inv.customerPhone === c.phone)
                .reduce((sum, inv) => sum + inv.dueAmount, 0);

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCustomerId(c.id)}
                  className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-slate-850 border-emerald-500 shadow-md ring-1 ring-emerald-500/30'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-white">{c.name}</span>
                      <span className="font-mono text-[10px] text-slate-400">{c.id}</span>
                    </div>
                    <p className="text-xs text-emerald-400 font-mono mt-0.5">{c.phone}</p>
                    {c.address && (
                      <p className="text-[11px] text-slate-400 truncate max-w-[200px] mt-0.5">{c.address}</p>
                    )}
                  </div>

                  <div className="text-right">
                    {due > 0 ? (
                      <span className="text-xs font-bold text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-800/40">
                        Due: {formatCurrency(due)}
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded">
                        Clear
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Customer Profile & Ledger (7 cols) */}
        <div className="lg:col-span-7">
          {activeCustomer ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-6 shadow-sm">
              {/* Profile Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs text-slate-400">{activeCustomer.id}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded font-semibold">
                      Registered Customer
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-white mt-1">{activeCustomer.name}</h2>
                  <p className="text-xs text-slate-400">
                    Ph: <strong className="text-white">{activeCustomer.phone}</strong>
                    {activeCustomer.altPhone && ` • Alt: ${activeCustomer.altPhone}`}
                    {activeCustomer.address && ` • ${activeCustomer.address}`}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenEdit(activeCustomer)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium flex items-center space-x-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <a
                    href={`https://wa.me/91${activeCustomer.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>

                  <a
                    href={`tel:${activeCustomer.phone}`}
                    className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </a>
                </div>
              </div>

              {/* Financial Snapshot */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-850 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Billed</span>
                  <p className="text-base sm:text-lg font-black text-white mt-0.5">
                    {formatCurrency(totalBilled)}
                  </p>
                </div>

                <div className="bg-slate-850 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-emerald-400">Total Paid</span>
                  <p className="text-base sm:text-lg font-black text-emerald-400 mt-0.5">
                    {formatCurrency(totalPaid)}
                  </p>
                </div>

                <div className="bg-slate-850 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-red-400">Outstanding Due</span>
                  <p className="text-base sm:text-lg font-black text-red-400 mt-0.5">
                    {formatCurrency(totalDue)}
                  </p>
                </div>
              </div>

              {/* Customer Repair Jobs */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <Wrench className="w-3.5 h-3.5 text-blue-400" />
                  <span>Device Repair History ({customerRepairs.length})</span>
                </h3>

                <div className="space-y-1.5 max-h-44 overflow-y-auto">
                  {customerRepairs.length > 0 ? (
                    customerRepairs.map((r) => (
                      <div
                        key={r.id}
                        className="p-2.5 bg-slate-850 rounded-xl border border-slate-800 flex justify-between items-center text-xs"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-[11px] font-bold text-blue-400">{r.id}</span>
                            <span className="font-semibold text-white">
                              {r.brand} {r.model}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                              {r.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-sm">
                            {r.problemDescription}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-white">{formatCurrency(r.estimatedCost)}</span>
                          <span className="block text-[10px] text-amber-400">Due: {formatCurrency(r.remainingAmount)}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-slate-850 rounded-xl text-center text-slate-500 text-xs">
                      No repair jobs on record for this customer.
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Invoices & Ledger */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Invoices & Billing History ({customerInvoices.length})</span>
                  </h3>
                  <button
                    onClick={() => window.print()}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Statement</span>
                  </button>
                </div>

                <div className="space-y-1.5 max-h-52 overflow-y-auto">
                  {customerInvoices.length > 0 ? (
                    customerInvoices.map((inv) => (
                      <div
                        key={inv.id}
                        className="p-3 bg-slate-850 rounded-xl border border-slate-800 flex justify-between items-center text-xs"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-bold text-emerald-400">{inv.id}</span>
                            <span className="text-slate-400 font-medium">{formatDate(inv.createdAt)}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                              {inv.invoiceType}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-1 line-clamp-1">
                            {inv.items?.map((i) => i.description).join(', ')}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-white">{formatCurrency(inv.totalAmount)}</div>
                          <div
                            className={`text-[10px] font-semibold ${
                              inv.dueAmount > 0 ? 'text-red-400' : 'text-emerald-400'
                            }`}
                          >
                            {inv.dueAmount > 0 ? `Due: ${formatCurrency(inv.dueAmount)}` : 'PAID'}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-slate-850 rounded-xl text-center text-slate-500 text-xs">
                      No invoices found.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* ADD / EDIT CUSTOMER MODAL */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-base text-white">
                {editingCustomer ? 'Edit Customer Details' : 'Add New Customer'}
              </h3>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-4 space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rahim Mondal"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="10-digit mobile number"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Alternate Mobile Number</label>
                <input
                  type="tel"
                  value={formData.altPhone}
                  onChange={(e) => setFormData({ ...formData, altPhone: e.target.value })}
                  placeholder="Optional alternate number"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Address / Locality</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Station Road, Rampurhat"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Customer Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Wholesale buyer, preferred technician Tapas"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-md"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
