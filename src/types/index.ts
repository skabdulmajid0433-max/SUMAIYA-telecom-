export type UserRole = 'admin' | 'manager' | 'staff';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  username: string;
  pin: string;
  phone: string;
  active: boolean;
}

export interface ShopSettings {
  shopName: string;
  ownerName: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  gstNumber: string;
  currency: string;
  taxRate: number;
  invoicePrefix: string;
  repairPrefix: string;
  terms: string;
  invoiceFooter: string;
  allowNegativeStock: boolean;
  lowStockThreshold: number;
  allowDeliveryWithDue: boolean;
  dailySalaryPresentPercent: number;
  dailySalaryHalfDayPercent: number;
  dailySalaryAbsentPercent: number;
  dailySalaryLeavePercent: number;
  smsSenderId?: string;
  smsApiKey?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  altPhone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  active: boolean;
}

export type ProductCategory = 'Accessories' | 'Spare Parts' | 'LCD / Display' | 'Tools & Consumables';

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: ProductCategory;
  subcategory: string;
  brand: string;
  compatibleModels: string;
  supplierId?: string;
  supplierName?: string;
  purchasePrice: number;
  sellingPrice: number;
  minSellingPrice: number;
  wholesalePrice: number;
  quantity: number;
  minStockLevel: number;
  unit: string;
  rackLocation: string;
  warranty: string;
  taxPercent: number;
  description: string;
  image?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type RepairStatus =
  | 'Received'
  | 'Checking'
  | 'Estimate Given'
  | 'Customer Approval Pending'
  | 'Repairing'
  | 'Waiting for Spare Part'
  | 'Ready'
  | 'Delivered'
  | 'Cancelled'
  | 'Returned Without Repair';

export interface StatusHistoryEntry {
  status: RepairStatus;
  date: string;
  staffName: string;
  note: string;
}

export interface RepairPartUsed {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  isIncludedInRepairPrice: boolean;
}

export interface RepairJob {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerWhatsapp?: string;
  customerAddress?: string;
  brand: string;
  model: string;
  imei1: string;
  imei2?: string;
  color: string;
  deviceCondition: string[];
  lockCode?: string;
  simReceived: boolean;
  sdCardReceived: boolean;
  chargerReceived: boolean;
  batteryCondition: string;
  otherAccessories: string;
  problemDescription: string;
  technicianNotes?: string;
  estimatedCost: number;
  advancePaid: number;
  remainingAmount: number;
  expectedDeliveryDate: string;
  assignedTechnician: string;
  priority: 'Normal' | 'High' | 'Urgent';
  status: RepairStatus;
  statusHistory: StatusHistoryEntry[];
  partsUsed: RepairPartUsed[];
  photos: string[];
  warrantyDays: number;
  warrantyExpiresAt?: string;
  deliveredAt?: string;
  deliveredBy?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  active: boolean;
}

export interface InvoiceItem {
  id: string;
  type: 'repair' | 'product';
  productId?: string;
  repairId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  method: 'Cash' | 'UPI' | 'Bank Transfer' | 'Card' | 'Other';
  referenceNumber?: string;
  notes?: string;
  recordedBy: string;
}

export interface Invoice {
  id: string;
  invoiceType: 'repair' | 'sales' | 'combined' | 'wholesale';
  repairId?: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  taxAmount: number;
  taxPercent: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: 'Paid' | 'Partially Paid' | 'Unpaid';
  payments: PaymentRecord[];
  dueDate?: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

export type StockMovementType =
  | 'PURCHASE'
  | 'SALE'
  | 'REPAIR'
  | 'RETURN'
  | 'DAMAGE'
  | 'ADJUSTMENT'
  | 'OPENING';

export interface StockMovement {
  id: string;
  date: string;
  productId: string;
  productName: string;
  sku: string;
  type: StockMovementType;
  quantityIn: number;
  quantityOut: number;
  balance: number;
  referenceId: string;
  reason: string;
  user: string;
}

export interface Supplier {
  id: string;
  name: string;
  companyName: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  notes?: string;
  active: boolean;
  createdAt: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  category: ProductCategory;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  total: number;
}

export interface Purchase {
  id: string;
  supplierId: string;
  supplierName: string;
  invoiceNumber: string;
  date: string;
  items: PurchaseItem[];
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: 'Paid' | 'Partially Paid' | 'Unpaid';
  paymentMethod: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
}

export interface SupplierReturn {
  id: string;
  supplierId: string;
  supplierName: string;
  purchaseId?: string;
  productId: string;
  productName: string;
  quantity: number;
  purchasePrice: number;
  totalAmount: number;
  reason: string;
  date: string;
  status?: 'Credited to Ledger' | 'Refund Received' | 'Replacement Awaited' | 'Pending Supplier';
  notes?: string;
  createdBy: string;
}

export interface SupplierPayment {
  id: string;
  supplierId: string;
  supplierName: string;
  purchaseId?: string;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  date: string;
  notes?: string;
  createdBy: string;
}

export interface Staff {
  id: string;
  name: string;
  phone: string;
  address: string;
  joiningDate: string;
  jobRole: string;
  salaryType: 'daily' | 'monthly';
  dailySalary: number;
  monthlySalary: number;
  emergencyContact?: string;
  status: 'active' | 'inactive';
  notes?: string;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Half Day' | 'Paid Leave' | 'Holiday';

export interface AttendanceRecord {
  id: string;
  date: string;
  staffId: string;
  staffName: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  workingHours?: number;
  earnedSalary: number;
  notes?: string;
}

export interface SalaryPayment {
  id: string;
  staffId: string;
  staffName: string;
  period: string;
  totalEarned: number;
  advance: number;
  deduction: number;
  netSalary: number;
  paidAmount: number;
  remainingAmount: number;
  paymentDate: string;
  paymentMethod: string;
  status: 'Paid' | 'Partially Paid' | 'Unpaid';
  notes?: string;
  createdBy: string;
}

export type ExpenseCategory =
  | 'Rent'
  | 'Electricity'
  | 'Internet'
  | 'Staff Salary'
  | 'Transport'
  | 'Tea/Food'
  | 'Tools & Equipment'
  | 'Packaging'
  | 'Other';

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  amount: number;
  paymentMethod: string;
  description: string;
  addedBy: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  performedBy: string;
}

export interface DashboardStats {
  todaySales: number;
  todayRepairIncome: number;
  todayPaymentsReceived: number;
  customerOutstanding: number;
  supplierOutstanding: number;
  totalStockValue: number;
  lowStockCount: number;
  todayExpenses: number;
  todayStaffPresent: number;
  pendingRepairs: number;
  completedRepairs: number;
  deliveredRepairs: number;
}
