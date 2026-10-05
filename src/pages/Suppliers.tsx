import React, { useState, useMemo } from 'react';
import {
  Truck,
  Plus,
  Search,
  Phone,
  MessageCircle,
  CreditCard,
  RotateCcw,
  Receipt,
  FileText,
  X,
  Check,
  Edit2,
  Trash2,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  DollarSign,
  AlertTriangle,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { Supplier, Purchase, SupplierReturn, SupplierPayment, PurchaseItem, ProductCategory } from '../types';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const Suppliers: React.FC = () => {
  const {
    suppliers,
    purchases,
    supplierReturns,
    supplierPayments,
    products,
    customers,
    invoices,
    formatCurrency,
    formatDate,
    refreshData,
    showToast
  } = useShop();

  const { currentUser, canDeleteRecords } = useAuth();

  const [activeMainTab, setActiveMainTab] = useState<'simple_register' | 'suppliers' | 'purchases' | 'wholesale_sales' | 'returns' | 'payments'>('simple_register');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'All' | 'Paid' | 'Partially Paid' | 'Unpaid'>('All');
  const [wholesaleStatusFilter, setWholesaleStatusFilter] = useState<'All' | 'Unpaid' | 'Paid'>('All');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(() => suppliers[0]?.id || '');

  // Simple Register Form State (Fast Entry)
  const [simpleEntryType, setSimpleEntryType] = useState<'buy' | 'sell' | 'return'>('sell');
  const [simpleFormData, setSimpleFormData] = useState({
    partyRole: 'buyer' as 'seller' | 'buyer' | 'shopper',
    partyName: '',
    partyPhone: '',
    productName: '',
    productPrice: '',
    productDate: new Date().toISOString().split('T')[0],
    quantity: 1,
    paymentStatus: 'Paid' as 'Paid' | 'Unpaid' | 'Partially Paid',
    paidAmount: '',
    paymentMethod: 'Cash',
    notes: ''
  });

  // State for Simple Manual Edit Modal
  const [showSimpleEditModal, setShowSimpleEditModal] = useState(false);
  const [editingSimpleTrade, setEditingSimpleTrade] = useState<any | null>(null);
  const [simpleEditFormData, setSimpleEditFormData] = useState({
    id: '',
    type: 'sell' as 'buy' | 'sell' | 'return',
    partyRole: 'buyer' as 'seller' | 'buyer' | 'shopper',
    partyName: '',
    partyPhone: '',
    productName: '',
    productPrice: 0,
    productDate: '',
    quantity: 1,
    totalAmount: 0,
    paidAmount: 0,
    dueAmount: 0,
    paymentStatus: 'Paid' as 'Paid' | 'Unpaid' | 'Partially Paid',
    notes: ''
  });

  // Simple Register Filter
  const [simpleFilter, setSimpleFilter] = useState<'All' | 'buy' | 'sell' | 'return' | 'due' | 'clear'>('All');

  // Modals
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<SupplierPayment | null>(null);

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [editingReturn, setEditingReturn] = useState<SupplierReturn | null>(null);

  const [showWholesaleSaleModal, setShowWholesaleSaleModal] = useState(false);
  const [editingWholesaleInvoice, setEditingWholesaleInvoice] = useState<any | null>(null);

  // Quick Amount Paid / Unpaid Modal for Purchase
  const [showQuickPayModal, setShowQuickPayModal] = useState(false);
  const [targetPurchaseForPay, setTargetPurchaseForPay] = useState<Purchase | null>(null);
  const [quickPayAmount, setQuickPayAmount] = useState<number>(0);
  const [quickPayStatus, setQuickPayStatus] = useState<'Paid' | 'Partially Paid' | 'Unpaid'>('Paid');
  const [quickPayMethod, setQuickPayMethod] = useState('Bank Transfer');
  const [quickPayRef, setQuickPayRef] = useState('');

  // Quick Amount Paid / Unpaid Modal for Wholesale Sale
  const [showWholesalePayModal, setShowWholesalePayModal] = useState(false);
  const [targetWholesaleForPay, setTargetWholesaleForPay] = useState<any | null>(null);
  const [quickWholesaleAmount, setQuickWholesaleAmount] = useState<number>(0);
  const [quickWholesaleStatus, setQuickWholesaleStatus] = useState<'Paid' | 'Partially Paid' | 'Unpaid'>('Paid');
  const [quickWholesaleMethod, setQuickWholesaleMethod] = useState('Cash');

  // Supplier Form State
  const [supplierFormData, setSupplierFormData] = useState({
    name: '',
    companyName: '',
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    gstNumber: '',
    notes: ''
  });

  // Purchase Form State
  const [purchaseFormData, setPurchaseFormData] = useState({
    supplierId: suppliers[0]?.id || '',
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    items: [] as PurchaseItem[],
    paidAmount: '',
    paymentStatus: 'Unpaid' as 'Paid' | 'Partially Paid' | 'Unpaid',
    paymentMethod: 'Bank Transfer',
    notes: ''
  });

  // Purchase Row Item input
  const [pRowProductId, setPRowProductId] = useState('');
  const [isManualPurchaseRow, setIsManualPurchaseRow] = useState(false);
  const [manualPurchaseName, setManualPurchaseName] = useState('');
  const [manualPurchaseCategory, setManualPurchaseCategory] = useState<ProductCategory>('Spare Parts');
  const [pRowQty, setPRowQty] = useState<number>(10);
  const [pRowCost, setPRowCost] = useState<number>(0);
  const [pRowSell, setPRowSell] = useState<number>(0);

  // Wholesale Sale Form State (Sell items to dealer / shop)
  const [wholesaleFormData, setWholesaleFormData] = useState({
    customerName: '',
    customerPhone: '',
    productId: '',
    customProductName: '',
    isManualProduct: false,
    quantity: 1,
    unitPrice: 0,
    paidAmount: '',
    paymentMethod: 'Cash',
    notes: ''
  });

  // Return Form State
  const [returnFormData, setReturnFormData] = useState({
    supplierId: suppliers[0]?.id || '',
    productId: '',
    quantity: 1,
    purchasePrice: 0,
    reason: 'Defective touch flex during pre-fit testing',
    notes: ''
  });

  // Payment Form State
  const [paymentFormData, setPaymentFormData] = useState({
    supplierId: suppliers[0]?.id || '',
    amount: '',
    paymentMethod: 'Bank Transfer',
    referenceNumber: '',
    notes: ''
  });

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      if (!s.active) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          s.name.toLowerCase().includes(q) ||
          s.companyName.toLowerCase().includes(q) ||
          s.phone.includes(q) ||
          (s.address && s.address.toLowerCase().includes(q)) ||
          (s.gstNumber && s.gstNumber.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [suppliers, searchQuery]);

  const activeSupplier = useMemo(() => {
    return suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0] || null;
  }, [suppliers, selectedSupplierId]);

  // Purchases Filtered
  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      if (paymentStatusFilter !== 'All' && p.paymentStatus !== paymentStatusFilter) return false;
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
  }, [purchases, paymentStatusFilter, searchQuery]);

  // Wholesale Sales (Invoices with type wholesale)
  const wholesaleInvoices = useMemo(() => {
    return invoices.filter((inv) => inv.invoiceType === 'wholesale' || inv.items.some((i) => i.description.toLowerCase().includes('wholesale')));
  }, [invoices]);

  const filteredWholesaleInvoices = useMemo(() => {
    return wholesaleInvoices.filter((inv) => {
      if (wholesaleStatusFilter === 'Unpaid' && inv.dueAmount <= 0) return false;
      if (wholesaleStatusFilter === 'Paid' && inv.dueAmount > 0) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          inv.id.toLowerCase().includes(q) ||
          inv.customerName.toLowerCase().includes(q) ||
          inv.customerPhone.includes(q) ||
          inv.items.some((i) => i.description.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [wholesaleInvoices, wholesaleStatusFilter, searchQuery]);

  // Active supplier ledger calculations
  const activeSupplierPurchases = useMemo(() => {
    if (!activeSupplier) return [];
    return purchases.filter((p) => p.supplierId === activeSupplier.id);
  }, [purchases, activeSupplier]);

  const activeSupplierReturns = useMemo(() => {
    if (!activeSupplier) return [];
    return supplierReturns.filter((r) => r.supplierId === activeSupplier.id);
  }, [supplierReturns, activeSupplier]);

  const activeSupplierPayments = useMemo(() => {
    if (!activeSupplier) return [];
    return supplierPayments.filter((p) => p.supplierId === activeSupplier.id);
  }, [supplierPayments, activeSupplier]);

  const totalPurchased = activeSupplierPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
  const totalReturned = activeSupplierReturns.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalPaid = activeSupplierPayments.reduce((sum, p) => sum + p.amount, 0);
  const netOutstanding = totalPurchased - totalReturned - totalPaid;

  // Total shop-wide supplier payable
  const totalShopSupplierDues = purchases.reduce((sum, p) => sum + p.dueAmount, 0);
  const unpaidPurchasesCount = purchases.filter((p) => p.dueAmount > 0).length;

  // Total wholesale receivables (dues from dealers/shops)
  const totalWholesaleDues = wholesaleInvoices.reduce((sum, inv) => sum + inv.dueAmount, 0);
  const unpaidWholesaleCount = wholesaleInvoices.filter((inv) => inv.dueAmount > 0).length;

  // Total purchase inward volume
  const totalPurchaseVolume = purchases.reduce((sum, p) => sum + p.totalAmount, 0);

  // Total returns value
  const totalReturnsValue = supplierReturns.reduce((sum, r) => sum + r.totalAmount, 0);

  // --- UNIFIED SIMPLE TRADE REGISTER DATA ---
  const unifiedTrades = useMemo(() => {
    const list: Array<{
      id: string;
      type: 'buy' | 'sell' | 'return';
      partyRole: 'Seller (Supplier)' | 'Buyer (Shopper/Dealer)' | 'Return (Supplier)';
      partyName: string;
      partyPhone: string;
      productName: string;
      productPrice: number;
      quantity: number;
      totalAmount: number;
      paidAmount: number;
      dueAmount: number;
      paymentStatus: 'Paid' | 'Unpaid' | 'Partially Paid';
      date: string;
      notes?: string;
      raw: any;
    }> = [];

    // 1. Buy Orders (Purchases from Sellers/Suppliers)
    purchases.forEach((p) => {
      const firstItem = p.items?.[0];
      const prodName = p.items?.map((i) => i.productName).join(', ') || 'Spare Parts';
      const qty = p.items?.reduce((s, i) => s + (i.quantity || 1), 0) || 1;
      const price = firstItem?.purchasePrice || (qty > 0 ? Math.round(p.totalAmount / qty) : p.totalAmount);
      const sup = suppliers.find((s) => s.id === p.supplierId);
      list.push({
        id: p.id,
        type: 'buy',
        partyRole: 'Seller (Supplier)',
        partyName: p.supplierName || sup?.companyName || sup?.name || 'Supplier',
        partyPhone: sup?.phone || '',
        productName: prodName,
        productPrice: price,
        quantity: qty,
        totalAmount: p.totalAmount,
        paidAmount: p.paidAmount,
        dueAmount: p.dueAmount,
        paymentStatus: p.paymentStatus,
        date: p.date || p.createdAt?.split('T')[0] || '',
        notes: p.notes,
        raw: p
      });
    });

    // 2. Sell Orders (Invoices to Buyers/Shoppers/Dealers)
    invoices.forEach((inv) => {
      const firstItem = inv.items?.[0];
      const prodName = inv.items?.map((i) => i.description?.replace(/^Wholesale:\s*/i, '') || 'Item').join(', ') || 'Sales Item';
      const qty = inv.items?.reduce((s, i) => s + (i.quantity || 1), 0) || 1;
      const price = firstItem?.unitPrice || (qty > 0 ? Math.round(inv.totalAmount / qty) : inv.totalAmount);
      list.push({
        id: inv.id,
        type: 'sell',
        partyRole: 'Buyer (Shopper/Dealer)',
        partyName: inv.customerName || 'Walk-in Shopper',
        partyPhone: inv.customerPhone || '',
        productName: prodName,
        productPrice: price,
        quantity: qty,
        totalAmount: inv.totalAmount,
        paidAmount: inv.paidAmount,
        dueAmount: inv.dueAmount,
        paymentStatus: inv.paymentStatus,
        date: inv.createdAt?.split('T')[0] || '',
        notes: inv.notes,
        raw: inv
      });
    });

    // 3. Return Orders (Supplier Returns)
    supplierReturns.forEach((ret) => {
      const isPaid = ret.status === 'Refund Received';
      list.push({
        id: ret.id,
        type: 'return',
        partyRole: 'Return (Supplier)',
        partyName: ret.supplierName || 'Supplier',
        partyPhone: suppliers.find((s) => s.id === ret.supplierId)?.phone || '',
        productName: ret.productName,
        productPrice: ret.purchasePrice,
        quantity: ret.quantity,
        totalAmount: ret.totalAmount,
        paidAmount: isPaid ? ret.totalAmount : 0,
        dueAmount: isPaid ? 0 : ret.totalAmount,
        paymentStatus: isPaid ? 'Paid' : 'Unpaid',
        date: ret.date || '',
        notes: `${ret.reason || ''} [${ret.status || 'Defective'}]`,
        raw: ret
      });
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [purchases, invoices, supplierReturns, suppliers]);

  const filteredSimpleTrades = useMemo(() => {
    return unifiedTrades.filter((t) => {
      if (simpleFilter === 'buy' && t.type !== 'buy') return false;
      if (simpleFilter === 'sell' && t.type !== 'sell') return false;
      if (simpleFilter === 'return' && t.type !== 'return') return false;
      if (simpleFilter === 'due' && t.dueAmount <= 0) return false;
      if (simpleFilter === 'clear' && t.dueAmount > 0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          t.partyName.toLowerCase().includes(q) ||
          t.productName.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          t.partyPhone.includes(q) ||
          t.date.includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [unifiedTrades, simpleFilter, searchQuery]);

  const simpleStats = useMemo(() => {
    const buyTotal = unifiedTrades.filter((t) => t.type === 'buy').reduce((s, t) => s + t.totalAmount, 0);
    const sellTotal = unifiedTrades.filter((t) => t.type === 'sell').reduce((s, t) => s + t.totalAmount, 0);
    const dueTotal = unifiedTrades.reduce((s, t) => s + t.dueAmount, 0);
    const clearCount = unifiedTrades.filter((t) => t.dueAmount === 0).length;
    const dueCount = unifiedTrades.filter((t) => t.dueAmount > 0).length;
    return { buyTotal, sellTotal, dueTotal, clearCount, dueCount };
  }, [unifiedTrades]);

  // Simple Trade Fast Entry Save
  const handleSaveSimpleTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simpleFormData.partyName.trim()) {
      showToast('Please enter the Seller / Buyer / Shopper name', 'error');
      return;
    }
    if (!simpleFormData.productName.trim()) {
      showToast('Please enter the Product name', 'error');
      return;
    }
    const qty = Number(simpleFormData.quantity) || 1;
    const price = Number(simpleFormData.productPrice) || 0;
    const total = qty * price;
    const paid = simpleFormData.paidAmount === ''
      ? (simpleFormData.paymentStatus === 'Paid' ? total : 0)
      : Number(simpleFormData.paidAmount);
    const due = Math.max(0, total - paid);
    const status = due === 0 ? 'Paid' : (paid > 0 ? 'Partially Paid' : 'Unpaid');

    try {
      if (simpleEntryType === 'buy') {
        let sup = suppliers.find(
          (s) =>
            s.name.toLowerCase() === simpleFormData.partyName.toLowerCase() ||
            s.companyName.toLowerCase() === simpleFormData.partyName.toLowerCase()
        );
        const supplierId = sup?.id || `sup-${Date.now()}`;
        if (!sup) {
          await api.createSupplier(
            {
              name: simpleFormData.partyName.trim(),
              companyName: simpleFormData.partyName.trim(),
              phone: simpleFormData.partyPhone.trim() || '9876543210',
              address: 'Market Vendor'
            },
            currentUser?.name || 'Staff'
          );
        }
        await api.createPurchase({
          supplierId,
          supplierName: simpleFormData.partyName.trim(),
          invoiceNumber: `INV-${Date.now().toString().slice(-4)}`,
          date: simpleFormData.productDate,
          items: [
            {
              productId: `man-${Date.now()}`,
              productName: simpleFormData.productName.trim(),
              category: 'Spare Parts',
              quantity: qty,
              purchasePrice: price,
              sellingPrice: Math.round(price * 1.3),
              total
            }
          ],
          totalAmount: total,
          paidAmount: paid,
          dueAmount: due,
          paymentStatus: status,
          paymentMethod: simpleFormData.paymentMethod,
          notes: simpleFormData.notes || 'Recorded via Simple Register',
          performedBy: currentUser?.name || 'Staff'
        });
        showToast(`Buy order of ₹${total} from "${simpleFormData.partyName}" saved!`, 'success');
      } else if (simpleEntryType === 'sell') {
        await api.createInvoice({
          invoiceType: 'wholesale',
          customerName: simpleFormData.partyName.trim(),
          customerPhone: simpleFormData.partyPhone.trim() || '9876543210',
          items: [
            {
              type: 'product',
              description: simpleFormData.productName.trim(),
              quantity: qty,
              unitPrice: price,
              discount: 0,
              total
            }
          ],
          discount: 0,
          taxPercent: 0,
          paidAmount: paid,
          paymentMethod: simpleFormData.paymentMethod,
          notes: simpleFormData.notes || 'Recorded via Simple Register',
          performedBy: currentUser?.name || 'Staff'
        });
        showToast(`Sale bill of ₹${total} to "${simpleFormData.partyName}" created!`, 'success');
      } else if (simpleEntryType === 'return') {
        const sup = suppliers.find(
          (s) =>
            s.name.toLowerCase() === simpleFormData.partyName.toLowerCase() ||
            s.companyName.toLowerCase() === simpleFormData.partyName.toLowerCase()
        );
        await api.createSupplierReturn({
          supplierId: sup?.id || suppliers[0]?.id || `sup-${Date.now()}`,
          supplierName: simpleFormData.partyName.trim(),
          productId: `man-${Date.now()}`,
          productName: simpleFormData.productName.trim(),
          quantity: qty,
          purchasePrice: price,
          totalAmount: total,
          reason: simpleFormData.notes || 'Defective part return',
          date: simpleFormData.productDate,
          status: status === 'Paid' ? 'Refund Received' : 'Credited to Ledger',
          notes: simpleFormData.notes || '',
          performedBy: currentUser?.name || 'Staff'
        });
        showToast(`Return of ₹${total} to "${simpleFormData.partyName}" recorded!`, 'success');
      }

      // Reset
      setSimpleFormData({
        partyRole: simpleEntryType === 'buy' ? 'seller' : 'buyer',
        partyName: '',
        partyPhone: '',
        productName: '',
        productPrice: '',
        productDate: new Date().toISOString().split('T')[0],
        quantity: 1,
        paymentStatus: 'Paid',
        paidAmount: '',
        paymentMethod: 'Cash',
        notes: ''
      });
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save transaction', 'error');
    }
  };

  // Instant Clear Payment (1-Click)
  const handleClearTradePayment = async (trade: any) => {
    try {
      if (trade.type === 'buy') {
        await api.updatePurchasePayment(trade.id, {
          paymentStatus: 'Paid',
          amountPaidNow: trade.dueAmount,
          paymentMethod: 'Cash',
          notes: 'Payment cleared from Simple Register'
        });
        showToast(`Payment cleared for Buy Order ${trade.id} (₹${trade.dueAmount})!`, 'success');
      } else if (trade.type === 'sell') {
        await api.updateInvoice(trade.id, {
          paidAmount: trade.totalAmount,
          dueAmount: 0,
          paymentStatus: 'Paid'
        });
        showToast(`Payment cleared for Bill ${trade.id} (₹${trade.dueAmount})!`, 'success');
      } else if (trade.type === 'return') {
        await api.updateSupplierReturn(trade.id, {
          status: 'Refund Received'
        });
        showToast(`Return ${trade.id} marked as Refund Received / Settled!`, 'success');
      }
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to clear payment', 'error');
    }
  };

  // Manual Edit Option Handlers
  const handleOpenSimpleEdit = (trade: any) => {
    setEditingSimpleTrade(trade);
    setSimpleEditFormData({
      id: trade.id,
      type: trade.type,
      partyRole: trade.type === 'buy' ? 'seller' : (trade.type === 'sell' ? 'buyer' : 'seller'),
      partyName: trade.partyName,
      partyPhone: trade.partyPhone || '',
      productName: trade.productName,
      productPrice: trade.productPrice,
      productDate: trade.date,
      quantity: trade.quantity,
      totalAmount: trade.totalAmount,
      paidAmount: trade.paidAmount,
      dueAmount: trade.dueAmount,
      paymentStatus: trade.paymentStatus,
      notes: trade.notes || ''
    });
    setShowSimpleEditModal(true);
  };

  const handleSaveSimpleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSimpleTrade) return;

    const qty = Number(simpleEditFormData.quantity) || 1;
    const price = Number(simpleEditFormData.productPrice) || 0;
    const total = qty * price;
    const paid = Number(simpleEditFormData.paidAmount);
    const due = Math.max(0, total - paid);
    const status = due === 0 ? 'Paid' : (paid > 0 ? 'Partially Paid' : 'Unpaid');

    try {
      if (editingSimpleTrade.type === 'buy') {
        await api.updatePurchase(editingSimpleTrade.id, {
          supplierName: simpleEditFormData.partyName,
          date: simpleEditFormData.productDate,
          items: [
            {
              productId: editingSimpleTrade.raw.items?.[0]?.productId || `man-${Date.now()}`,
              productName: simpleEditFormData.productName,
              category: editingSimpleTrade.raw.items?.[0]?.category || 'Spare Parts',
              quantity: qty,
              purchasePrice: price,
              sellingPrice: Math.round(price * 1.3),
              total
            }
          ],
          totalAmount: total,
          paidAmount: paid,
          dueAmount: due,
          paymentStatus: status,
          notes: simpleEditFormData.notes
        });
        showToast(`Buy Order ${editingSimpleTrade.id} updated!`, 'success');
      } else if (editingSimpleTrade.type === 'sell') {
        await api.updateInvoice(editingSimpleTrade.id, {
          customerName: simpleEditFormData.partyName,
          customerPhone: simpleEditFormData.partyPhone,
          items: [
            {
              type: 'product',
              description: simpleEditFormData.productName,
              quantity: qty,
              unitPrice: price,
              total
            }
          ],
          totalAmount: total,
          paidAmount: paid,
          dueAmount: due,
          paymentStatus: status,
          notes: simpleEditFormData.notes
        });
        showToast(`Sale Invoice ${editingSimpleTrade.id} updated!`, 'success');
      } else if (editingSimpleTrade.type === 'return') {
        await api.updateSupplierReturn(editingSimpleTrade.id, {
          supplierName: simpleEditFormData.partyName,
          productName: simpleEditFormData.productName,
          quantity: qty,
          purchasePrice: price,
          totalAmount: total,
          reason: simpleEditFormData.notes,
          date: simpleEditFormData.productDate,
          status: status === 'Paid' ? 'Refund Received' : 'Credited to Ledger'
        });
        showToast(`Return ${editingSimpleTrade.id} updated!`, 'success');
      }

      setShowSimpleEditModal(false);
      setEditingSimpleTrade(null);
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update transaction', 'error');
    }
  };

  const handleDeleteSimpleTrade = async (trade: any) => {
    if (!confirm(`Are you sure you want to delete ${trade.type.toUpperCase()} record ${trade.id}?`)) return;
    try {
      if (trade.type === 'buy') {
        await api.deletePurchase(trade.id);
      } else if (trade.type === 'sell') {
        await api.deleteInvoice(trade.id);
      } else if (trade.type === 'return') {
        await api.deleteSupplierReturn(trade.id);
      }
      showToast(`Record ${trade.id} deleted`, 'success');
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete record', 'error');
    }
  };

  // --- CRUD HANDLERS ---

  // 1. Supplier Create / Edit / Delete
  const handleOpenAddSupplier = () => {
    setEditingSupplier(null);
    setSupplierFormData({
      name: '',
      companyName: '',
      phone: '',
      whatsapp: '',
      email: '',
      address: '',
      gstNumber: '',
      notes: ''
    });
    setShowSupplierModal(true);
  };

  const handleOpenEditSupplier = (s: Supplier) => {
    setEditingSupplier(s);
    setSupplierFormData({
      name: s.name,
      companyName: s.companyName,
      phone: s.phone,
      whatsapp: s.whatsapp || s.phone,
      email: s.email || '',
      address: s.address || '',
      gstNumber: s.gstNumber || '',
      notes: s.notes || ''
    });
    setShowSupplierModal(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierFormData.companyName || !supplierFormData.phone) {
      showToast('Supplier company name and mobile number are required', 'error');
      return;
    }

    try {
      if (editingSupplier) {
        await api.updateSupplier(editingSupplier.id, supplierFormData, currentUser?.name || 'Admin');
        showToast(`Supplier ${supplierFormData.companyName} updated!`, 'success');
      } else {
        const res = await api.createSupplier(supplierFormData, currentUser?.name || 'Admin');
        showToast(`Supplier ${supplierFormData.companyName} added!`, 'success');
        setSelectedSupplierId(res.supplier.id);
      }
      setShowSupplierModal(false);
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save supplier', 'error');
    }
  };

  const handleDeleteSupplier = async (s: Supplier) => {
    if (!confirm(`Are you sure you want to deactivate supplier "${s.companyName}"?`)) return;
    try {
      await api.deleteSupplier(s.id, currentUser?.name || 'Admin');
      showToast('Supplier archived successfully', 'success');
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete supplier', 'error');
    }
  };

  // 2. Buy / Purchase Create / Edit / Delete
  const handleOpenAddPurchase = () => {
    setEditingPurchase(null);
    setPurchaseFormData({
      supplierId: activeSupplier?.id || suppliers[0]?.id || '',
      invoiceNumber: '',
      date: new Date().toISOString().split('T')[0],
      items: [],
      paidAmount: '',
      paymentStatus: 'Unpaid',
      paymentMethod: 'Bank Transfer',
      notes: ''
    });
    setPRowProductId('');
    setPRowQty(10);
    setPRowCost(0);
    setPRowSell(0);
    setShowPurchaseModal(true);
  };

  const handleOpenEditPurchase = (p: Purchase) => {
    setEditingPurchase(p);
    setPurchaseFormData({
      supplierId: p.supplierId,
      invoiceNumber: p.invoiceNumber,
      date: p.date,
      items: [...p.items],
      paidAmount: String(p.paidAmount),
      paymentStatus: p.paymentStatus,
      paymentMethod: p.paymentMethod,
      notes: p.notes || ''
    });
    setPRowProductId('');
    setShowPurchaseModal(true);
  };

  const handleAddPurchaseItem = () => {
    if (isManualPurchaseRow) {
      if (!manualPurchaseName.trim()) {
        showToast('Please type the product name', 'error');
        return;
      }
      setPurchaseFormData((prev) => ({
        ...prev,
        items: [
          ...prev.items,
          {
            productId: `man-${Date.now()}`,
            productName: manualPurchaseName.trim(),
            category: manualPurchaseCategory,
            quantity: Number(pRowQty) || 1,
            purchasePrice: Number(pRowCost) || 0,
            sellingPrice: Number(pRowSell) || Math.round((Number(pRowCost) || 0) * 1.3),
            total: (Number(pRowQty) || 1) * (Number(pRowCost) || 0)
          }
        ]
      }));
      setManualPurchaseName('');
      setPRowQty(10);
      setPRowCost(0);
      setPRowSell(0);
      return;
    }

    if (!pRowProductId) return;
    const prod = products.find((p) => p.id === pRowProductId);
    if (!prod) return;

    setPurchaseFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: prod.id,
          productName: prod.name,
          category: prod.category,
          quantity: Number(pRowQty) || 1,
          purchasePrice: Number(pRowCost) || prod.purchasePrice,
          sellingPrice: Number(pRowSell) || prod.sellingPrice,
          total: (Number(pRowQty) || 1) * (Number(pRowCost) || prod.purchasePrice)
        }
      ]
    }));

    setPRowProductId('');
    setPRowQty(10);
    setPRowCost(0);
    setPRowSell(0);
  };

  const handleRemovePurchaseItem = (idx: number) => {
    setPurchaseFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const totalCalculatedPurchase = purchaseFormData.items.reduce((sum, item) => sum + item.total, 0);

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseFormData.supplierId || purchaseFormData.items.length === 0) {
      showToast('Select a supplier and add at least one product item', 'error');
      return;
    }

    const sup = suppliers.find((s) => s.id === purchaseFormData.supplierId);
    const paidVal = purchaseFormData.paidAmount === '' ? totalCalculatedPurchase : Number(purchaseFormData.paidAmount);

    let status = purchaseFormData.paymentStatus;
    if (paidVal >= totalCalculatedPurchase) status = 'Paid';
    else if (paidVal > 0) status = 'Partially Paid';
    else status = 'Unpaid';

    try {
      if (editingPurchase) {
        await api.updatePurchase(editingPurchase.id, {
          ...purchaseFormData,
          supplierName: sup?.companyName || sup?.name || 'Supplier',
          totalAmount: totalCalculatedPurchase,
          paidAmount: paidVal,
          paymentStatus: status,
          performedBy: currentUser?.name || 'Admin'
        });
        showToast(`Purchase order ${editingPurchase.id} updated!`, 'success');
      } else {
        await api.createPurchase({
          ...purchaseFormData,
          supplierName: sup?.companyName || sup?.name || 'Supplier',
          totalAmount: totalCalculatedPurchase,
          paidAmount: paidVal,
          paymentStatus: status,
          performedBy: currentUser?.name || 'Admin'
        });
        showToast('Wholesale buy order recorded & inventory stock increased!', 'success');
      }
      setShowPurchaseModal(false);
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save purchase', 'error');
    }
  };

  const handleDeletePurchase = async (p: Purchase) => {
    if (!confirm(`Are you sure you want to delete purchase order ${p.id}?`)) return;
    try {
      await api.deletePurchase(p.id);
      showToast(`Purchase ${p.id} deleted`, 'success');
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete purchase', 'error');
    }
  };

  // 3. Quick Paid / Unpaid Option on Purchase
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
        notes: `Quick payment update: ${quickPayStatus}`,
        performedBy: currentUser?.name || 'Admin'
      });
      showToast(`Purchase payment status set to ${quickPayStatus}!`, 'success');
      setShowQuickPayModal(false);
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update payment status', 'error');
    }
  };

  // 4. Wholesale Sell (Sell Items to dealers/shops)
  const handleOpenAddWholesale = () => {
    setEditingWholesaleInvoice(null);
    setWholesaleFormData({
      customerName: '',
      customerPhone: '',
      productId: products[0]?.id || '',
      customProductName: '',
      isManualProduct: false,
      quantity: 5,
      unitPrice: products[0]?.wholesalePrice || products[0]?.sellingPrice || 0,
      paidAmount: '',
      paymentMethod: 'Cash',
      notes: ''
    });
    setShowWholesaleSaleModal(true);
  };

  const handleOpenEditWholesale = (inv: any) => {
    setEditingWholesaleInvoice(inv);
    const item = inv.items?.[0];
    const isManual = item?.productId ? !products.some((p) => p.id === item.productId) : true;
    const customName = item?.description
      ? item.description.replace(/^Wholesale:\s*/i, '').replace(/\s*\([^)]*\)$/, '')
      : '';

    setWholesaleFormData({
      customerName: inv.customerName || '',
      customerPhone: inv.customerPhone || '',
      productId: item?.productId || (isManual ? '' : products[0]?.id || ''),
      customProductName: customName,
      isManualProduct: isManual,
      quantity: item?.quantity || 1,
      unitPrice: item?.unitPrice || 0,
      paidAmount: String(inv.paidAmount),
      paymentMethod: inv.payments?.[0]?.method || 'Cash',
      notes: inv.notes || ''
    });
    setShowWholesaleSaleModal(true);
  };

  const handleSaveWholesaleSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wholesaleFormData.customerName.trim() || !wholesaleFormData.customerPhone.trim()) {
      showToast('Please fill dealer name and mobile number', 'error');
      return;
    }

    let prodName = '';
    let prodSku = '';
    let prodId: string | undefined = undefined;

    if (wholesaleFormData.isManualProduct) {
      if (!wholesaleFormData.customProductName.trim()) {
        showToast('Please enter the manual product name', 'error');
        return;
      }
      prodName = wholesaleFormData.customProductName.trim();
      prodSku = `MAN-${Date.now().toString().slice(-4)}`;
    } else {
      if (!wholesaleFormData.productId) {
        showToast('Please select a product from catalog or choose Manual Product Name', 'error');
        return;
      }
      const prod = products.find((p) => p.id === wholesaleFormData.productId);
      if (!prod) {
        showToast('Selected product not found', 'error');
        return;
      }
      prodName = prod.name;
      prodSku = prod.sku;
      prodId = prod.id;
    }

    const qty = Number(wholesaleFormData.quantity) || 1;
    const rate = Number(wholesaleFormData.unitPrice) || 0;
    const total = qty * rate;
    const paid = wholesaleFormData.paidAmount === '' ? total : Number(wholesaleFormData.paidAmount);
    const due = Math.max(0, total - paid);
    const status = due === 0 ? 'Paid' : (paid > 0 ? 'Partially Paid' : 'Unpaid');

    try {
      if (editingWholesaleInvoice) {
        await api.updateInvoice(editingWholesaleInvoice.id, {
          customerName: wholesaleFormData.customerName,
          customerPhone: wholesaleFormData.customerPhone,
          items: [
            {
              id: editingWholesaleInvoice.items?.[0]?.id || `item-${Date.now()}`,
              type: 'product',
              productId: prodId,
              description: `Wholesale: ${prodName} (${prodSku})`,
              quantity: qty,
              unitPrice: rate,
              discount: 0,
              total
            }
          ],
          subtotal: total,
          totalAmount: total,
          paidAmount: paid,
          dueAmount: due,
          paymentStatus: status,
          notes: wholesaleFormData.notes || 'Wholesale sale to dealer/tech',
          performedBy: currentUser?.name || 'Staff'
        });
        showToast(`Wholesale invoice ${editingWholesaleInvoice.id} updated!`, 'success');
      } else {
        await api.createInvoice({
          invoiceType: 'wholesale',
          customerName: wholesaleFormData.customerName,
          customerPhone: wholesaleFormData.customerPhone,
          items: [
            {
              type: 'product',
              productId: prodId,
              description: `Wholesale: ${prodName} (${prodSku})`,
              quantity: qty,
              unitPrice: rate,
              discount: 0,
              total
            }
          ],
          discount: 0,
          taxPercent: 0,
          paidAmount: paid,
          paymentMethod: wholesaleFormData.paymentMethod,
          notes: wholesaleFormData.notes || 'Wholesale sale to dealer/tech',
          performedBy: currentUser?.name || 'Staff'
        });
        showToast(
          wholesaleFormData.isManualProduct
            ? `Wholesale invoice created for "${prodName}"!`
            : `Wholesale invoice created! Stock deducted.`,
          'success'
        );
      }

      setShowWholesaleSaleModal(false);
      setEditingWholesaleInvoice(null);
      setWholesaleFormData({
        customerName: '',
        customerPhone: '',
        productId: '',
        customProductName: '',
        isManualProduct: false,
        quantity: 1,
        unitPrice: 0,
        paidAmount: '',
        paymentMethod: 'Cash',
        notes: ''
      });
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to record wholesale sale', 'error');
    }
  };

  const handleDeleteWholesaleSale = async (inv: any) => {
    if (!confirm(`Are you sure you want to delete wholesale bill ${inv.id}?`)) return;
    try {
      await api.deleteInvoice(inv.id);
      showToast(`Wholesale invoice ${inv.id} deleted`, 'success');
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete wholesale bill', 'error');
    }
  };

  // Quick Amount Paid / Unpaid Option for Wholesale
  const openQuickWholesalePayModal = (inv: any) => {
    setTargetWholesaleForPay(inv);
    setQuickWholesaleAmount(inv.dueAmount);
    setQuickWholesaleStatus(inv.paymentStatus);
    setQuickWholesaleMethod(inv.payments?.[0]?.method || 'Cash');
    setShowWholesalePayModal(true);
  };

  const handleApplyQuickWholesalePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetWholesaleForPay) return;

    try {
      if (quickWholesaleStatus === 'Paid') {
        await api.payInvoice(targetWholesaleForPay.id, {
          amount: targetWholesaleForPay.dueAmount,
          method: quickWholesaleMethod,
          notes: 'Full payment received',
          performedBy: currentUser?.name || 'Staff'
        });
      } else if (quickWholesaleStatus === 'Partially Paid' && quickWholesaleAmount > 0) {
        await api.payInvoice(targetWholesaleForPay.id, {
          amount: quickWholesaleAmount,
          method: quickWholesaleMethod,
          notes: 'Partial due payment received',
          performedBy: currentUser?.name || 'Staff'
        });
      } else if (quickWholesaleStatus === 'Unpaid') {
        // Reset to unpaid
        await api.updateInvoice(targetWholesaleForPay.id, {
          paidAmount: 0,
          dueAmount: targetWholesaleForPay.totalAmount,
          paymentStatus: 'Unpaid'
        });
      }

      showToast(`Wholesale payment status updated to ${quickWholesaleStatus}!`, 'success');
      setShowWholesalePayModal(false);
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update payment status', 'error');
    }
  };

  // 5. Returns Create / Edit / Delete
  const handleOpenAddReturn = () => {
    setEditingReturn(null);
    setReturnFormData({
      supplierId: activeSupplier?.id || suppliers[0]?.id || '',
      productId: '',
      quantity: 1,
      purchasePrice: 0,
      reason: 'Touch flex defective during testing',
      notes: ''
    });
    setShowReturnModal(true);
  };

  const handleOpenEditReturn = (ret: SupplierReturn) => {
    setEditingReturn(ret);
    setReturnFormData({
      supplierId: ret.supplierId,
      productId: ret.productId,
      quantity: ret.quantity,
      purchasePrice: ret.purchasePrice,
      reason: ret.reason,
      notes: ret.notes || ''
    });
    setShowReturnModal(true);
  };

  const handleSaveReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnFormData.supplierId || !returnFormData.productId) {
      showToast('Supplier and product are required for return', 'error');
      return;
    }

    const sup = suppliers.find((s) => s.id === returnFormData.supplierId);
    const prod = products.find((p) => p.id === returnFormData.productId);

    try {
      if (editingReturn) {
        await api.updateSupplierReturn(editingReturn.id, {
          ...returnFormData,
          supplierName: sup?.companyName || sup?.name || 'Supplier',
          productName: prod?.name || editingReturn.productName,
          totalAmount: returnFormData.quantity * returnFormData.purchasePrice
        });
        showToast('Return record updated!', 'success');
      } else {
        await api.createSupplierReturn({
          ...returnFormData,
          supplierName: sup?.companyName || sup?.name || 'Supplier',
          productName: prod?.name || 'Product',
          performedBy: currentUser?.name || 'Admin'
        });
        showToast('Defective product returned to supplier! Stock updated.', 'success');
      }
      setShowReturnModal(false);
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to process return', 'error');
    }
  };

  const handleDeleteReturn = async (ret: SupplierReturn) => {
    if (!confirm(`Are you sure you want to remove this return record?`)) return;
    try {
      await api.deleteSupplierReturn(ret.id);
      showToast('Return record removed', 'success');
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete return', 'error');
    }
  };

  // 6. Payments Create / Edit / Delete
  const handleOpenAddPayment = () => {
    setEditingPayment(null);
    setPaymentFormData({
      supplierId: activeSupplier?.id || suppliers[0]?.id || '',
      amount: '',
      paymentMethod: 'Bank Transfer',
      referenceNumber: '',
      notes: ''
    });
    setShowPaymentModal(true);
  };

  const handleOpenEditPayment = (sp: SupplierPayment) => {
    setEditingPayment(sp);
    setPaymentFormData({
      supplierId: sp.supplierId,
      amount: String(sp.amount),
      paymentMethod: sp.paymentMethod,
      referenceNumber: sp.referenceNumber || '',
      notes: sp.notes || ''
    });
    setShowPaymentModal(true);
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentFormData.supplierId || !paymentFormData.amount) {
      showToast('Supplier and payment amount are required', 'error');
      return;
    }

    const sup = suppliers.find((s) => s.id === paymentFormData.supplierId);

    try {
      if (editingPayment) {
        await api.updateSupplierPayment(editingPayment.id, {
          ...paymentFormData,
          amount: Number(paymentFormData.amount),
          supplierName: sup?.companyName || sup?.name || 'Supplier'
        });
        showToast('Supplier payment updated!', 'success');
      } else {
        await api.createSupplierPayment({
          ...paymentFormData,
          amount: Number(paymentFormData.amount),
          supplierName: sup?.companyName || sup?.name || 'Supplier',
          performedBy: currentUser?.name || 'Admin'
        });
        showToast('Supplier payment recorded successfully!', 'success');
      }
      setShowPaymentModal(false);
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to record supplier payment', 'error');
    }
  };

  const handleDeletePayment = async (sp: SupplierPayment) => {
    if (!confirm('Are you sure you want to delete this payment record?')) return;
    try {
      await api.deleteSupplierPayment(sp.id);
      showToast('Payment record removed', 'success');
      await refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete payment', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center space-x-2.5">
              <Truck className="w-6 h-6 text-amber-400 shrink-0 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]" />
              <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 bg-clip-text text-transparent font-black tracking-tight drop-shadow-[0_2px_14px_rgba(245,158,11,0.45)] select-none">
                Simple Trade & Suppliers Hub
              </span>
            </h1>
            <span className="hidden sm:inline-flex text-[10px] px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider font-extrabold shadow-xs">
              B2B • Buy & Sell • Returns
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Buy wholesale stock, sell to dealers/techs, return defective LCDs & parts, manage paid/unpaid balances & full editing
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Action: Simple Register */}
          <button
            onClick={() => setActiveMainTab('simple_register')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-md ${
              activeMainTab === 'simple_register'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black shadow-amber-500/30'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40'
            }`}
          >
            <span>⚡ Simple Register</span>
          </button>

          {/* Action: Wholesale Buy */}
          <button
            onClick={handleOpenAddPurchase}
            className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-blue-600/30 transition cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>+ Buy (Purchase Stock)</span>
          </button>

          {/* Action: Wholesale Sell */}
          <button
            onClick={() => {
              setWholesaleFormData({
                customerName: '',
                customerPhone: '',
                productId: products[0]?.id || '',
                customProductName: '',
                isManualProduct: false,
                quantity: 5,
                unitPrice: products[0]?.wholesalePrice || products[0]?.sellingPrice || 0,
                paidAmount: '',
                paymentMethod: 'Cash',
                notes: ''
              });
              setShowWholesaleSaleModal(true);
            }}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-emerald-600/30 transition cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>+ Sell (Wholesale)</span>
          </button>

          {/* Action: Return */}
          <button
            onClick={handleOpenAddReturn}
            className="px-3.5 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Return Part</span>
          </button>

          {/* Action: Add Supplier */}
          <button
            onClick={handleOpenAddSupplier}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-amber-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Supplier</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Supplier Payables (Unpaid to Suppliers) */}
        <div
          onClick={() => {
            setActiveMainTab('purchases');
            setPaymentStatusFilter('Unpaid');
          }}
          className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 hover:border-amber-500/50 transition cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-amber-300">Supplier Payables</span>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          </div>
          <p className="text-lg sm:text-xl font-black text-amber-400 mt-1">
            {formatCurrency(totalShopSupplierDues)}
          </p>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
            <span>{unpaidPurchasesCount} Unpaid Buy Orders</span>
            <span className="text-amber-400 font-bold group-hover:underline">View Unpaid →</span>
          </div>
        </div>

        {/* Wholesale Receivables (Unpaid Dealer Dues) */}
        <div
          onClick={() => setActiveMainTab('wholesale_sales')}
          className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 hover:border-emerald-500/50 transition cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-emerald-300">Wholesale Receivables</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-lg sm:text-xl font-black text-emerald-400 mt-1">
            {formatCurrency(totalWholesaleDues)}
          </p>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
            <span>{unpaidWholesaleCount} Dealer Dues Pending</span>
            <span className="text-emerald-400 font-bold group-hover:underline">View Sales →</span>
          </div>
        </div>

        {/* Total Purchases Volume */}
        <div
          onClick={() => {
            setActiveMainTab('purchases');
            setPaymentStatusFilter('All');
          }}
          className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 hover:border-blue-500/50 transition cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-blue-300">Total Buy Volume</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <p className="text-lg sm:text-xl font-black text-blue-400 mt-1">
            {formatCurrency(totalPurchaseVolume)}
          </p>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
            <span>{purchases.length} Buy Orders recorded</span>
            <span className="text-blue-400 font-bold group-hover:underline">All Orders →</span>
          </div>
        </div>

        {/* Defective Returns / Credits */}
        <div
          onClick={() => setActiveMainTab('returns')}
          className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 hover:border-rose-500/50 transition cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-rose-300">Defect Returns Credited</span>
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <p className="text-lg sm:text-xl font-black text-rose-400 mt-1">
            {formatCurrency(totalReturnsValue)}
          </p>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
            <span>{supplierReturns.length} Returned Spares</span>
            <span className="text-rose-400 font-bold group-hover:underline">Returns Log →</span>
          </div>
        </div>
      </div>

      {/* Main Feature Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'simple_register', label: `⚡ Simple Trade Register (${unifiedTrades.length})` },
          { id: 'suppliers', label: 'Suppliers & Ledgers' },
          { id: 'purchases', label: `Buy Orders (${purchases.length})` },
          { id: 'wholesale_sales', label: `Wholesale Sales (${wholesaleInvoices.length})` },
          { id: 'returns', label: `Supplier Returns (${supplierReturns.length})` },
          { id: 'payments', label: `Payment Records (${supplierPayments.length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveMainTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeMainTab === tab.id
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* TAB 0: SIMPLE TRADE REGISTER (BUY • SELL • RETURN)                        */}
      {/* ========================================================================= */}
      {activeMainTab === 'simple_register' && (
        <div className="space-y-4">
          {/* Fast Entry Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <span className="p-1 rounded-lg bg-amber-500/20 text-amber-400">⚡</span>
                  <span>Fast Simple Transaction (Buy • Sell • Return)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Single-screen quick entry for Seller & Buyer with product price, quantity, and payment clear / due pending status.
                </p>
              </div>

              {/* Transaction Type Toggle: Buy / Sell / Return */}
              <div className="flex items-center space-x-1 p-1 bg-slate-950 rounded-xl border border-slate-800 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setSimpleEntryType('buy');
                    setSimpleFormData((prev) => ({ ...prev, partyRole: 'seller' }));
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                    simpleEntryType === 'buy'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>🛒 Buy (Seller)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSimpleEntryType('sell');
                    setSimpleFormData((prev) => ({ ...prev, partyRole: 'buyer' }));
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                    simpleEntryType === 'sell'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>🏷️ Sell (Buyer)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSimpleEntryType('return');
                    setSimpleFormData((prev) => ({ ...prev, partyRole: 'seller' }));
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                    simpleEntryType === 'return'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>🔄 Return</span>
                </button>
              </div>
            </div>

            {/* Fast Entry Form */}
            <form onSubmit={handleSaveSimpleTrade} className="space-y-3.5 text-xs">
              <datalist id="simple-party-suggestions">
                {suppliers.map((s) => (
                  <option key={s.id} value={s.companyName || s.name}>
                    Seller / Supplier (Phone: {s.phone})
                  </option>
                ))}
                {customers.map((c) => (
                  <option key={c.id} value={c.name}>
                    Buyer / Shopper (Phone: {c.phone})
                  </option>
                ))}
              </datalist>

              <datalist id="simple-product-suggestions">
                {products.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name} (Stock: {p.quantity} {p.unit}, Buy: ₹{p.purchasePrice}, Sell: ₹{p.sellingPrice})
                  </option>
                ))}
              </datalist>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Seller & Buyer Shopper Name Option */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-semibold text-xs">
                      {simpleFormData.partyRole === 'seller'
                        ? 'Seller (Supplier Name) *'
                        : simpleFormData.partyRole === 'shopper'
                        ? 'Shopper (Retail Customer) *'
                        : 'Buyer / Dealer Name *'}
                    </label>
                  </div>
                  {/* Seler & Buyer Shopper option pills */}
                  <div className="grid grid-cols-3 gap-1 mb-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSimpleFormData((prev) => ({ ...prev, partyRole: 'seller' }));
                        setSimpleEntryType('buy');
                      }}
                      className={`px-1 py-1 rounded-md text-[10px] font-bold text-center border transition cursor-pointer ${
                        simpleFormData.partyRole === 'seller'
                          ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                          : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      🏢 Seller
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSimpleFormData((prev) => ({ ...prev, partyRole: 'buyer' }));
                        setSimpleEntryType('sell');
                      }}
                      className={`px-1 py-1 rounded-md text-[10px] font-bold text-center border transition cursor-pointer ${
                        simpleFormData.partyRole === 'buyer'
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                          : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      🛒 Buyer
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSimpleFormData((prev) => ({ ...prev, partyRole: 'shopper' }));
                        setSimpleEntryType('sell');
                      }}
                      className={`px-1 py-1 rounded-md text-[10px] font-bold text-center border transition cursor-pointer ${
                        simpleFormData.partyRole === 'shopper'
                          ? 'bg-purple-600 text-white border-purple-500 shadow-xs'
                          : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      🛍️ Shopper
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    list="simple-party-suggestions"
                    value={simpleFormData.partyName}
                    onChange={(e) => setSimpleFormData({ ...simpleFormData, partyName: e.target.value })}
                    placeholder={
                      simpleFormData.partyRole === 'seller'
                        ? 'e.g. National Telecom / Margram Parts (Seller)'
                        : simpleFormData.partyRole === 'shopper'
                        ? 'e.g. Walk-in Customer / Anisur (Shopper)'
                        : 'e.g. City Mobile Store / Ratan Tech (Buyer)'
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* 2. Phone / WhatsApp Number */}
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Mobile / WhatsApp Number</label>
                  <input
                    type="tel"
                    value={simpleFormData.partyPhone}
                    onChange={(e) => setSimpleFormData({ ...simpleFormData, partyPhone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 font-mono mt-7 sm:mt-0"
                  />
                </div>

                {/* 3. Product Name (Manual Product Name Add) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-semibold text-xs">Product Name *</label>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                      ✏️ Manual Name Add
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    list="simple-product-suggestions"
                    value={simpleFormData.productName}
                    onChange={(e) => {
                      const val = e.target.value;
                      const matched = products.find((p) => p.name.toLowerCase() === val.toLowerCase());
                      setSimpleFormData((prev) => ({
                        ...prev,
                        productName: val,
                        productPrice: matched
                          ? String(simpleEntryType === 'buy' ? matched.purchasePrice : matched.wholesalePrice || matched.sellingPrice)
                          : prev.productPrice
                      }));
                    }}
                    placeholder="Type manual product name (e.g. Vivo Y20 LCD / OG Folder)..."
                    className="w-full px-3 py-2 bg-slate-800 border-2 border-amber-500/50 rounded-xl text-white font-medium placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Type any new product or select from stock suggestions
                  </span>
                </div>

                {/* 4. Product Date */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-semibold text-xs">Product Date *</label>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => setSimpleFormData((p) => ({ ...p, productDate: new Date().toISOString().split('T')[0] }))}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 hover:text-white border border-slate-700 font-semibold cursor-pointer"
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const yest = new Date();
                          yest.setDate(yest.getDate() - 1);
                          setSimpleFormData((p) => ({ ...p, productDate: yest.toISOString().split('T')[0] }));
                        }}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-white border border-slate-700 font-semibold cursor-pointer"
                      >
                        Yesterday
                      </button>
                    </div>
                  </div>
                  <input
                    type="date"
                    required
                    value={simpleFormData.productDate}
                    onChange={(e) => setSimpleFormData({ ...simpleFormData, productDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              {/* Row 2: Price, Qty, Total & Payment Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                {/* 5. Product Price */}
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">
                    Product Price / Rate (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={simpleFormData.productPrice}
                    onChange={(e) => setSimpleFormData({ ...simpleFormData, productPrice: e.target.value })}
                    placeholder="e.g. 1450"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* 6. Product items quantity */}
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Items Quantity (pcs) *</label>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => setSimpleFormData((prev) => ({ ...prev, quantity: Math.max(1, (Number(prev.quantity) || 1) - 1) }))}
                      className="w-8 h-9 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 font-black text-sm flex items-center justify-center cursor-pointer select-none"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      required
                      min="1"
                      value={simpleFormData.quantity}
                      onChange={(e) => setSimpleFormData({ ...simpleFormData, quantity: Math.max(1, Number(e.target.value) || 1) })}
                      placeholder="1"
                      className="flex-1 px-2 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold text-sm text-center focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onClick={() => setSimpleFormData((prev) => ({ ...prev, quantity: (Number(prev.quantity) || 0) + 1 }))}
                      className="w-8 h-9 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 font-black text-sm flex items-center justify-center cursor-pointer select-none"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* 7. Total Amount */}
                <div className="flex flex-col justify-center px-3 py-2 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Bill Amount</span>
                  <span className="text-lg font-black text-amber-400">
                    {formatCurrency((Number(simpleFormData.quantity) || 1) * (Number(simpleFormData.productPrice) || 0))}
                  </span>
                </div>

                {/* 8. Notes / Remarks */}
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Notes / Return Reason / Terms</label>
                  <input
                    type="text"
                    value={simpleFormData.notes}
                    onChange={(e) => setSimpleFormData({ ...simpleFormData, notes: e.target.value })}
                    placeholder="e.g. 7 days test warranty / touch checked"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 3: Product Due Pending & Payment Clear Option */}
              <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <span className="text-slate-300 font-bold whitespace-nowrap">
                    Payment Status Option:
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const tot = (Number(simpleFormData.quantity) || 1) * (Number(simpleFormData.productPrice) || 0);
                        setSimpleFormData((prev) => ({
                          ...prev,
                          paymentStatus: 'Paid',
                          paidAmount: String(tot)
                        }));
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border cursor-pointer ${
                        simpleFormData.paymentStatus === 'Paid'
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      ✓ Payment Clear
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSimpleFormData((prev) => ({
                          ...prev,
                          paymentStatus: 'Unpaid',
                          paidAmount: '0'
                        }));
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border cursor-pointer ${
                        simpleFormData.paymentStatus === 'Unpaid'
                          ? 'bg-red-600 text-white border-red-500 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      ⚠️ Due Pending
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const tot = (Number(simpleFormData.quantity) || 1) * (Number(simpleFormData.productPrice) || 0);
                        setSimpleFormData((prev) => ({
                          ...prev,
                          paymentStatus: 'Partially Paid',
                          paidAmount: String(Math.round(tot / 2))
                        }));
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border cursor-pointer ${
                        simpleFormData.paymentStatus === 'Partially Paid'
                          ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      Partial Paid
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400 text-xs">Amount Paid:</span>
                    <input
                      type="number"
                      value={simpleFormData.paidAmount}
                      onChange={(e) => setSimpleFormData({ ...simpleFormData, paidAmount: e.target.value })}
                      placeholder="Paid (₹)"
                      className="w-24 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold text-xs"
                    />
                  </div>

                  <div className="text-xs font-bold">
                    <span className="text-slate-400">Due Pending: </span>
                    <span className="text-red-400 font-black">
                      {formatCurrency(
                        Math.max(
                          0,
                          (Number(simpleFormData.quantity) || 1) * (Number(simpleFormData.productPrice) || 0) -
                            (simpleFormData.paidAmount === ''
                              ? simpleFormData.paymentStatus === 'Paid'
                                ? (Number(simpleFormData.quantity) || 1) * (Number(simpleFormData.productPrice) || 0)
                                : 0
                              : Number(simpleFormData.paidAmount))
                        )
                      )}
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-amber-500/20 cursor-pointer transition flex items-center space-x-1.5"
                  >
                    <span>+ Save {simpleEntryType === 'buy' ? 'Buy Order' : simpleEntryType === 'sell' ? 'Sell Bill' : 'Return'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Unified Trade Register Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm space-y-3 p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              {/* Filter Pills */}
              <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
                {[
                  { id: 'All', label: `All Records (${unifiedTrades.length})` },
                  { id: 'buy', label: `🛒 Buy / Seller (${unifiedTrades.filter((t) => t.type === 'buy').length})` },
                  { id: 'sell', label: `🏷️ Sell / Buyer (${unifiedTrades.filter((t) => t.type === 'sell').length})` },
                  { id: 'return', label: `🔄 Return (${unifiedTrades.filter((t) => t.type === 'return').length})` },
                  { id: 'due', label: `🔴 Due Pending (${simpleStats.dueCount})` },
                  { id: 'clear', label: `🟢 Payment Clear (${simpleStats.clearCount})` }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSimpleFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                      simpleFilter === f.id
                        ? 'bg-amber-600 text-white border-amber-500 shadow-xs'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search party, product, phone, date..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-850 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3">Date & Ref ID</th>
                    <th className="py-3 px-2 text-center">Type</th>
                    <th className="py-3 px-3">Seller / Buyer / Shopper</th>
                    <th className="py-3 px-3">Product Name & Qty</th>
                    <th className="py-3 px-3 text-right">Total Bill</th>
                    <th className="py-3 px-3 text-right">Paid Amount</th>
                    <th className="py-3 px-3 text-right">Due Pending</th>
                    <th className="py-3 px-3 text-center">Payment Status Option</th>
                    <th className="py-3 px-3 text-right">Manual Edit & Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {filteredSimpleTrades.map((t) => (
                    <tr key={`${t.type}-${t.id}`} className="hover:bg-slate-800/40 transition">
                      {/* Date & Ref */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-cyan-300 block">{t.id}</span>
                        <span className="text-[10px] text-slate-500">{formatDate(t.date)}</span>
                      </td>

                      {/* Type */}
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            t.type === 'buy'
                              ? 'bg-blue-950 text-blue-300 border border-blue-800/50'
                              : t.type === 'sell'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                              : 'bg-rose-950 text-rose-300 border border-rose-800/50'
                          }`}
                        >
                          {t.type === 'buy' ? '🛒 Buy' : t.type === 'sell' ? '🏷️ Sell' : '🔄 Return'}
                        </span>
                      </td>

                      {/* Seller / Buyer / Shopper */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-white flex items-center space-x-1.5">
                          <span>{t.partyName}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-normal">
                            {t.partyRole}
                          </span>
                        </div>
                        {t.partyPhone && (
                          <div className="text-[10px] text-slate-400 flex items-center space-x-1 mt-0.5 font-mono">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>{t.partyPhone}</span>
                          </div>
                        )}
                      </td>

                      {/* Product Name & Qty */}
                      <td className="py-3 px-3 max-w-xs">
                        <div className="font-semibold text-slate-100 truncate" title={t.productName}>
                          {t.productName}
                        </div>
                        <div className="text-[10px] text-amber-300 font-medium">
                          Qty: <span className="font-bold">{t.quantity} pcs</span> @ {formatCurrency(t.productPrice)}
                        </div>
                      </td>

                      {/* Total Bill */}
                      <td className="py-3 px-3 text-right font-black text-white whitespace-nowrap">
                        {formatCurrency(t.totalAmount)}
                      </td>

                      {/* Paid Amount */}
                      <td className="py-3 px-3 text-right text-emerald-400 font-bold whitespace-nowrap">
                        {formatCurrency(t.paidAmount)}
                      </td>

                      {/* Due Pending */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {t.dueAmount > 0 ? (
                          <span className="text-red-400 font-black">{formatCurrency(t.dueAmount)}</span>
                        ) : (
                          <span className="text-slate-500 font-mono">₹0</span>
                        )}
                      </td>

                      {/* Due Pending & Payment Clear Option */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {t.dueAmount > 0 ? (
                          <button
                            type="button"
                            onClick={() => handleClearTradePayment(t)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold inline-flex items-center space-x-1 shadow-sm cursor-pointer transition animate-pulse hover:animate-none"
                            title="Click to clear payment in full"
                          >
                            <Check className="w-3 h-3" />
                            <span>⚡ Clear Payment</span>
                          </button>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/60 inline-flex items-center space-x-1">
                            <Check className="w-3 h-3" />
                            <span>✓ Payment Clear</span>
                          </span>
                        )}
                      </td>

                      {/* Actions & Manual Edit Option */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Manual Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenSimpleEdit(t)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white rounded-lg text-xs font-semibold border border-slate-700 inline-flex items-center space-x-1 cursor-pointer transition"
                            title="Manual Edit Option"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Manual Edit</span>
                          </button>

                          {/* WhatsApp Reminder if due */}
                          {t.dueAmount > 0 && t.partyPhone && (
                            <a
                              href={`https://wa.me/91${t.partyPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                `Hello ${t.partyName}, friendly reminder from Sumaiya Telecom regarding ${t.type.toUpperCase()} ref ${t.id} (${t.productName}). Outstanding due pending is ₹${t.dueAmount}. Please settle when convenient.`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 rounded-lg border border-emerald-500/30"
                              title="Send WhatsApp Reminder"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {/* Delete Record */}
                          {canDeleteRecords && (
                            <button
                              type="button"
                              onClick={() => handleDeleteSimpleTrade(t)}
                              className="p-1 bg-slate-800 hover:bg-red-950 text-slate-500 hover:text-red-400 rounded-lg border border-slate-700 cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredSimpleTrades.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500">
                        No transactions found. Use the Fast Simple Transaction form above to record a Buy, Sell, or Return!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: SUPPLIERS & LEDGERS                                                */}
      {/* ========================================================================= */}
      {activeMainTab === 'suppliers' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Suppliers List (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vendor name, GST, phone..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-2 max-h-[calc(100vh-17rem)] overflow-y-auto pr-1">
              {filteredSuppliers.map((s) => {
                const isSelected = activeSupplier?.id === s.id;
                const sPurchases = purchases.filter((p) => p.supplierId === s.id).reduce((sum, p) => sum + p.totalAmount, 0);
                const sReturns = supplierReturns.filter((r) => r.supplierId === s.id).reduce((sum, r) => sum + r.totalAmount, 0);
                const sPayments = supplierPayments.filter((p) => p.supplierId === s.id).reduce((sum, p) => sum + p.amount, 0);
                const sDue = sPurchases - sReturns - sPayments;

                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSupplierId(s.id)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-slate-850 border-amber-500 shadow-md ring-1 ring-amber-500/30'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-sm text-white">{s.companyName || s.name}</h4>
                        {s.gstNumber && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            GST
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Contact: <strong className="text-slate-200">{s.name}</strong> • {s.phone}
                      </p>
                      {s.address && (
                        <p className="text-[11px] text-slate-500 truncate max-w-[200px]">{s.address}</p>
                      )}
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                          sDue > 0
                            ? 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                            : 'bg-emerald-950/40 text-emerald-400'
                        }`}
                      >
                        {sDue > 0 ? `Due: ${formatCurrency(sDue)}` : 'Nil Due'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Active Supplier Profile & Full Ledger (7 cols) */}
          <div className="lg:col-span-7">
            {activeSupplier ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-6 shadow-sm">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs text-amber-400 font-bold">{activeSupplier.id}</span>
                      {activeSupplier.gstNumber && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          GST: {activeSupplier.gstNumber}
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-black text-white mt-1">
                      {activeSupplier.companyName || activeSupplier.name}
                    </h2>
                    <p className="text-xs text-slate-400">
                      Proprietor: {activeSupplier.name} • Ph: {activeSupplier.phone} • {activeSupplier.address}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleOpenEditSupplier(activeSupplier)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={handleOpenAddPayment}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-sm"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Pay Supplier</span>
                    </button>

                    <a
                      href={`https://wa.me/91${activeSupplier.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg border border-emerald-500/30"
                      title="WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>

                    <a
                      href={`tel:${activeSupplier.phone}`}
                      className="p-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg border border-blue-500/30"
                      title="Call"
                    >
                      <Phone className="w-4 h-4" />
                    </a>

                    {canDeleteRecords && (
                      <button
                        onClick={() => handleDeleteSupplier(activeSupplier)}
                        className="p-2 bg-slate-800 hover:bg-red-950 text-slate-500 hover:text-red-400 rounded-lg border border-slate-700"
                        title="Archive Supplier"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Ledger Financial Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
                  <div className="p-3 bg-slate-850 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Total Purchases</span>
                    <p className="text-base font-black text-white mt-0.5">{formatCurrency(totalPurchased)}</p>
                  </div>

                  <div className="p-3 bg-slate-850 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-rose-400 uppercase font-bold">Defect Returns</span>
                    <p className="text-base font-black text-rose-400 mt-0.5">- {formatCurrency(totalReturned)}</p>
                  </div>

                  <div className="p-3 bg-slate-850 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-emerald-400 uppercase font-bold">Paid to Date</span>
                    <p className="text-base font-black text-emerald-400 mt-0.5">- {formatCurrency(totalPaid)}</p>
                  </div>

                  <div className="p-3 bg-amber-950/40 rounded-xl border border-amber-800/40">
                    <span className="text-[10px] text-amber-300 uppercase font-bold">Net Balance Due</span>
                    <p className="text-base font-black text-amber-300 mt-0.5">{formatCurrency(netOutstanding)}</p>
                  </div>
                </div>

                {/* Recent Purchases by this supplier */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                      <Receipt className="w-3.5 h-3.5 text-blue-400" />
                      <span>Purchases from this Vendor ({activeSupplierPurchases.length})</span>
                    </h3>
                    <button
                      onClick={handleOpenAddPurchase}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ New Buy Order</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto text-xs">
                    {activeSupplierPurchases.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 bg-slate-850 rounded-xl border border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-blue-400 font-bold">{p.id}</span>
                            <span className="text-slate-400 font-medium">Inv #{p.invoiceNumber || 'N/A'}</span>
                            <span className="text-[10px] text-slate-500">{formatDate(p.date)}</span>
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                p.paymentStatus === 'Paid'
                                  ? 'bg-emerald-950 text-emerald-400'
                                  : p.paymentStatus === 'Partially Paid'
                                  ? 'bg-amber-950 text-amber-300'
                                  : 'bg-red-950 text-red-400'
                              }`}
                            >
                              {p.paymentStatus}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-1">
                            {p.items?.map((i) => `${i.productName} (${i.quantity} pcs)`).join(', ')}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <div className="text-right">
                            <span className="font-bold text-white block">{formatCurrency(p.totalAmount)}</span>
                            <span className="text-[10px] text-amber-400">Due: {formatCurrency(p.dueAmount)}</span>
                          </div>

                          <button
                            onClick={() => openQuickPayModal(p)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] border border-slate-700"
                            title="Edit Paid / Unpaid Status"
                          >
                            Pay Option
                          </button>

                          <button
                            onClick={() => handleOpenEditPurchase(p)}
                            className="p-1 text-slate-400 hover:text-white"
                            title="Full Edit Purchase"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {activeSupplierPurchases.length === 0 && (
                      <div className="p-4 bg-slate-850 rounded-xl text-center text-slate-500">
                        No purchase invoices recorded from this vendor yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BUY ORDERS (ALL SUPPLIER PURCHASES)                                */}
      {/* ========================================================================= */}
      {activeMainTab === 'purchases' && (
        <div className="space-y-3">
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto pb-1">
              {(['All', 'Unpaid', 'Partially Paid', 'Paid'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setPaymentStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    paymentStatusFilter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {status === 'Unpaid' ? '⚠️ Unpaid Only' : status}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search purchase ref, supplier, item..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <button
                onClick={handleOpenAddPurchase}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Buy Stock</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-850 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Purchase Ref & Date</th>
                    <th className="py-3 px-3">Supplier Name</th>
                    <th className="py-3 px-3">Items Inward</th>
                    <th className="py-3 px-3 text-right">Total Bill</th>
                    <th className="py-3 px-3 text-right">Amount Paid</th>
                    <th className="py-3 px-3 text-right">Amount Unpaid (Due)</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions / Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-200">
                  {filteredPurchases.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <span className="font-mono text-cyan-400 font-bold">{p.id}</span>
                        <div className="text-[10px] text-slate-500">
                          {formatDate(p.date)} {p.invoiceNumber && `• Inv: ${p.invoiceNumber}`}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-bold text-white">
                        {p.supplierName}
                      </td>

                      <td className="py-3 px-3 max-w-xs truncate text-slate-300">
                        {p.items?.map((i) => `${i.productName} (${i.quantity})`).join(', ')}
                      </td>

                      <td className="py-3 px-3 text-right font-black text-white">
                        {formatCurrency(p.totalAmount)}
                      </td>

                      <td className="py-3 px-3 text-right text-emerald-400 font-bold">
                        {formatCurrency(p.paidAmount)}
                      </td>

                      <td className="py-3 px-3 text-right text-red-400 font-black">
                        {formatCurrency(p.dueAmount)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => openQuickPayModal(p)}
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase transition hover:brightness-125 cursor-pointer ${
                            p.paymentStatus === 'Paid'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                              : p.paymentStatus === 'Partially Paid'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800/50'
                              : 'bg-red-950 text-red-400 border border-red-800/50'
                          }`}
                          title="Click to toggle Paid / Unpaid"
                        >
                          {p.paymentStatus} ▾
                        </button>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Quick Pay Option */}
                          <button
                            onClick={() => openQuickPayModal(p)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-blue-300 rounded text-[11px] border border-slate-700"
                            title="Update Paid Amount"
                          >
                            Paid/Unpaid
                          </button>

                          {/* Full Edit */}
                          <button
                            onClick={() => handleOpenEditPurchase(p)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
                            title="Full Edit Order"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          {canDeleteRecords && (
                            <button
                              onClick={() => handleDeletePurchase(p)}
                              className="p-1.5 bg-slate-800 hover:bg-red-950 text-slate-500 hover:text-red-400 rounded border border-slate-700"
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
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        No purchase orders matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: WHOLESALE SALES (SELL TO DEALERS / TECHS)                          */}
      {/* ========================================================================= */}
      {activeMainTab === 'wholesale_sales' && (
        <div className="space-y-3">
          {/* Header & Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <ShoppingCart className="w-4 h-4 text-emerald-400" />
                <span>Wholesale Items Sales Register ({wholesaleInvoices.length})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Bulk sales of folders, batteries, LCDs & accessories to fellow technicians & retailer shops
              </p>
            </div>
            <button
              onClick={handleOpenAddWholesale}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-emerald-600/30 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Wholesale Sale</span>
            </button>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto pb-1">
              {(['All', 'Unpaid', 'Paid'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setWholesaleStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    wholesaleStatusFilter === status
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {status === 'Unpaid' ? `⚠️ Unpaid Dues (${wholesaleInvoices.filter((i) => i.dueAmount > 0).length})` : status}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dealer, phone, bill #..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-850 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Invoice # & Date</th>
                    <th className="py-3 px-3">Dealer / Technician Name</th>
                    <th className="py-3 px-3">Items Sold</th>
                    <th className="py-3 px-3 text-right">Total Bill</th>
                    <th className="py-3 px-3 text-right">Paid Amount</th>
                    <th className="py-3 px-3 text-right">Unpaid Due</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions / Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {filteredWholesaleInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                        {inv.id}
                        <span className="block text-[10px] text-slate-500">{formatDate(inv.createdAt)}</span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-white">{inv.customerName}</div>
                        <div className="text-[10px] text-slate-400">{inv.customerPhone}</div>
                      </td>

                      <td className="py-3 px-3 max-w-xs truncate text-slate-300">
                        {inv.items?.map((i) => `${i.description} (${i.quantity})`).join(', ')}
                      </td>

                      <td className="py-3 px-3 text-right font-black text-white">
                        {formatCurrency(inv.totalAmount)}
                      </td>

                      <td className="py-3 px-3 text-right text-emerald-400 font-bold">
                        {formatCurrency(inv.paidAmount)}
                      </td>

                      <td className="py-3 px-3 text-right text-red-400 font-black">
                        {formatCurrency(inv.dueAmount)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => openQuickWholesalePayModal(inv)}
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase transition hover:brightness-125 cursor-pointer border ${
                            inv.dueAmount === 0
                              ? 'bg-emerald-950 text-emerald-400 border-emerald-800/50'
                              : inv.paidAmount > 0
                              ? 'bg-amber-950 text-amber-300 border-amber-800/50'
                              : 'bg-red-950 text-red-400 border-red-800/50'
                          }`}
                          title="Click to toggle Paid / Unpaid"
                        >
                          {inv.dueAmount === 0 ? 'Paid' : (inv.paidAmount > 0 ? 'Partial' : 'Unpaid')} ▾
                        </button>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Quick Pay Option */}
                          <button
                            onClick={() => openQuickWholesalePayModal(inv)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded text-[11px] border border-slate-700 cursor-pointer"
                            title="Update Paid Amount"
                          >
                            Paid/Unpaid
                          </button>

                          {/* Full Edit */}
                          <button
                            onClick={() => handleOpenEditWholesale(inv)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 cursor-pointer"
                            title="Full Edit Wholesale Bill"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* WhatsApp Reminder */}
                          {inv.dueAmount > 0 && inv.customerPhone && (
                            <a
                              href={`https://wa.me/91${inv.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                `Hello ${inv.customerName}, gentle reminder from Sumaiya Telecom for your wholesale bill ${inv.id}. Outstanding due is ₹${inv.dueAmount}. Please settle at your earliest convenience.`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded border border-emerald-500/30"
                              title="Send WhatsApp Due Reminder"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {/* Delete */}
                          {canDeleteRecords && (
                            <button
                              onClick={() => handleDeleteWholesaleSale(inv)}
                              className="p-1.5 bg-slate-800 hover:bg-red-950 text-slate-500 hover:text-red-400 rounded border border-slate-700 cursor-pointer"
                              title="Delete Bill"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredWholesaleInvoices.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        No wholesale sales matching criteria. Click "+ New Wholesale Sale" to sell items at wholesale rates.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SUPPLIER RETURNS                                                   */}
      {/* ========================================================================= */}
      {activeMainTab === 'returns' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-white">Supplier Returns & Defect Spares</h3>
              <p className="text-xs text-slate-400">
                Returned LCDs and spare parts to suppliers (automatically reduces stock and credits vendor balance)
              </p>
            </div>
            <button
              onClick={handleOpenAddReturn}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-rose-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>+ Record Return</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-850 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Return ID & Date</th>
                    <th className="py-3 px-3">Supplier Name</th>
                    <th className="py-3 px-3">Product Name</th>
                    <th className="py-3 px-3 text-center">Qty Returned</th>
                    <th className="py-3 px-3 text-right">Cost Rate</th>
                    <th className="py-3 px-3 text-right">Total Credit</th>
                    <th className="py-3 px-3">Reason</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions / Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {supplierReturns.map((ret) => (
                    <tr key={ret.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-rose-300">
                        {ret.id}
                        <span className="block text-[10px] text-slate-500">{formatDate(ret.date)}</span>
                      </td>

                      <td className="py-3 px-3 font-semibold text-white">
                        {ret.supplierName}
                      </td>

                      <td className="py-3 px-3 font-medium text-slate-200">
                        {ret.productName}
                      </td>

                      <td className="py-3 px-3 text-center font-bold text-rose-400">
                        {ret.quantity}
                      </td>

                      <td className="py-3 px-3 text-right text-slate-400">
                        {formatCurrency(ret.purchasePrice)}
                      </td>

                      <td className="py-3 px-3 text-right font-black text-rose-400">
                        {formatCurrency(ret.totalAmount)}
                      </td>

                      <td className="py-3 px-3 text-slate-300">
                        {ret.reason}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                            ret.status === 'Refund Received'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                              : ret.status === 'Replacement Awaited'
                              ? 'bg-blue-950 text-blue-400 border border-blue-800/40'
                              : ret.status === 'Pending Supplier'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800/40'
                              : 'bg-purple-950 text-purple-300 border border-purple-800/40'
                          }`}
                        >
                          {ret.status || 'Credited to Ledger'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleOpenEditReturn(ret)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
                            title="Edit Return"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {canDeleteRecords && (
                            <button
                              onClick={() => handleDeleteReturn(ret)}
                              className="p-1.5 bg-slate-800 hover:bg-red-950 text-slate-500 hover:text-red-400 rounded border border-slate-700"
                              title="Delete Return"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {supplierReturns.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        No returns on record.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: SUPPLIER PAYMENTS HISTORY                                          */}
      {/* ========================================================================= */}
      {activeMainTab === 'payments' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-white">Supplier Payments Log</h3>
              <p className="text-xs text-slate-400">Payments made via Bank Transfer, Cash, or UPI to suppliers</p>
            </div>
            <button
              onClick={handleOpenAddPayment}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-emerald-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>+ Record Payment</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-850 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Payment Ref & Date</th>
                    <th className="py-3 px-3">Supplier Name</th>
                    <th className="py-3 px-3 text-right">Amount Paid</th>
                    <th className="py-3 px-3">Method</th>
                    <th className="py-3 px-3">Transaction UTR / Ref</th>
                    <th className="py-3 px-3">Notes</th>
                    <th className="py-3 px-4 text-right">Actions / Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {supplierPayments.map((sp) => (
                    <tr key={sp.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                        {sp.id}
                        <span className="block text-[10px] text-slate-500">{formatDate(sp.date)}</span>
                      </td>

                      <td className="py-3 px-3 font-semibold text-white">
                        {sp.supplierName}
                      </td>

                      <td className="py-3 px-3 text-right font-black text-emerald-400 text-sm">
                        {formatCurrency(sp.amount)}
                      </td>

                      <td className="py-3 px-3 text-slate-300">
                        {sp.paymentMethod}
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-400">
                        {sp.referenceNumber || '-'}
                      </td>

                      <td className="py-3 px-3 text-slate-400 max-w-xs truncate">
                        {sp.notes || '-'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleOpenEditPayment(sp)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
                            title="Edit Payment"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {canDeleteRecords && (
                            <button
                              onClick={() => handleDeletePayment(sp)}
                              className="p-1.5 bg-slate-800 hover:bg-red-950 text-slate-500 hover:text-red-400 rounded border border-slate-700"
                              title="Delete Payment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {supplierPayments.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        No payments recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / FULL EDIT SUPPLIER                                         */}
      {/* ========================================================================= */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
              <h3 className="font-bold text-base text-white">
                {editingSupplier ? 'Full Edit Supplier' : 'Add New Wholesale Supplier'}
              </h3>
              <button onClick={() => setShowSupplierModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="p-4 space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Company / Shop Name *</label>
                <input
                  type="text"
                  required
                  value={supplierFormData.companyName}
                  onChange={(e) => setSupplierFormData({ ...supplierFormData, companyName: e.target.value })}
                  placeholder="e.g. National Mobile Spares Kolkata"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Contact Person Name</label>
                <input
                  type="text"
                  value={supplierFormData.name}
                  onChange={(e) => setSupplierFormData({ ...supplierFormData, name: e.target.value })}
                  placeholder="e.g. Ganesh Das"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={supplierFormData.phone}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, phone: e.target.value })}
                    placeholder="10-digit mobile"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">WhatsApp Number</label>
                  <input
                    type="tel"
                    value={supplierFormData.whatsapp}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, whatsapp: e.target.value })}
                    placeholder="WhatsApp number"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    value={supplierFormData.gstNumber}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, gstNumber: e.target.value })}
                    placeholder="GSTIN (Optional)"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Email</label>
                  <input
                    type="email"
                    value={supplierFormData.email}
                    onChange={(e) => setSupplierFormData({ ...supplierFormData, email: e.target.value })}
                    placeholder="sales@supplier.com"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Market City / Address</label>
                <input
                  type="text"
                  value={supplierFormData.address}
                  onChange={(e) => setSupplierFormData({ ...supplierFormData, address: e.target.value })}
                  placeholder="e.g. Chandni Chowk, Kolkata"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Notes / Terms</label>
                <textarea
                  rows={2}
                  value={supplierFormData.notes}
                  onChange={(e) => setSupplierFormData({ ...supplierFormData, notes: e.target.value })}
                  placeholder="Special pricing, return policy notes..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg shadow-md"
                >
                  {editingSupplier ? 'Update Supplier' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: BUY STOCK (PURCHASE INWARD) & FULL EDIT PURCHASE                 */}
      {/* ========================================================================= */}
      {showPurchaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[92vh]">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
              <h3 className="font-bold text-base text-white">
                {editingPurchase ? `Full Edit Purchase #${editingPurchase.id}` : 'Record Buy Stock / Supplier Purchase'}
              </h3>
              <button onClick={() => setShowPurchaseModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="p-4 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-slate-300 block mb-1">Select Supplier *</label>
                  <select
                    required
                    value={purchaseFormData.supplierId}
                    onChange={(e) => setPurchaseFormData({ ...purchaseFormData, supplierId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.companyName || s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Supplier Invoice Number</label>
                  <input
                    type="text"
                    value={purchaseFormData.invoiceNumber}
                    onChange={(e) => setPurchaseFormData({ ...purchaseFormData, invoiceNumber: e.target.value })}
                    placeholder="e.g. NAT-INV-4402"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Purchase Date</label>
                  <input
                    type="date"
                    value={purchaseFormData.date}
                    onChange={(e) => setPurchaseFormData({ ...purchaseFormData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              {/* Add item row */}
              <div className="bg-slate-850 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300 uppercase tracking-wider block">
                    Add Item to Inward Order:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsManualPurchaseRow(!isManualPurchaseRow);
                      setPRowProductId('');
                      setManualPurchaseName('');
                    }}
                    className={`text-[11px] font-bold px-2 py-0.5 rounded transition border cursor-pointer ${
                      isManualPurchaseRow
                        ? 'bg-blue-600/30 text-blue-300 border-blue-500/40 hover:bg-blue-600 hover:text-white'
                        : 'bg-amber-600/30 text-amber-300 border-amber-500/40 hover:bg-amber-600 hover:text-white'
                    }`}
                  >
                    {isManualPurchaseRow ? '← Choose from Catalog' : '✏️ + Manual Product Name'}
                  </button>
                </div>

                {isManualPurchaseRow ? (
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        value={manualPurchaseName}
                        onChange={(e) => setManualPurchaseName(e.target.value)}
                        placeholder="Manual Product Name (e.g. iPhone 14 OLED / 67W Charger)"
                        className="w-full px-2.5 py-1.5 bg-slate-800 border-2 border-amber-500/60 rounded-lg text-white font-medium text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                        autoFocus
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <select
                        value={manualPurchaseCategory}
                        onChange={(e) => setManualPurchaseCategory(e.target.value as ProductCategory)}
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                      >
                        <option value="Spare Parts">Spare Parts</option>
                        <option value="LCD / Display">LCD / Display</option>
                        <option value="Accessories">Accessories</option>
                        <option value="Tools & Consumables">Tools & Consumables</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        min="1"
                        value={pRowQty}
                        onChange={(e) => setPRowQty(Number(e.target.value))}
                        placeholder="Qty"
                        className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-center font-bold"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        value={pRowCost}
                        onChange={(e) => setPRowCost(Number(e.target.value))}
                        placeholder="Cost (₹)"
                        className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-right font-bold"
                      />
                    </div>
                    <div className="sm:col-span-12 flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddPurchaseItem}
                        disabled={!manualPurchaseName.trim()}
                        className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs"
                      >
                        + Add Manual Item to Order
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-6">
                      <select
                        value={pRowProductId}
                        onChange={(e) => {
                          const pid = e.target.value;
                          setPRowProductId(pid);
                          const prod = products.find((p) => p.id === pid);
                          if (prod) {
                            setPRowCost(prod.purchasePrice);
                            setPRowSell(prod.sellingPrice);
                          }
                        }}
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                      >
                        <option value="">-- Choose Product / LCD / Spare --</option>
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
                        value={pRowQty}
                        onChange={(e) => setPRowQty(Number(e.target.value))}
                        placeholder="Qty"
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-center font-bold"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        value={pRowCost}
                        onChange={(e) => setPRowCost(Number(e.target.value))}
                        placeholder="Cost (₹)"
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-right font-bold"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <button
                        type="button"
                        onClick={handleAddPurchaseItem}
                        disabled={!pRowProductId}
                        className="w-full py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs"
                      >
                        + Add Item
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Items List Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-800 text-slate-400">
                    <tr>
                      <th className="p-2">Item Name</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Cost Price</th>
                      <th className="p-2 text-right">Subtotal</th>
                      <th className="p-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {purchaseFormData.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-medium text-white">{item.productName}</td>
                        <td className="p-2 text-center font-bold">{item.quantity}</td>
                        <td className="p-2 text-right">{formatCurrency(item.purchasePrice)}</td>
                        <td className="p-2 text-right font-bold text-emerald-400">{formatCurrency(item.total)}</td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemovePurchaseItem(idx)}
                            className="text-slate-500 hover:text-red-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {purchaseFormData.items.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-500">
                          No items added yet. Choose a product above and click "+ Add Item".
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Payment Status & Amount Paid / Unpaid Options */}
              <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="font-bold text-white text-sm">
                    Order Total: <span className="text-emerald-400">{formatCurrency(totalCalculatedPurchase)}</span>
                  </span>

                  {/* Payment Status Pills */}
                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-400 text-[11px] mr-1">Payment Status:</span>
                    {(['Paid', 'Partially Paid', 'Unpaid'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          setPurchaseFormData((prev) => ({
                            ...prev,
                            paymentStatus: st,
                            paidAmount: st === 'Paid' ? String(totalCalculatedPurchase) : (st === 'Unpaid' ? '0' : prev.paidAmount)
                          }));
                        }}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                          purchaseFormData.paymentStatus === st
                            ? (st === 'Paid' ? 'bg-emerald-600 text-white' : (st === 'Unpaid' ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'))
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-300 block mb-1">Amount Paid Now (₹)</label>
                    <input
                      type="number"
                      value={purchaseFormData.paidAmount}
                      onChange={(e) => setPurchaseFormData({ ...purchaseFormData, paidAmount: e.target.value })}
                      placeholder="e.g. 5000"
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1">Payment Method</label>
                    <select
                      value={purchaseFormData.paymentMethod}
                      onChange={(e) => setPurchaseFormData({ ...purchaseFormData, paymentMethod: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    >
                      <option value="Bank Transfer">Bank Transfer / NEFT</option>
                      <option value="UPI">UPI / GPay / PhonePe</option>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1">Notes / Shipping Details</label>
                    <input
                      type="text"
                      value={purchaseFormData.notes}
                      onChange={(e) => setPurchaseFormData({ ...purchaseFormData, notes: e.target.value })}
                      placeholder="e.g. Parcel shipment received"
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={purchaseFormData.items.length === 0}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-md"
                >
                  {editingPurchase ? 'Update Purchase Order' : 'Save Buy Order & Inward Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: QUICK PAID / UNPAID OPTION MODAL                                 */}
      {/* ========================================================================= */}
      {showQuickPayModal && targetPurchaseForPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-4 space-y-4 text-slate-100">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">Update Payment: Paid vs Unpaid</h3>
              <button onClick={() => setShowQuickPayModal(false)} className="p-1 text-slate-400 hover:text-white">
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
                    className={`py-2 px-1 rounded-xl text-center font-bold transition border ${
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
                    className={`py-2 px-1 rounded-xl text-center font-bold transition border ${
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
                    className={`py-2 px-1 rounded-xl text-center font-bold transition border ${
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
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md"
                >
                  Update Payment Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: WHOLESALE SELL (SELL BULK TO DEALER / SHOP)                       */}
      {/* ========================================================================= */}
      {showWholesaleSaleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-4 space-y-4 text-slate-100 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">
                {editingWholesaleInvoice ? `Full Edit Wholesale Bill #${editingWholesaleInvoice.id}` : 'Record Wholesale Sale (Sell to Dealer / Shop)'}
              </h3>
              <button
                onClick={() => {
                  setShowWholesaleSaleModal(false);
                  setEditingWholesaleInvoice(null);
                }}
                className="p-1 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveWholesaleSale} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Dealer / Shop Customer Name *</label>
                <input
                  type="text"
                  required
                  value={wholesaleFormData.customerName}
                  onChange={(e) => setWholesaleFormData({ ...wholesaleFormData, customerName: e.target.value })}
                  placeholder="e.g. Anisur Rahman (Margram Bazar)"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Mobile Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={wholesaleFormData.customerPhone}
                  onChange={(e) => setWholesaleFormData({ ...wholesaleFormData, customerPhone: e.target.value })}
                  placeholder="e.g. 9732987654"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-slate-200 block mb-1.5 font-bold text-xs flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <span className="text-white">Select / Enter Product Name *</span>
                    {wholesaleFormData.isManualProduct ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase tracking-wider">
                        Manual Product Mode
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold uppercase tracking-wider">
                        Inventory Catalog
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setWholesaleFormData((prev) => ({
                        ...prev,
                        isManualProduct: !prev.isManualProduct,
                        customProductName: !prev.isManualProduct ? (prev.customProductName || '') : ''
                      }));
                    }}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition border cursor-pointer shadow-xs ${
                      wholesaleFormData.isManualProduct
                        ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400'
                        : 'bg-amber-600 hover:bg-amber-500 text-white border-amber-400'
                    }`}
                  >
                    {wholesaleFormData.isManualProduct ? '← Choose from Catalog' : '✏️ + Manual Product Name'}
                  </button>
                </label>

                {wholesaleFormData.isManualProduct ? (
                  <div className="space-y-1.5">
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={wholesaleFormData.customProductName}
                        onChange={(e) => setWholesaleFormData({ ...wholesaleFormData, customProductName: e.target.value })}
                        placeholder="Type manual product name (e.g. Vivo Y20 LCD Combo OG / Realme 9 Pro Display Folder / iPhone 13 Back Glass)"
                        className="w-full px-3 py-2.5 bg-slate-800 border-2 border-amber-500/80 focus:border-amber-400 rounded-xl text-white font-medium text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 shadow-inner"
                        autoFocus
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 px-0.5">
                      <span className="text-amber-300 font-medium">✓ Sells custom spare part, accessory, LCD combo or service without catalog entry</span>
                      <button
                        type="button"
                        onClick={() => setWholesaleFormData((prev) => ({ ...prev, isManualProduct: false }))}
                        className="text-cyan-400 hover:underline cursor-pointer"
                      >
                        Pick from inventory
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <select
                      required
                      value={wholesaleFormData.productId}
                      onChange={(e) => {
                        const pid = e.target.value;
                        if (pid === '__MANUAL__') {
                          setWholesaleFormData({
                            ...wholesaleFormData,
                            isManualProduct: true,
                            productId: '',
                            customProductName: ''
                          });
                          return;
                        }
                        const prod = products.find((p) => p.id === pid);
                        setWholesaleFormData({
                          ...wholesaleFormData,
                          productId: pid,
                          unitPrice: prod?.wholesalePrice || prod?.sellingPrice || 0
                        });
                      }}
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 focus:border-cyan-500 rounded-xl text-white text-xs focus:outline-none"
                    >
                      <option value="">-- Choose product from inventory --</option>
                      <option value="__MANUAL__" className="text-amber-400 font-bold bg-slate-900">
                        ✏️ + Type Manual / Custom Product Name
                      </option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Stock: {p.quantity} {p.unit}) - Wholesale: ₹{p.wholesalePrice}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 px-0.5">
                      <span>Item not in catalog?</span>
                      <button
                        type="button"
                        onClick={() => setWholesaleFormData((prev) => ({ ...prev, isManualProduct: true }))}
                        className="text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                      >
                        + Type Manual Product Name
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Wholesale Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={wholesaleFormData.quantity}
                    onChange={(e) => setWholesaleFormData({ ...wholesaleFormData, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Wholesale Rate (₹)</label>
                  <input
                    type="number"
                    required
                    value={wholesaleFormData.unitPrice}
                    onChange={(e) => setWholesaleFormData({ ...wholesaleFormData, unitPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold text-emerald-400"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-slate-850 rounded-xl flex justify-between items-center font-bold">
                <span>Total Wholesale Amount:</span>
                <span className="text-sm text-emerald-400 font-black">
                  {formatCurrency(wholesaleFormData.quantity * wholesaleFormData.unitPrice)}
                </span>
              </div>

              {/* Amount Paid / Unpaid Quick Selector */}
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Payment Status:</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setWholesaleFormData((prev) => ({ ...prev, paidAmount: String(prev.quantity * prev.unitPrice) }))}
                    className="py-1 px-1 rounded-lg text-center font-bold text-[11px] bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600 hover:text-white transition"
                  >
                    ✓ Full Paid
                  </button>
                  <button
                    type="button"
                    onClick={() => setWholesaleFormData((prev) => ({ ...prev, paidAmount: String(Math.round((prev.quantity * prev.unitPrice) / 2)) }))}
                    className="py-1 px-1 rounded-lg text-center font-bold text-[11px] bg-amber-600/30 text-amber-300 border border-amber-500/40 hover:bg-amber-600 hover:text-white transition"
                  >
                    Partial Paid
                  </button>
                  <button
                    type="button"
                    onClick={() => setWholesaleFormData((prev) => ({ ...prev, paidAmount: '0' }))}
                    className="py-1 px-1 rounded-lg text-center font-bold text-[11px] bg-red-600/30 text-red-300 border border-red-500/40 hover:bg-red-600 hover:text-white transition"
                  >
                    ✗ Unpaid (Due)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Paid Amount (₹)</label>
                  <input
                    type="number"
                    value={wholesaleFormData.paidAmount}
                    onChange={(e) => setWholesaleFormData({ ...wholesaleFormData, paidAmount: e.target.value })}
                    placeholder="Paid now"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Payment Method</label>
                  <select
                    value={wholesaleFormData.paymentMethod}
                    onChange={(e) => setWholesaleFormData({ ...wholesaleFormData, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI / GPay</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Notes / Terms</label>
                <input
                  type="text"
                  value={wholesaleFormData.notes}
                  onChange={(e) => setWholesaleFormData({ ...wholesaleFormData, notes: e.target.value })}
                  placeholder="e.g. 7 days replacement testing warranty"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowWholesaleSaleModal(false);
                    setEditingWholesaleInvoice(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer"
                >
                  {editingWholesaleInvoice ? 'Update Wholesale Bill' : 'Complete Wholesale Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK PAID / UNPAID MODAL FOR WHOLESALE SALES */}
      {showWholesalePayModal && targetWholesaleForPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-4 space-y-4 text-slate-100">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">Wholesale Payment: Paid vs Unpaid</h3>
              <button onClick={() => setShowWholesalePayModal(false)} className="p-1 text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyQuickWholesalePay} className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-850 rounded-xl space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Invoice #:</span>
                  <span className="font-mono text-emerald-400 font-bold">{targetWholesaleForPay.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Dealer:</span>
                  <span className="font-bold text-white">{targetWholesaleForPay.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Bill:</span>
                  <span className="font-bold text-white">{formatCurrency(targetWholesaleForPay.totalAmount)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-800">
                  <span className="text-amber-400 font-semibold">Current Unpaid Due:</span>
                  <span className="font-black text-red-400 text-sm">{formatCurrency(targetWholesaleForPay.dueAmount)}</span>
                </div>
              </div>

              {/* Paid / Unpaid Quick Selector */}
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Select Payment Option:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setQuickWholesaleStatus('Paid');
                      setQuickWholesaleAmount(targetWholesaleForPay.dueAmount);
                    }}
                    className={`py-2 px-1 rounded-xl text-center font-bold transition border ${
                      quickWholesaleStatus === 'Paid'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    ✓ Mark Fully Paid
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setQuickWholesaleStatus('Partially Paid');
                      setQuickWholesaleAmount(Math.round(targetWholesaleForPay.dueAmount / 2));
                    }}
                    className={`py-2 px-1 rounded-xl text-center font-bold transition border ${
                      quickWholesaleStatus === 'Partially Paid'
                        ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    Partially Paid
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setQuickWholesaleStatus('Unpaid');
                      setQuickWholesaleAmount(0);
                    }}
                    className={`py-2 px-1 rounded-xl text-center font-bold transition border ${
                      quickWholesaleStatus === 'Unpaid'
                        ? 'bg-red-600 text-white border-red-500 shadow-md'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    ✗ Mark Unpaid
                  </button>
                </div>
              </div>

              {quickWholesaleStatus !== 'Unpaid' && (
                <>
                  <div>
                    <label className="text-slate-300 block mb-1">
                      {quickWholesaleStatus === 'Paid' ? 'Full Settlement Amount (₹)' : 'Partial Payment Amount (₹)'}
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={quickWholesaleAmount}
                      onChange={(e) => setQuickWholesaleAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm font-bold text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1">Payment Method</label>
                    <select
                      value={quickWholesaleMethod}
                      onChange={(e) => setQuickWholesaleMethod(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI / GPay / PhonePe</option>
                      <option value="Bank Transfer">Bank Transfer / NEFT</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                </>
              )}

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowWholesalePayModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md cursor-pointer"
                >
                  Update Payment Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: RECORD / EDIT RETURN                                             */}
      {/* ========================================================================= */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-4 space-y-4 text-slate-100">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">
                {editingReturn ? `Edit Return #${editingReturn.id}` : 'Return Defective Part to Supplier'}
              </h3>
              <button onClick={() => setShowReturnModal(false)} className="p-1 text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveReturn} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Supplier *</label>
                <select
                  required
                  value={returnFormData.supplierId}
                  onChange={(e) => setReturnFormData({ ...returnFormData, supplierId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.companyName || s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Select Defective Product *</label>
                <select
                  required
                  value={returnFormData.productId}
                  onChange={(e) => {
                    const pid = e.target.value;
                    const prod = products.find((p) => p.id === pid);
                    setReturnFormData({
                      ...returnFormData,
                      productId: pid,
                      purchasePrice: prod?.purchasePrice || 0
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  <option value="">-- Choose item from stock --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stock: {p.quantity} {p.unit}) - Cost: ₹{p.purchasePrice}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={returnFormData.quantity}
                    onChange={(e) => setReturnFormData({ ...returnFormData, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Cost Rate (₹)</label>
                  <input
                    type="number"
                    value={returnFormData.purchasePrice}
                    onChange={(e) => setReturnFormData({ ...returnFormData, purchasePrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold text-rose-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Reason for Return</label>
                  <input
                    type="text"
                    required
                    value={returnFormData.reason}
                    onChange={(e) => setReturnFormData({ ...returnFormData, reason: e.target.value })}
                    placeholder="e.g. Lines on display / touch ghosting"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Return Settlement Status</label>
                  <select
                    value={(returnFormData as any).status || 'Credited to Ledger'}
                    onChange={(e) => setReturnFormData({ ...returnFormData, status: e.target.value } as any)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="Credited to Ledger">Credited to Vendor Ledger</option>
                    <option value="Refund Received">Refund Received (Cash/Bank)</option>
                    <option value="Replacement Awaited">Replacement Piece Awaited</option>
                    <option value="Pending Supplier">Pending Supplier Acceptance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Additional Notes (Optional)</label>
                <input
                  type="text"
                  value={returnFormData.notes}
                  onChange={(e) => setReturnFormData({ ...returnFormData, notes: e.target.value })}
                  placeholder="e.g. Sent via courier or returned by hand"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow-md"
                >
                  {editingReturn ? 'Update Return' : 'Process Return & Reduce Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: RECORD / EDIT PAYMENT                                            */}
      {/* ========================================================================= */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-4 space-y-4 text-slate-100">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">
                {editingPayment ? `Edit Payment #${editingPayment.id}` : 'Record Payment to Supplier'}
              </h3>
              <button onClick={() => setShowPaymentModal(false)} className="p-1 text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Supplier *</label>
                <select
                  required
                  value={paymentFormData.supplierId}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, supplierId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.companyName || s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Amount Paid (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={paymentFormData.amount}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
                  placeholder="e.g. 10000"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Payment Method</label>
                <select
                  value={paymentFormData.paymentMethod}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  <option value="Bank Transfer">Bank Transfer / NEFT / IMPS</option>
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Transaction Ref / UTR</label>
                <input
                  type="text"
                  value={paymentFormData.referenceNumber}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, referenceNumber: e.target.value })}
                  placeholder="e.g. UTR / NEFT Number"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Notes</label>
                <input
                  type="text"
                  value={paymentFormData.notes}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                  placeholder="e.g. Part payment against display consignment"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-md"
                >
                  {editingPayment ? 'Update Payment' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: SIMPLE MANUAL EDIT TRANSACTION MODAL                             */}
      {/* ========================================================================= */}
      {showSimpleEditModal && editingSimpleTrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl p-4 sm:p-5 space-y-4 text-slate-100 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-base text-white flex items-center space-x-2">
                  <span>✏️ Manual Edit Transaction</span>
                  <span className="text-cyan-400 font-mono text-sm">#{editingSimpleTrade.id}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Edit seller/buyer name, product name, quantity, price, date, and payment status.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowSimpleEditModal(false);
                  setEditingSimpleTrade(null);
                }}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSimpleEdit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                {/* 1. Transaction Type */}
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Transaction Type</label>
                  <select
                    value={simpleEditFormData.type}
                    onChange={(e) => setSimpleEditFormData({ ...simpleEditFormData, type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold"
                  >
                    <option value="buy">🛒 Buy (from Seller / Supplier)</option>
                    <option value="sell">🏷️ Sell (to Buyer / Shopper)</option>
                    <option value="return">🔄 Return to Supplier</option>
                  </select>
                </div>

                {/* 2. Date */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-semibold text-xs">Product Date *</label>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => setSimpleEditFormData((p) => ({ ...p, productDate: new Date().toISOString().split('T')[0] }))}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 hover:text-white border border-slate-700 font-semibold cursor-pointer"
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const yest = new Date();
                          yest.setDate(yest.getDate() - 1);
                          setSimpleEditFormData((p) => ({ ...p, productDate: yest.toISOString().split('T')[0] }));
                        }}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-white border border-slate-700 font-semibold cursor-pointer"
                      >
                        Yesterday
                      </button>
                    </div>
                  </div>
                  <input
                    type="date"
                    required
                    value={simpleEditFormData.productDate}
                    onChange={(e) => setSimpleEditFormData({ ...simpleEditFormData, productDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              {/* 3. Seller & Buyer Shopper Name Option */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold text-xs">
                    {simpleEditFormData.partyRole === 'seller'
                      ? 'Seller (Supplier Name) *'
                      : simpleEditFormData.partyRole === 'shopper'
                      ? 'Shopper (Retail Customer) *'
                      : 'Buyer / Dealer Name *'}
                  </label>
                </div>
                {/* Seler & Buyer Shopper option pills */}
                <div className="grid grid-cols-3 gap-1 mb-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSimpleEditFormData((prev) => ({ ...prev, partyRole: 'seller', type: 'buy' }));
                    }}
                    className={`px-1 py-1 rounded-md text-[10px] font-bold text-center border transition cursor-pointer ${
                      simpleEditFormData.partyRole === 'seller'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                        : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    🏢 Seller
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSimpleEditFormData((prev) => ({ ...prev, partyRole: 'buyer', type: 'sell' }));
                    }}
                    className={`px-1 py-1 rounded-md text-[10px] font-bold text-center border transition cursor-pointer ${
                      simpleEditFormData.partyRole === 'buyer'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                        : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    🛒 Buyer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSimpleEditFormData((prev) => ({ ...prev, partyRole: 'shopper', type: 'sell' }));
                    }}
                    className={`px-1 py-1 rounded-md text-[10px] font-bold text-center border transition cursor-pointer ${
                      simpleEditFormData.partyRole === 'shopper'
                        ? 'bg-purple-600 text-white border-purple-500 shadow-xs'
                        : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    🛍️ Shopper
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      required
                      value={simpleEditFormData.partyName}
                      onChange={(e) => setSimpleEditFormData({ ...simpleEditFormData, partyName: e.target.value })}
                      placeholder="Name..."
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold"
                    />
                  </div>

                  <div>
                    <input
                      type="tel"
                      value={simpleEditFormData.partyPhone}
                      onChange={(e) => setSimpleEditFormData({ ...simpleEditFormData, partyPhone: e.target.value })}
                      placeholder="Mobile / WhatsApp Number"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Product Name */}
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Product Name *</label>
                <input
                  type="text"
                  required
                  value={simpleEditFormData.productName}
                  onChange={(e) => setSimpleEditFormData({ ...simpleEditFormData, productName: e.target.value })}
                  placeholder="Manual product name..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-medium"
                />
              </div>

              {/* 5. Product Price & Quantity */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Product Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={simpleEditFormData.productPrice}
                    onChange={(e) => setSimpleEditFormData({ ...simpleEditFormData, productPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Items Quantity *</label>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => setSimpleEditFormData((prev) => ({ ...prev, quantity: Math.max(1, (Number(prev.quantity) || 1) - 1) }))}
                      className="w-8 h-9 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 font-black text-sm flex items-center justify-center cursor-pointer select-none"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      required
                      min="1"
                      value={simpleEditFormData.quantity}
                      onChange={(e) => setSimpleEditFormData({ ...simpleEditFormData, quantity: Math.max(1, Number(e.target.value) || 1) })}
                      className="flex-1 px-2 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold text-sm text-center"
                    />
                    <button
                      type="button"
                      onClick={() => setSimpleEditFormData((prev) => ({ ...prev, quantity: (Number(prev.quantity) || 0) + 1 }))}
                      className="w-8 h-9 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 font-black text-sm flex items-center justify-center cursor-pointer select-none"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex flex-col justify-center px-3 py-1.5 bg-slate-850 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Total Bill</span>
                  <span className="text-base font-black text-amber-400">
                    {formatCurrency((Number(simpleEditFormData.quantity) || 1) * (Number(simpleEditFormData.productPrice) || 0))}
                  </span>
                </div>
              </div>

              {/* 6. Product Due Pending & Payment Clear Option */}
              <div className="p-3 bg-slate-850 rounded-xl border border-slate-800 space-y-3">
                <label className="text-slate-300 block font-semibold">Payment Status Option:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const tot = (Number(simpleEditFormData.quantity) || 1) * (Number(simpleEditFormData.productPrice) || 0);
                      setSimpleEditFormData((prev) => ({
                        ...prev,
                        paymentStatus: 'Paid',
                        paidAmount: tot
                      }));
                    }}
                    className={`py-1.5 px-2 rounded-lg text-center font-bold text-xs transition border cursor-pointer ${
                      simpleEditFormData.paymentStatus === 'Paid'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    ✓ Payment Clear
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSimpleEditFormData((prev) => ({
                        ...prev,
                        paymentStatus: 'Unpaid',
                        paidAmount: 0
                      }));
                    }}
                    className={`py-1.5 px-2 rounded-lg text-center font-bold text-xs transition border cursor-pointer ${
                      simpleEditFormData.paymentStatus === 'Unpaid'
                        ? 'bg-red-600 text-white border-red-500 shadow-sm'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    ⚠️ Due Pending
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const tot = (Number(simpleEditFormData.quantity) || 1) * (Number(simpleEditFormData.productPrice) || 0);
                      setSimpleEditFormData((prev) => ({
                        ...prev,
                        paymentStatus: 'Partially Paid',
                        paidAmount: Math.round(tot / 2)
                      }));
                    }}
                    className={`py-1.5 px-2 rounded-lg text-center font-bold text-xs transition border cursor-pointer ${
                      simpleEditFormData.paymentStatus === 'Partially Paid'
                        ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    Partial Paid
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-slate-400 block mb-1">Amount Paid (₹)</label>
                    <input
                      type="number"
                      value={simpleEditFormData.paidAmount}
                      onChange={(e) => setSimpleEditFormData({ ...simpleEditFormData, paidAmount: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Due Pending (₹)</label>
                    <div className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-red-400 font-black text-sm">
                      {formatCurrency(
                        Math.max(
                          0,
                          (Number(simpleEditFormData.quantity) || 1) * (Number(simpleEditFormData.productPrice) || 0) -
                            Number(simpleEditFormData.paidAmount)
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 7. Notes */}
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Notes / Reason</label>
                <input
                  type="text"
                  value={simpleEditFormData.notes}
                  onChange={(e) => setSimpleEditFormData({ ...simpleEditFormData, notes: e.target.value })}
                  placeholder="Notes, terms, return policy..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500"
                />
              </div>

              <div className="pt-2 flex justify-between items-center">
                {canDeleteRecords && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowSimpleEditModal(false);
                      handleDeleteSimpleTrade(editingSimpleTrade);
                    }}
                    className="px-3 py-2 bg-red-950/60 hover:bg-red-900 text-red-300 rounded-lg text-xs font-semibold border border-red-800/60 cursor-pointer"
                  >
                    Delete Record
                  </button>
                )}

                <div className="flex space-x-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSimpleEditModal(false);
                      setEditingSimpleTrade(null);
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
