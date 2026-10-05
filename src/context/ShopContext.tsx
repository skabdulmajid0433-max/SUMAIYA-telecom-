import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  ShopSettings,
  User,
  Customer,
  Product,
  RepairJob,
  Invoice,
  StockMovement,
  Supplier,
  Purchase,
  SupplierReturn,
  SupplierPayment,
  Staff,
  AttendanceRecord,
  SalaryPayment,
  Expense,
  AuditLog,
  DashboardStats
} from '../types';
import { api, BootstrapResponse } from '../services/api';

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ShopContextType {
  settings: ShopSettings;
  users: User[];
  customers: Customer[];
  products: Product[];
  repairs: RepairJob[];
  invoices: Invoice[];
  stockMovements: StockMovement[];
  suppliers: Supplier[];
  purchases: Purchase[];
  supplierReturns: SupplierReturn[];
  supplierPayments: SupplierPayment[];
  staff: Staff[];
  attendance: AttendanceRecord[];
  salaryPayments: SalaryPayment[];
  expenses: Expense[];
  auditLogs: AuditLog[];
  stats: DashboardStats;
  isLoading: boolean;
  error: string | null;
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  refreshData: () => Promise<void>;
  formatCurrency: (amount: number | undefined | null) => string;
  formatDate: (dateString: string | undefined | null) => string;
  formatDateTime: (dateString: string | undefined | null) => string;
  lowStockProducts: Product[];
  pendingRepairsCount: number;
  readyRepairsCount: number;
}

const defaultSettings: ShopSettings = {
  shopName: 'Sumaiya telecom',
  ownerName: 'sk abdulmajid',
  phone: '9679100433',
  whatsapp: '9679100433',
  email: 'skabdulmajid0433@gmail.com',
  address: 'Main Market, Station Road, Rampurhat, Birbhum, West Bengal 731224',
  gstNumber: '19AABCS1234F1Z5',
  currency: '₹',
  taxRate: 0,
  invoicePrefix: 'INV',
  repairPrefix: 'REP',
  terms: '1. Customer is advised to take complete backup of personal data. Shop is not responsible for data loss.\n2. Please inspect the device carefully upon delivery.\n3. Physical, water, or electric surge damage voids any testing warranty.\n4. Parts replacement comes with 30-day testing warranty unless specified otherwise.',
  invoiceFooter: 'Thank you for your business at Sumaiya telecom! For fast WhatsApp support, message 9679100433.',
  allowNegativeStock: false,
  lowStockThreshold: 3,
  allowDeliveryWithDue: true,
  dailySalaryPresentPercent: 100,
  dailySalaryHalfDayPercent: 50,
  dailySalaryAbsentPercent: 0,
  dailySalaryLeavePercent: 100,
  smsSenderId: 'SUMTEL',
  smsApiKey: ''
};

const defaultStats: DashboardStats = {
  todaySales: 0,
  todayRepairIncome: 0,
  todayPaymentsReceived: 0,
  customerOutstanding: 0,
  supplierOutstanding: 0,
  totalStockValue: 0,
  lowStockCount: 0,
  todayExpenses: 0,
  todayStaffPresent: 0,
  pendingRepairs: 0,
  completedRepairs: 0,
  deliveredRepairs: 0
};

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ShopSettings>(defaultSettings);
  const [users, setUsers] = useState<User[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [repairs, setRepairs] = useState<RepairJob[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [supplierReturns, setSupplierReturns] = useState<SupplierReturn[]>([]);
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [salaryPayments, setSalaryPayments] = useState<SalaryPayment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refreshData = useCallback(async () => {
    try {
      setError(null);
      const res: BootstrapResponse = await api.getBootstrap();
      setSettings(res.settings || defaultSettings);
      setUsers(res.users || []);
      setCustomers(res.customers || []);
      setProducts(res.products || []);
      setRepairs(res.repairs || []);
      setInvoices(res.invoices || []);
      setStockMovements(res.stockMovements || []);
      setSuppliers(res.suppliers || []);
      setPurchases(res.purchases || []);
      setSupplierReturns(res.supplierReturns || []);
      setSupplierPayments(res.supplierPayments || []);
      setStaff(res.staff || []);
      setAttendance(res.attendance || []);
      setSalaryPayments(res.salaryPayments || []);
      setExpenses(res.expenses || []);
      setAuditLogs(res.auditLogs || []);
      setStats(res.stats || defaultStats);
    } catch (err: any) {
      console.error('Failed to load shop data:', err);
      setError(err.message || 'Failed to load shop data');
      showToast('Network error loading data. Please check connection.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const formatCurrency = useCallback(
    (amount: number | undefined | null) => {
      const val = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
      const currencySymbol = settings.currency || '₹';
      return `${currencySymbol} ${val.toLocaleString('en-IN')}`;
    },
    [settings.currency]
  );

  const formatDate = useCallback((dateString: string | undefined | null) => {
    if (!dateString) return '-';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  }, []);

  const formatDateTime = useCallback((dateString: string | undefined | null) => {
    if (!dateString) return '-';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateString;
    }
  }, []);

  const lowStockThreshold = settings.lowStockThreshold || 3;
  const lowStockProducts = products.filter(
    (p) => p.active && p.quantity <= (p.minStockLevel || lowStockThreshold)
  );

  const pendingRepairsCount = repairs.filter(
    (r) =>
      r.active &&
      ['Received', 'Checking', 'Estimate Given', 'Customer Approval Pending', 'Repairing', 'Waiting for Spare Part'].includes(
        r.status
      )
  ).length;

  const readyRepairsCount = repairs.filter((r) => r.active && r.status === 'Ready').length;

  return (
    <ShopContext.Provider
      value={{
        settings,
        users,
        customers,
        products,
        repairs,
        invoices,
        stockMovements,
        suppliers,
        purchases,
        supplierReturns,
        supplierPayments,
        staff,
        attendance,
        salaryPayments,
        expenses,
        auditLogs,
        stats,
        isLoading,
        error,
        toasts,
        showToast,
        removeToast,
        refreshData,
        formatCurrency,
        formatDate,
        formatDateTime,
        lowStockProducts,
        pendingRepairsCount,
        readyRepairsCount
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};
