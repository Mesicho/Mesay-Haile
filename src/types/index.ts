export type Language = 'am' | 'en';
export type ThemeMode = 'light' | 'dark' | 'system';

export type UserRole = 
  | 'OWNER' 
  | 'MANAGER' 
  | 'CASHIER' 
  | 'INVENTORY_STAFF' 
  | 'ACCOUNTANT' 
  | 'SALESPERSON';

export type BusinessType =
  | 'Shop'
  | 'Café'
  | 'Restaurant'
  | 'Salon'
  | 'Boutique'
  | 'Electronics'
  | 'Phone Shop'
  | 'Wholesale'
  | 'Service Business'
  | 'Freelancer'
  | 'Other';

export interface Business {
  id: string;
  name: string;
  amharicName?: string;
  ownerName: string;
  phone: string;
  email?: string;
  businessType: BusinessType;
  region: string;
  city: string;
  subCity: string;
  woreda?: string;
  address?: string;
  currency: 'ETB' | string;
  language: Language;
  tinNumber?: string;
  taxEnabled: boolean;
  taxRatePercent: number;
  plan: 'FREE' | 'STARTER' | 'BUSINESS' | 'PRO';
  createdAt: string;
}

export interface Branch {
  id: string;
  businessId: string;
  name: string;
  amharicName?: string;
  code: string;
  phone?: string;
  address?: string;
  isMain: boolean;
  active: boolean;
}

export interface User {
  id: string;
  businessId: string;
  branchId: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  pinCode?: string;
  active: boolean;
  hireDate?: string;
  avatarUrl?: string;
  status?: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
  createdAt?: string;
  lastLoginAt?: string;
}

export type AuthStatus = 'LOADING' | 'AUTHENTICATED' | 'UNAUTHENTICATED' | 'SESSION_EXPIRED';

export interface UserBusinessInfo {
  id: string;
  name: string;
  role: UserRole;
  businessType?: string;
}

export interface RegisterPayload {
  fullName: string;
  phone: string;
  email?: string;
  password: string;
  businessName: string;
  businessType: BusinessType | string;
  businessAddress?: string;
}

export interface ProductCategory {
  id: string;
  businessId: string;
  name: string;
  amharicName: string;
  icon?: string;
}

export interface Product {
  id: string;
  businessId: string;
  branchId?: string;
  name: string;
  amharicName?: string;
  sku: string;
  barcode: string;
  categoryId: string;
  brand?: string;
  unit: string; // pcs, kg, litre, pack, box
  purchasePrice: number; // ETB
  sellingPrice: number; // ETB
  wholesalePrice?: number; // ETB
  quantity: number;
  minStock: number;
  maxStock?: number;
  supplierId?: string;
  expiryDate?: string;
  active: boolean;
  updatedAt: string;
}

export type InventoryTxType =
  | 'OPENING'
  | 'PURCHASE'
  | 'SALE'
  | 'ADJUSTMENT'
  | 'DAMAGE'
  | 'EXPIRED'
  | 'RETURN'
  | 'TRANSFER';

export interface InventoryTransaction {
  id: string;
  businessId: string;
  branchId: string;
  productId: string;
  productName: string;
  type: InventoryTxType;
  quantityDelta: number; // positive or negative
  previousQty: number;
  newQty: number;
  unitCost: number;
  reason?: string;
  referenceId?: string; // saleId, purchaseId, adjustmentId
  createdBy: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  customerType: 'RETAIL' | 'WHOLESALE' | 'VIP';
  creditLimit: number; // ETB
  currentDebt: number; // ETB
  totalPurchased: number; // ETB
  totalPaid: number; // ETB
  status: 'ACTIVE' | 'BLOCKED';
  notes?: string;
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  purchasePrice: number; // for COGS calculation
  discount: number;
  subtotal: number;
}

export type PaymentMethod = 'CASH' | 'BANK' | 'MOBILE' | 'CREDIT' | 'SPLIT';

export interface SplitPaymentDetail {
  method: 'CASH' | 'BANK' | 'MOBILE' | 'CREDIT';
  amount: number;
  provider?: string; // Telebirr, CBE Birr, Awash, BoA
  reference?: string;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  businessId: string;
  branchId: string;
  customerId?: string;
  customerName?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  costOfGoodsSold: number;
  grossProfit: number;
  paymentMethod: PaymentMethod;
  splitPayments?: SplitPaymentDetail[];
  amountPaid: number;
  creditAmount: number;
  cashierId: string;
  cashierName: string;
  status: 'COMPLETED' | 'REVERSED' | 'REFUNDED';
  notes?: string;
  createdAt: string;
  syncStatus: 'PENDING' | 'SYNCED' | 'FAILED';
}

export type DebtStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'PAID';

export interface CustomerDebt {
  id: string;
  businessId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  saleId?: string;
  invoiceNumber?: string;
  originalDebt: number; // ETB
  totalPaid: number; // ETB
  remainingDebt: number; // ETB
  dueDate: string;
  status: DebtStatus;
  lastPaymentDate?: string;
  notes?: string;
  createdAt: string;
}

export type DebtTxType = 'CREDIT_SALE' | 'PAYMENT' | 'ADJUSTMENT' | 'REVERSAL';

export interface DebtTransaction {
  id: string;
  businessId: string;
  debtId: string;
  customerId: string;
  customerName: string;
  type: DebtTxType;
  amount: number;
  previousBalance: number;
  newBalance: number;
  paymentMethod?: string; // Cash, Telebirr, CBE Birr, Bank
  referenceNo?: string;
  receivedBy: string;
  notes?: string;
  createdAt: string;
}

export type ExpenseCategory =
  | 'Rent'
  | 'Electricity'
  | 'Water'
  | 'Internet'
  | 'Transport'
  | 'Salary'
  | 'Marketing'
  | 'Maintenance'
  | 'Supplies'
  | 'Tax'
  | 'Other';

export interface Expense {
  id: string;
  businessId: string;
  branchId: string;
  amount: number;
  category: ExpenseCategory;
  paymentMethod: string;
  description: string;
  recordedBy: string;
  receiptNumber?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  address?: string;
  contactPerson?: string;
  openingBalance: number;
  outstandingPayable: number;
  notes?: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  purchasePrice: number;
  subtotal: number;
}

export interface Purchase {
  id: string;
  businessId: string;
  branchId: string;
  supplierId: string;
  supplierName: string;
  invoiceNumber: string;
  items: PurchaseItem[];
  totalAmount: number;
  amountPaid: number;
  debtPayable: number;
  paymentMethod: string;
  dueDate?: string;
  createdBy: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  businessId: string;
  userId: string;
  userName: string;
  action: string;
  actionAm?: string;
  entityType: string;
  entityId: string;
  oldValue?: string;
  newValue?: string;
  deviceInfo: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  businessId: string;
  title: string;
  titleAm: string;
  message: string;
  messageAm: string;
  type: 'LOW_STOCK' | 'DEBT_DUE' | 'DEBT_OVERDUE' | 'PAYMENT_RECEIVED' | 'SECURITY';
  read: boolean;
  createdAt: string;
}

export interface SyncEvent {
  id: string;
  businessId: string;
  action: string;
  entityType: string;
  entityId: string;
  status: 'PENDING' | 'SYNCED' | 'FAILED' | 'CONFLICT';
  timestamp: string;
  retryCount: number;
}

export interface SubscriptionPlan {
  id: 'FREE' | 'STARTER' | 'BUSINESS' | 'PRO';
  name: string;
  nameAm: string;
  pricePerMonthETB: number;
  userLimit: number;
  productLimit: number;
  branchLimit: number;
  features: string[];
}
