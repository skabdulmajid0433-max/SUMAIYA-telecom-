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

export interface BootstrapResponse {
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
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : endpoint;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      let errMsg = `Request failed: ${response.statusText}`;
      try {
        const errJson = await response.json();
        if (errJson && errJson.error) {
          errMsg = errJson.error;
        }
      } catch {
        // use default
      }
      throw new Error(errMsg);
    }

    return response.json() as Promise<T>;
  }

  // Bootstrap
  async getBootstrap(): Promise<BootstrapResponse> {
    return this.request<BootstrapResponse>('/api/bootstrap');
  }

  // Settings
  async updateSettings(settings: Partial<ShopSettings>, performedBy: string) {
    return this.request<{ success: boolean; settings: ShopSettings }>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify({ ...settings, performedBy })
    });
  }

  // Users & Auth
  async login(username: string, pin: string) {
    return this.request<{ success: boolean; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, pin })
    });
  }

  async createUser(user: Partial<User>, performedBy: string) {
    return this.request<{ success: boolean; user: User }>('/api/users', {
      method: 'POST',
      body: JSON.stringify({ ...user, performedBy })
    });
  }

  async updateUser(id: string, user: Partial<User>, performedBy: string) {
    return this.request<{ success: boolean; user: User }>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...user, performedBy })
    });
  }

  // Customers
  async createCustomer(customer: Partial<Customer>, performedBy: string) {
    return this.request<{ success: boolean; customer: Customer }>('/api/customers', {
      method: 'POST',
      body: JSON.stringify({ ...customer, performedBy })
    });
  }

  async updateCustomer(id: string, customer: Partial<Customer>, performedBy: string) {
    return this.request<{ success: boolean; customer: Customer }>(`/api/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...customer, performedBy })
    });
  }

  async getCustomerLedger(customerId: string) {
    return this.request<{
      customer: Customer;
      totalBilled: number;
      totalPaid: number;
      outstandingDue: number;
      invoices: Invoice[];
      repairs: RepairJob[];
      ledger: Array<{
        date: string;
        type: string;
        referenceId: string;
        description: string;
        debit: number;
        credit: number;
        balance: number;
      }>;
    }>(`/api/customers/${customerId}/ledger`);
  }

  // Products & Stock
  async createProduct(product: Partial<Product>, performedBy: string) {
    return this.request<{ success: boolean; product: Product }>('/api/products', {
      method: 'POST',
      body: JSON.stringify({ ...product, performedBy })
    });
  }

  async updateProduct(id: string, product: Partial<Product>, performedBy: string) {
    return this.request<{ success: boolean; product: Product }>(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...product, performedBy })
    });
  }

  async deleteProduct(id: string, performedBy: string) {
    return this.request<{ success: boolean }>(`/api/products/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ performedBy })
    });
  }

  async importProducts(items: any[], performedBy: string) {
    return this.request<{ success: boolean; count: number }>('/api/products/import', {
      method: 'POST',
      body: JSON.stringify({ items, performedBy })
    });
  }

  async adjustStock(data: {
    productId: string;
    type: 'IN' | 'OUT' | 'DAMAGE';
    quantity: number;
    reason: string;
    referenceId?: string;
    performedBy: string;
  }) {
    return this.request<{ success: boolean; product: Product; movement: StockMovement }>('/api/stock/adjust', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Repairs
  async createRepair(data: any) {
    return this.request<{ success: boolean; repair: RepairJob }>('/api/repairs', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateRepair(id: string, data: any) {
    return this.request<{ success: boolean; repair: RepairJob }>(`/api/repairs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async updateRepairStatus(id: string, data: { status: string; note?: string; staffName: string }) {
    return this.request<{ success: boolean; repair: RepairJob }>(`/api/repairs/${id}/status`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async addRepairPart(id: string, data: { productId: string; quantity: number; isIncludedInRepairPrice: boolean; performedBy: string }) {
    return this.request<{ success: boolean; repair: RepairJob; product: Product }>(`/api/repairs/${id}/parts`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async deliverRepair(id: string, data: { paymentAmount: number; paymentMethod: string; referenceNumber?: string; notes?: string; performedBy: string }) {
    return this.request<{ success: boolean; repair: RepairJob; invoice: Invoice }>(`/api/repairs/${id}/deliver`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Invoices & Billing
  async createInvoice(data: any) {
    return this.request<{ success: boolean; invoice: Invoice }>('/api/invoices', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateInvoice(id: string, data: any) {
    return this.request<{ success: boolean; invoice: Invoice }>(`/api/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteInvoice(id: string) {
    return this.request<{ success: boolean; deleted: Invoice }>(`/api/invoices/${id}`, {
      method: 'DELETE'
    });
  }

  async payInvoice(id: string, data: { amount: number; method: string; referenceNumber?: string; notes?: string; performedBy: string }) {
    return this.request<{ success: boolean; invoice: Invoice }>(`/api/invoices/${id}/payment`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Suppliers
  async createSupplier(data: Partial<Supplier>, performedBy: string) {
    return this.request<{ success: boolean; supplier: Supplier }>('/api/suppliers', {
      method: 'POST',
      body: JSON.stringify({ ...data, performedBy })
    });
  }

  async updateSupplier(id: string, data: Partial<Supplier>, performedBy: string) {
    return this.request<{ success: boolean; supplier: Supplier }>(`/api/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...data, performedBy })
    });
  }

  async deleteSupplier(id: string, performedBy: string) {
    return this.request<{ success: boolean }>(`/api/suppliers/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ performedBy })
    });
  }

  async getSupplierLedger(supplierId: string) {
    return this.request<any>(`/api/suppliers/${supplierId}/ledger`);
  }

  async createPurchase(data: any) {
    return this.request<{ success: boolean; purchase: Purchase }>('/api/purchases', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updatePurchase(id: string, data: any) {
    return this.request<{ success: boolean; purchase: Purchase }>(`/api/purchases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async updatePurchasePayment(id: string, data: {
    paidAmount?: number;
    paymentStatus?: 'Paid' | 'Partially Paid' | 'Unpaid';
    amountPaidNow?: number;
    paymentMethod?: string;
    referenceNumber?: string;
    notes?: string;
    performedBy?: string;
  }) {
    return this.request<{ success: boolean; purchase: Purchase }>(`/api/purchases/${id}/payment`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async deletePurchase(id: string) {
    return this.request<{ success: boolean; deleted: Purchase }>(`/api/purchases/${id}`, {
      method: 'DELETE'
    });
  }

  async createSupplierReturn(data: any) {
    return this.request<{ success: boolean; returnRecord: SupplierReturn }>('/api/supplier-returns', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateSupplierReturn(id: string, data: any) {
    return this.request<{ success: boolean; returnRecord: SupplierReturn }>(`/api/supplier-returns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteSupplierReturn(id: string) {
    return this.request<{ success: boolean }>(`/api/supplier-returns/${id}`, {
      method: 'DELETE'
    });
  }

  async createSupplierPayment(data: any) {
    return this.request<{ success: boolean; payment: SupplierPayment }>('/api/supplier-payments', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateSupplierPayment(id: string, data: any) {
    return this.request<{ success: boolean; payment: SupplierPayment }>(`/api/supplier-payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteSupplierPayment(id: string) {
    return this.request<{ success: boolean }>(`/api/supplier-payments/${id}`, {
      method: 'DELETE'
    });
  }

  // Staff & Attendance
  async createStaff(data: Partial<Staff>, performedBy: string) {
    return this.request<{ success: boolean; staff: Staff }>('/api/staff', {
      method: 'POST',
      body: JSON.stringify({ ...data, performedBy })
    });
  }

  async updateStaff(id: string, data: Partial<Staff>, performedBy: string) {
    return this.request<{ success: boolean; staff: Staff }>(`/api/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...data, performedBy })
    });
  }

  async saveBulkAttendance(data: { date: string; records: any[]; performedBy: string }) {
    return this.request<{ success: boolean; attendance: AttendanceRecord[] }>('/api/attendance/bulk', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async createSalaryPayment(data: any) {
    return this.request<{ success: boolean; payment: SalaryPayment }>('/api/salary-payments', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Expenses
  async createExpense(data: any) {
    return this.request<{ success: boolean; expense: Expense }>('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async deleteExpense(id: string) {
    return this.request<{ success: boolean }>(`/api/expenses/${id}`, {
      method: 'DELETE'
    });
  }

  // Backup & Restore
  async getBackupUrl() {
    return '/api/backup';
  }

  async restoreBackup(backupData: any, performedBy: string) {
    return this.request<{ success: boolean; message: string }>('/api/restore', {
      method: 'POST',
      body: JSON.stringify({ ...backupData, performedBy })
    });
  }
}

export const api = new ApiService();
