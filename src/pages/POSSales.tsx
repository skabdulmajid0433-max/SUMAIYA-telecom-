import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  Search,
  Barcode as BarcodeIcon,
  Plus,
  Trash2,
  Printer,
  MessageCircle,
  CreditCard,
  User,
  Wrench,
  Percent,
  Check,
  AlertCircle
} from 'lucide-react';
import { Product, ProductCategory, Invoice } from '../types';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { InvoicePrintModal } from '../components/InvoicePrintModal';

interface CartItem {
  id: string;
  type: 'product' | 'repair';
  productId?: string;
  repairId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  maxStock?: number;
}

export const POSSales: React.FC = () => {
  const {
    products,
    customers,
    repairs,
    formatCurrency,
    refreshData,
    showToast
  } = useShop();

  const { currentUser } = useAuth();

  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [productSearch, setProductSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);

  // Customer selection
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Discount & Payment
  const [overallDiscount, setOverallDiscount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');

  // Modals
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showRepairSelector, setShowRepairSelector] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<Invoice | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.active) return false;
      if (categoryFilter !== 'All' && p.category !== categoryFilter) return false;
      if (productSearch.trim()) {
        const q = productSearch.toLowerCase().trim();
        const matches =
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.barcode.includes(q) ||
          p.compatibleModels.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [products, categoryFilter, productSearch]);

  // Cart operations
  const addToCart = (product: Product) => {
    if (product.quantity <= 0) {
      showToast(`Warning: ${product.name} is currently out of stock!`, 'error');
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          id: `cart-${Date.now()}-${Math.random()}`,
          type: 'product',
          productId: product.id,
          name: product.name,
          quantity: 1,
          unitPrice: product.sellingPrice,
          discount: 0,
          maxStock: product.quantity
        }
      ];
    });
    showToast(`Added ${product.name} to cart`, 'info');
  };

  const addRepairToCart = (repair: any) => {
    setCart((prev) => [
      ...prev,
      {
        id: `cart-rep-${Date.now()}`,
        type: 'repair',
        repairId: repair.id,
        name: `Repair: ${repair.brand} ${repair.model} (${repair.problemDescription})`,
        quantity: 1,
        unitPrice: repair.estimatedCost,
        discount: 0
      }
    ]);
    if (!customerName) setCustomerName(repair.customerName);
    if (!customerPhone) setCustomerPhone(repair.customerPhone);
    setShowRepairSelector(false);
    showToast(`Linked repair ${repair.id} to invoice`, 'success');
  };

  const updateItemQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const updateItemPrice = (id: string, price: number) => {
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, unitPrice: price } : item))
    );
  };

  const updateItemDiscount = (id: string, discount: number) => {
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, discount } : item))
    );
  };

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + (item.quantity * item.unitPrice - (item.discount || 0)),
      0
    );
  }, [cart]);

  const totalAmount = Math.max(0, subtotal - (overallDiscount || 0));
  const paidVal = paidAmount === '' ? totalAmount : Number(paidAmount);
  const dueAmount = Math.max(0, totalAmount - paidVal);

  // Scan handler
  const handleBarcodeScanned = (scannedCode: string) => {
    const matched = products.find(
      (p) =>
        p.active &&
        (p.barcode === scannedCode ||
          p.sku.toLowerCase() === scannedCode.toLowerCase())
    );
    if (matched) {
      addToCart(matched);
    } else {
      showToast(`No product found with code: ${scannedCode}`, 'error');
    }
  };

  // Fast customer selection
  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    const c = customers.find((cust) => cust.id === customerId);
    if (c) {
      setCustomerName(c.name);
      setCustomerPhone(c.phone);
    }
  };

  // Complete Sale
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      showToast('Cart is empty. Add at least one item.', 'error');
      return;
    }

    if (!customerName || !customerPhone) {
      showToast('Please specify customer name and phone number for invoice.', 'error');
      return;
    }

    try {
      const itemsPayload = cart.map((item) => ({
        type: item.type,
        productId: item.productId,
        repairId: item.repairId,
        description: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        total: item.quantity * item.unitPrice - item.discount
      }));

      const isCombined = cart.some((i) => i.type === 'repair');
      const invoiceType = isCombined ? 'combined' : 'sales';

      const res = await api.createInvoice({
        invoiceType,
        customerId: selectedCustomerId || undefined,
        customerName,
        customerPhone,
        items: itemsPayload,
        discount: overallDiscount,
        taxPercent: 0,
        paidAmount: paidVal,
        paymentMethod,
        notes,
        performedBy: currentUser?.name || 'Staff'
      });

      showToast(`Invoice #${res.invoice.id} created successfully!`, 'success');
      setCreatedInvoice(res.invoice);
      setShowPrintModal(true);

      // Reset cart
      setCart([]);
      setOverallDiscount(0);
      setPaidAmount('');
      setNotes('');
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to complete sale', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-emerald-400" />
            <span>Fast POS Billing & Sales</span>
          </h1>
          <p className="text-xs text-slate-400">
            Combine mobile accessories, repair charges, and spare parts in one bill
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowBarcodeScanner(true)}
            className="px-3.5 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <BarcodeIcon className="w-4 h-4" />
            <span>Scan Barcode</span>
          </button>

          <button
            onClick={() => setShowRepairSelector(true)}
            className="px-3.5 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <Wrench className="w-4 h-4" />
            <span>+ Attach Repair Charge</span>
          </button>
        </div>
      </div>

      {/* POS Grid: Left Items Selection, Right Cart & Checkout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Product Selection (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Categories Bar */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            {['All', 'Accessories', 'Spare Parts', 'LCD / Display', 'Tools & Consumables'].map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    categoryFilter === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              )
            )}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Search accessory, tempered glass, cable, LCD, or SKU..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Product Items Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[calc(100vh-19rem)] overflow-y-auto pr-1">
            {filteredProducts.map((p) => {
              const isLow = p.quantity <= (p.minStockLevel || 3);
              return (
                <div
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="p-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/50 rounded-xl cursor-pointer transition flex flex-col justify-between active:scale-[0.98] group"
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>{p.sku}</span>
                      <span className="text-slate-500">Rack: {p.rackLocation}</span>
                    </div>
                    <h4 className="font-semibold text-xs text-white mt-1 line-clamp-2 group-hover:text-blue-300 transition">
                      {p.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                      {p.compatibleModels}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-black text-sm text-emerald-400">
                        {formatCurrency(p.sellingPrice)}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                        isLow
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {p.quantity} {p.unit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Cart & Checkout Form (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="font-bold text-sm text-white flex items-center space-x-2">
                <ShoppingCart className="w-4 h-4 text-emerald-400" />
                <span>Current Invoice ({cart.length} items)</span>
              </span>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Clear Cart
                </button>
              )}
            </div>

            {/* Customer Selector / Input */}
            <div className="bg-slate-850 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
              <span className="font-bold text-slate-300 block">Customer Information:</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer Name *"
                  className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Phone Number *"
                  className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Quick link existing customer */}
              <div className="pt-1 flex items-center space-x-2">
                <span className="text-[10px] text-slate-500">Or pick existing:</span>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleSelectCustomer(e.target.value)}
                  className="flex-1 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-[11px] text-slate-300"
                >
                  <option value="">-- Choose customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {cart.length > 0 ? (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 bg-slate-850 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex-1 pr-2">
                      <div className="flex items-center space-x-1.5">
                        {item.type === 'repair' && (
                          <span className="text-[9px] px-1 bg-purple-900/60 text-purple-300 rounded font-bold">
                            REPAIR
                          </span>
                        )}
                        <span className="font-semibold text-white leading-tight line-clamp-1">
                          {item.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center space-x-2">
                        <span>Rate: ₹{item.unitPrice}</span>
                        <span>•</span>
                        <span>Total: {formatCurrency(item.quantity * item.unitPrice - item.discount)}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                        <button
                          type="button"
                          onClick={() => updateItemQty(item.id, -1)}
                          className="px-1 text-slate-400 hover:text-white font-bold"
                        >
                          -
                        </button>
                        <span className="w-5 text-center font-bold text-white">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateItemQty(item.id, 1)}
                          className="px-1 text-slate-400 hover:text-white font-bold"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="p-1 text-slate-500 hover:text-red-400 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-500 text-xs">
                  Cart is empty. Click any accessory or LCD on the left to add.
                </div>
              )}
            </div>
          </div>

          {/* Pricing & Checkout Section */}
          <div className="pt-3 border-t border-slate-800 space-y-3">
            {/* Discount & Totals */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span className="text-white font-medium">{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-400">
                <span>Overall Discount (₹):</span>
                <input
                  type="number"
                  min="0"
                  value={overallDiscount || ''}
                  onChange={(e) => setOverallDiscount(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-24 text-right px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-emerald-400 font-bold focus:outline-none"
                />
              </div>

              <div className="flex justify-between text-base font-black text-white pt-1 border-t border-slate-800">
                <span>Grand Total:</span>
                <span className="text-emerald-400">{formatCurrency(totalAmount)}</span>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-0.5">Amount Paid (₹)</label>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder={`${totalAmount}`}
                    className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm font-bold text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-0.5">Payment Mode</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="Card">Debit / Credit Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              {dueAmount > 0 && (
                <div className="p-2 bg-red-950/40 border border-red-800/40 rounded-lg flex items-center justify-between text-xs font-bold text-red-400">
                  <span>Customer Due Balance:</span>
                  <span>{formatCurrency(dueAmount)}</span>
                </div>
              )}
            </div>

            {/* Complete Sale Button */}
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 active:scale-98 transition flex items-center justify-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>Complete Sale & Print Bill ({formatCurrency(totalAmount)})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onScan={handleBarcodeScanned}
      />

      {/* Attach Repair Modal */}
      {showRepairSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl p-4 space-y-3 text-slate-100">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">Select Repair Job to Add to Bill</h3>
              <button
                onClick={() => setShowRepairSelector(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto space-y-2">
              {repairs
                .filter((r) => r.active && r.status !== 'Delivered')
                .map((r) => (
                  <div
                    key={r.id}
                    onClick={() => addRepairToCart(r)}
                    className="p-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl cursor-pointer flex justify-between items-center"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-blue-400">{r.id}</span>
                        <span className="font-bold text-xs text-white">
                          {r.brand} {r.model}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{r.customerName} ({r.customerPhone})</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-xs text-white">{formatCurrency(r.estimatedCost)}</div>
                      <div className="text-[10px] text-amber-400">Due: {formatCurrency(r.remainingAmount)}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Print Bill Modal */}
      {createdInvoice && (
        <InvoicePrintModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          invoice={createdInvoice}
          mode="invoice"
        />
      )}
    </div>
  );
};
