import React, { useState, useMemo } from 'react';
import {
  Truck,
  Plus,
  Search,
  Calendar,
  CreditCard,
  Package,
  Trash2,
  Check,
  X,
  Edit2,
  ArrowUpRight
} from 'lucide-react';
import { Purchase, PurchaseItem } from '../types';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface PurchasesProps {
  initialOpenNewPurchase?: boolean;
}

export const Purchases: React.FC<PurchasesProps> = ({ initialOpenNewPurchase = false }) => {
  const { purchases, suppliers, products, formatCurrency, formatDate, refreshData, showToast } = useShop();
  const { currentUser, canDeleteRecords } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Unpaid' | 'Partially Paid' | 'Paid'>('All');
  const [showNewPurchaseModal, setShowNewPurchaseModal] = useState<boolean>(initialOpenNewPurchase);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);

  // Quick Amount Paid / Unpaid Modal for Purchase
  const [showQuickPayModal, setShowQuickPayModal] = useState(false);
  const [targetPurchaseForPay, setTargetPurchaseForPay] = useState<Purchase | null>(null);
  const [quickPayAmount, setQuickPayAmount] = useState<number>(0);
  const [quickPayStatus, setQuickPayStatus] = useState<'Paid' | 'Partially Paid' | 'Unpaid'>('Paid');
  const [quickPayMethod, setQuickPayMethod] = useState('Bank Transfer');
  const [quickPayRef, setQuickPayRef] = useState('');

  // New purchase state
  const [supplierId, setSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Bank Transfer');
  const [notes, setNotes] = useState<string>('');

  // Item row input state
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [itemQty, setItemQty] = useState<number>(10);
  const [itemCost, setItemCost] = useState<number>(0);
  const [itemSell, setItemSell] = useState<number>(0);

  const addItemToPurchase = () => {
    if (!selectedProductId) return;
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    setPurchaseItems((prev) => [
      ...prev,
      {
        productId: prod.id,
        productName: prod.name,
        category: prod.category,
        quantity: Number(itemQty) || 1,
        purchasePrice: Number(itemCost) || prod.purchasePrice,
        sellingPrice: Number(itemSell) || prod.sellingPrice,
        total: (Number(itemQty) || 1) * (Number(itemCost) || prod.purchasePrice)
      }
    ]);

    setSelectedProductId('');
    setItemQty(10);
    setItemCost(0);
    setItemSell(0);
  };

  const removeItemFromPurchase = (idx: number) => {
    setPurchaseItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const totalPurchaseAmount = purchaseItems.reduce((sum, item) => sum + item.total, 0);

  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      if (statusFilter !== 'All' && p.paymentStatus !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          p.id.toLowerCase().includes(q) ||
          p.supplierName.toLowerCase().includes(q) ||
          p.invoiceNumber.toLowerCase().includes(q) ||
          p.items.some((i) => i.productName.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [purchases, statusFilter, searchQuery]);

  const handleOpenAddPurchase = () => {
    setEditingPurchase(null);
    setSupplierId(suppliers[0]?.id || '');
    setInvoiceNumber('');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setPurchaseItems([]);
    setPaidAmount('');
    setPaymentMethod('Bank Transfer');
    setNotes('');
    setShowNewPurchaseModal(true);
  };

  const handleOpenEditPurchase = (p: Purchase) => {
    setEditingPurchase(p);
    setSupplierId(p.supplierId);
    setInvoiceNumber(p.invoiceNumber);
    setPurchaseDate(p.date);
    setPurchaseItems([...p.items]);
    setPaidAmount(String(p.paidAmount));
    setPaymentMethod(p.paymentMethod);
    setNotes(p.notes || '');
    setShowNewPurchaseModal(true);
  };

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || purchaseItems.length === 0) {
      showToast('Select a supplier and add at least one item', 'error');
      return;
    }

    const sup = suppliers.find((s) => s.id === supplierId);
    const paidVal = paidAmount === '' ? totalPurchaseAmount : Number(paidAmount);
    const dueVal = Math.max(0, totalPurchaseAmount - paidVal);
    const pStatus = dueVal === 0 ? 'Paid' : (paidVal > 0 ? 'Partially Paid' : 'Unpaid');

    try {
      if (editingPurchase) {
        await api.updatePurchase(editingPurchase.id, {
          supplierId,
          supplierName: sup?.companyName || sup?.name || 'Supplier',
          invoiceNumber,
          date: purchaseDate,
          items: purchaseItems,
          totalAmount: totalPurchaseAmount,
          paidAmount: paidVal,
          dueAmount: dueVal,
          paymentStatus: pStatus,
          paymentMethod,
          notes,
          performedBy: currentUser?.name || 'Admin'
        });
        showToast(`Purchase order ${editingPurchase.id} updated!`, 'success');
      } else {
        await api.createPurchase({
          supplierId,
          supplierName: sup?.companyName || sup?.name || 'Supplier',
          invoiceNumber,
          date: purchaseDate,
          items: purchaseItems,
          totalAmount: totalPurchaseAmount,
          paidAmount: paidVal,
          paymentMethod,
          notes,
          performedBy: currentUser?.name || 'Admin'
        });
        showToast(`Supplier purchase recorded & stock updated!`, 'success');
      }

      setShowNewPurchaseModal(false);
      setEditingPurchase(null);
      setPurchaseItems([]);
      setPaidAmount('');
      setInvoiceNumber('');
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save purchase', 'error');
    }
  };

  const handleDeletePurchase = async (p: Purchase) => {
    if (!confirm(`Are you sure you want to delete purchase ${p.id}?`)) return;
    try {
      await api.deletePurchase(p.id);
      showToast(`Purchase ${p.id} deleted`, 'success');
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete purchase', 'error');
    }
  };

  const openQuickPayModal = (p: Purchase) => {
    setTargetPurchaseForPay(p);
    setQuickPayAmount(p.dueAmount);
    setQuickPayStatus(p.paymentStatus);
    setQuickPayMethod(p.paymentMethod || 'Bank Transfer');
    setQuickPayRef('');
    setShowQuickPayModal(true);
  };

  const handleApplyQuickPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPurchaseForPay) return;

    try {
      await api.updatePurchasePayment(targetPurchaseForPay.id, {
        paymentStatus: quickPayStatus,
        amountPaidNow: quickPayStatus === 'Paid' ? targetPurchaseForPay.dueAmount : (quickPayStatus === 'Unpaid' ? 0 : quickPayAmount),
        paymentMethod: quickPayMethod,
        referenceNumber: quickPayRef,
        notes: `Quick payment: ${quickPayStatus}`,
        performedBy: currentUser?.name || 'Admin'
      });
      showToast(`Purchase payment status set to ${quickPayStatus}!`, 'success');
      setShowQuickPayModal(false);
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update payment status', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Truck className="w-5 h-5 text-cyan-400" />
            <span>Supplier Purchases & Stock Inward</span>
          </h1>
          <p className="text-xs text-slate-400">
            Record wholesale supplier invoices with automatic stock increment & full edit
          </p>
        </div>

        <button
          onClick={handleOpenAddPurchase}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center space-x-2 shadow-md shadow-cyan-600/30 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Record Supplier Purchase</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto pb-1">
          {(['All', 'Unpaid', 'Partially Paid', 'Paid'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st === 'Unpaid' ? `⚠️ Unpaid (${purchases.filter((p) => p.dueAmount > 0).length})` : st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ref, supplier, item..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Purchases List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-850 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Purchase Ref & Date</th>
                <th className="py-3 px-3">Supplier Name</th>
                <th className="py-3 px-3">Supplier Inv #</th>
                <th className="py-3 px-3">Items Purchased</th>
                <th className="py-3 px-3 text-right">Total Bill</th>
                <th className="py-3 px-3 text-right">Paid Amount</th>
                <th className="py-3 px-3 text-right">Balance Due</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions / Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {filteredPurchases.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4">
                    <span className="font-mono text-cyan-400 font-bold">{p.id}</span>
                    <span className="text-[10px] text-slate-500 block">{formatDate(p.date)}</span>
                  </td>

                  <td className="py-3 px-3 font-semibold text-white">
                    {p.supplierName}
                  </td>

                  <td className="py-3 px-3 font-mono text-slate-300">
                    {p.invoiceNumber || '-'}
                  </td>

                  <td className="py-3 px-3">
                    <span className="line-clamp-1 max-w-xs text-slate-300">
                      {p.items?.map((i) => `${i.productName} (${i.quantity})`).join(', ')}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right font-bold text-white">
                    {formatCurrency(p.totalAmount)}
                  </td>

                  <td className="py-3 px-3 text-right text-emerald-400 font-semibold">
                    {formatCurrency(p.paidAmount)}
                  </td>

                  <td className="py-3 px-3 text-right text-red-400 font-bold">
                    {formatCurrency(p.dueAmount)}
                  </td>

                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => openQuickPayModal(p)}
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase transition hover:brightness-125 cursor-pointer border ${
                        p.paymentStatus === 'Paid'
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800/50'
                          : p.paymentStatus === 'Partially Paid'
                          ? 'bg-amber-950 text-amber-300 border-amber-800/50'
                          : 'bg-red-950 text-red-400 border-red-800/50'
                      }`}
                      title="Click to toggle Paid / Unpaid"
                    >
                      {p.paymentStatus} ▾
                    </button>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => openQuickPayModal(p)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-[11px] border border-slate-700 cursor-pointer"
                        title="Update Paid Amount"
                      >
                        Paid/Unpaid
                      </button>

                      <button
                        onClick={() => handleOpenEditPurchase(p)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 cursor-pointer"
                        title="Full Edit Order"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {canDeleteRecords && (
                        <button
                          onClick={() => handleDeletePurchase(p)}
                          className="p-1.5 bg-slate-800 hover:bg-red-950 text-slate-500 hover:text-red-400 rounded border border-slate-700 cursor-pointer"
                          title="Delete Order"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPurchases.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No purchase orders matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW PURCHASE MODAL */}
      {showNewPurchaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[92vh]">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
              <h3 className="font-bold text-base text-white">
                {editingPurchase ? `Full Edit Purchase #${editingPurchase.id}` : 'Record Supplier Wholesale Purchase (Inward Stock)'}
              </h3>
              <button
                onClick={() => {
                  setShowNewPurchaseModal(false);
                  setEditingPurchase(null);
                }}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="p-4 space-y-4 overflow-y-auto">
              {/* Supplier Header Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Select Supplier *</label>
                  <select
                    required
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.companyName || s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Supplier Bill / Invoice #</label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="e.g. NAT-INV-9901"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Purchase Date</label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Add Item Row */}
              <div className="bg-slate-850 p-3 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider block">
                  Add Product to Purchase Order:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-6">
                    <select
                      value={selectedProductId}
                      onChange={(e) => {
                        const pid = e.target.value;
                        setSelectedProductId(pid);
                        const p = products.find((prod) => prod.id === pid);
                        if (p) {
                          setItemCost(p.purchasePrice);
                          setItemSell(p.sellingPrice);
                        }
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                    >
                      <option value="">-- Pick Product from Inventory --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <input
                      type="number"
                      min="1"
                      value={itemQty}
                      onChange={(e) => setItemQty(Number(e.target.value))}
                      placeholder="Qty"
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white text-center font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <input
                      type="number"
                      value={itemCost}
                      onChange={(e) => setItemCost(Number(e.target.value))}
                      placeholder="Cost"
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white text-right font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={addItemToPurchase}
                      disabled={!selectedProductId}
                      className="w-full py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold rounded-lg text-xs"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-800 text-slate-400">
                    <tr>
                      <th className="p-2">Item Description</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Cost Price</th>
                      <th className="p-2 text-right">Total</th>
                      <th className="p-2 text-center">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {purchaseItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-medium text-white">{item.productName}</td>
                        <td className="p-2 text-center font-bold">{item.quantity}</td>
                        <td className="p-2 text-right">{formatCurrency(item.purchasePrice)}</td>
                        <td className="p-2 text-right font-bold text-emerald-400">{formatCurrency(item.total)}</td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeItemFromPurchase(idx)}
                            className="text-slate-500 hover:text-red-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {purchaseItems.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-500">
                          No items added to purchase list yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Payment Details */}
              <div className="bg-slate-850 p-3 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Total Bill: {formatCurrency(totalPurchaseAmount)}</label>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder={`Paid now (e.g. ${totalPurchaseAmount})`}
                    className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                    <option value="UPI">UPI / PhonePe</option>
                    <option value="Cash">Cash</option>
                    <option value="Due">Unpaid (Full Due)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Notes / Shipping Info</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Transport parcel received"
                    className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewPurchaseModal(false);
                    setEditingPurchase(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={purchaseItems.length === 0}
                  className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-md cursor-pointer"
                >
                  {editingPurchase ? 'Update Purchase Order' : 'Confirm Purchase & Update Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK PAID / UNPAID MODAL */}
      {showQuickPayModal && targetPurchaseForPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-4 space-y-4 text-slate-100">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">Purchase Payment: Paid vs Unpaid</h3>
              <button onClick={() => setShowQuickPayModal(false)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyQuickPay} className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-850 rounded-xl space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Purchase Ref:</span>
                  <span className="font-mono text-cyan-400 font-bold">{targetPurchaseForPay.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Supplier:</span>
                  <span className="font-bold text-white">{targetPurchaseForPay.supplierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Purchase:</span>
                  <span className="font-bold text-white">{formatCurrency(targetPurchaseForPay.totalAmount)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-800">
                  <span className="text-amber-400 font-semibold">Current Unpaid Due:</span>
                  <span className="font-black text-red-400 text-sm">{formatCurrency(targetPurchaseForPay.dueAmount)}</span>
                </div>
              </div>

              {/* Paid / Unpaid Quick Selector */}
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Select Payment Option:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setQuickPayStatus('Paid');
                      setQuickPayAmount(targetPurchaseForPay.dueAmount);
                    }}
                    className={`py-2 px-1 rounded-xl text-center font-bold transition border cursor-pointer ${
                      quickPayStatus === 'Paid'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    ✓ Mark Fully Paid
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setQuickPayStatus('Partially Paid');
                      setQuickPayAmount(Math.round(targetPurchaseForPay.dueAmount / 2));
                    }}
                    className={`py-2 px-1 rounded-xl text-center font-bold transition border cursor-pointer ${
                      quickPayStatus === 'Partially Paid'
                        ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    Partially Paid
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setQuickPayStatus('Unpaid');
                      setQuickPayAmount(0);
                    }}
                    className={`py-2 px-1 rounded-xl text-center font-bold transition border cursor-pointer ${
                      quickPayStatus === 'Unpaid'
                        ? 'bg-red-600 text-white border-red-500 shadow-md'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    ✗ Mark Unpaid
                  </button>
                </div>
              </div>

              {quickPayStatus !== 'Unpaid' && (
                <>
                  <div>
                    <label className="text-slate-300 block mb-1">
                      {quickPayStatus === 'Paid' ? 'Full Settlement Amount (₹)' : 'Partial Payment Amount (₹)'}
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={quickPayAmount}
                      onChange={(e) => setQuickPayAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm font-bold text-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-300 block mb-1">Payment Method</label>
                      <select
                        value={quickPayMethod}
                        onChange={(e) => setQuickPayMethod(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      >
                        <option value="Bank Transfer">Bank Transfer / NEFT</option>
                        <option value="UPI">UPI / GPay / PhonePe</option>
                        <option value="Cash">Cash</option>
                        <option value="Cheque">Cheque</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-300 block mb-1">UTR / Ref (Optional)</label>
                      <input
                        type="text"
                        value={quickPayRef}
                        onChange={(e) => setQuickPayRef(e.target.value)}
                        placeholder="Transaction UTR"
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowQuickPayModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow-md cursor-pointer"
                >
                  Update Payment Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
