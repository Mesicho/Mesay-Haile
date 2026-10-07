export type SecurityRole =
  | 'OWNER'
  | 'MANAGER'
  | 'CASHIER'
  | 'INVENTORY_STAFF'
  | 'ACCOUNTANT'
  | 'SALESPERSON'
  | 'SUPER_ADMIN';

export type PermissionAction =
  | 'VIEW'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE_SOFT'
  | 'REVERSE'
  | 'APPROVE'
  | 'EXPORT'
  | 'MANAGE'
  | 'ACCESS_SENSITIVE';

export interface ModulePermissionSpec {
  moduleId: string;
  moduleNameEn: string;
  moduleNameAm: string;
  category: 'Core' | 'Financial' | 'Inventory' | 'Governance';
  permissions: {
    [key in SecurityRole]: {
      allowed: boolean;
      scope: 'ALL' | 'BRANCH' | 'OWN' | 'PLATFORM_ONLY' | 'NONE';
      specialRules?: string;
      specialRulesAm?: string;
    };
  };
}

export const COMPLETE_PERMISSION_MATRIX: ModulePermissionSpec[] = [
  {
    moduleId: 'pos_sales',
    moduleNameEn: 'Sales & POS Terminal',
    moduleNameAm: 'ሽያጭና የPOS ማሽን',
    category: 'Core',
    permissions: {
      OWNER: { allowed: true, scope: 'ALL', specialRules: 'Unrestricted POS transactions across all branches' },
      MANAGER: { allowed: true, scope: 'BRANCH', specialRules: 'Full sales within assigned branch' },
      CASHIER: { allowed: true, scope: 'OWN', specialRules: 'Process sales and issue receipts during shift' },
      INVENTORY_STAFF: { allowed: false, scope: 'NONE', specialRules: 'Inventory staff restricted from POS checkout' },
      ACCOUNTANT: { allowed: true, scope: 'BRANCH', specialRules: 'Read-only sales review' },
      SALESPERSON: { allowed: true, scope: 'OWN', specialRules: 'Create customer sales under supervision' },
      SUPER_ADMIN: { allowed: false, scope: 'NONE', specialRules: 'Platform Admin has zero access to tenant POS' },
    },
  },
  {
    moduleId: 'discounts_prices',
    moduleNameEn: 'Discounts & Price Overrides',
    moduleNameAm: 'ቅናሾችና የዋጋ ለውጥ',
    category: 'Financial',
    permissions: {
      OWNER: { allowed: true, scope: 'ALL', specialRules: 'Unlimited custom discount and price override' },
      MANAGER: { allowed: true, scope: 'BRANCH', specialRules: 'Max 10% discount without owner override' },
      CASHIER: { allowed: false, scope: 'NONE', specialRules: 'Requires manager or owner authorization PIN' },
      INVENTORY_STAFF: { allowed: false, scope: 'NONE' },
      ACCOUNTANT: { allowed: false, scope: 'NONE' },
      SALESPERSON: { allowed: false, scope: 'NONE' },
      SUPER_ADMIN: { allowed: false, scope: 'NONE' },
    },
  },
  {
    moduleId: 'credit_debt_management',
    moduleNameEn: 'Credit & Debt Hub',
    moduleNameAm: 'የዕዳና የብድር መቆጣጠሪያ',
    category: 'Financial',
    permissions: {
      OWNER: { allowed: true, scope: 'ALL', specialRules: 'Manage all debts, adjust balances, extend due dates' },
      MANAGER: { allowed: true, scope: 'BRANCH', specialRules: 'Monitor branch debts, send reminders, edit dates' },
      CASHIER: { allowed: true, scope: 'BRANCH', specialRules: 'Receive payments and view debtor balance only' },
      INVENTORY_STAFF: { allowed: false, scope: 'NONE' },
      ACCOUNTANT: { allowed: true, scope: 'ALL', specialRules: 'Full debt ledger audit and reconciliation' },
      SALESPERSON: { allowed: true, scope: 'OWN', specialRules: 'View assigned customer outstanding debt only' },
      SUPER_ADMIN: { allowed: false, scope: 'NONE', specialRules: 'Strict tenant data privacy isolation' },
    },
  },
  {
    moduleId: 'credit_limit_override',
    moduleNameEn: 'Credit Limit Authorization',
    moduleNameAm: 'የብድር ጣሪያ ማለፍ ፍቃድ',
    category: 'Financial',
    permissions: {
      OWNER: { allowed: true, scope: 'ALL', specialRules: 'Unlimited credit override with immutable audit log' },
      MANAGER: { allowed: true, scope: 'BRANCH', specialRules: 'Override up to 25% above customer credit limit' },
      CASHIER: { allowed: false, scope: 'NONE', specialRules: 'Blocked; hard ceiling enforced' },
      INVENTORY_STAFF: { allowed: false, scope: 'NONE' },
      ACCOUNTANT: { allowed: false, scope: 'NONE' },
      SALESPERSON: { allowed: false, scope: 'NONE' },
      SUPER_ADMIN: { allowed: false, scope: 'NONE' },
    },
  },
  {
    moduleId: 'inventory_adjustments',
    moduleNameEn: 'Stock Adjustments & Damages',
    moduleNameAm: 'የክምችት ማስተካከያና ብልሽት',
    category: 'Inventory',
    permissions: {
      OWNER: { allowed: true, scope: 'ALL', specialRules: 'Approve all inventory write-offs and audits' },
      MANAGER: { allowed: true, scope: 'BRANCH', specialRules: 'Record count discrepancy and damaged items' },
      CASHIER: { allowed: false, scope: 'NONE' },
      INVENTORY_STAFF: { allowed: true, scope: 'BRANCH', specialRules: 'Record physical counts with mandatory audit reason' },
      ACCOUNTANT: { allowed: false, scope: 'NONE', specialRules: 'Read-only valuation audit' },
      SALESPERSON: { allowed: false, scope: 'NONE' },
      SUPER_ADMIN: { allowed: false, scope: 'NONE' },
    },
  },
  {
    moduleId: 'purchases_suppliers',
    moduleNameEn: 'Purchases & Supplier Payables',
    moduleNameAm: 'ግዢዎችና አቅራቢዎች',
    category: 'Inventory',
    permissions: {
      OWNER: { allowed: true, scope: 'ALL' },
      MANAGER: { allowed: true, scope: 'BRANCH', specialRules: 'Create purchase orders and receive deliveries' },
      CASHIER: { allowed: false, scope: 'NONE' },
      INVENTORY_STAFF: { allowed: true, scope: 'BRANCH', specialRules: 'Receive purchase shipments into stock' },
      ACCOUNTANT: { allowed: true, scope: 'ALL', specialRules: 'Verify supplier invoices and track payables' },
      SALESPERSON: { allowed: false, scope: 'NONE' },
      SUPER_ADMIN: { allowed: false, scope: 'NONE' },
    },
  },
  {
    moduleId: 'expenses',
    moduleNameEn: 'Operating Expenses',
    moduleNameAm: 'የስራ ማስኬጃ ወጪዎች',
    category: 'Financial',
    permissions: {
      OWNER: { allowed: true, scope: 'ALL', specialRules: 'Unlimited expense recording and budget review' },
      MANAGER: { allowed: true, scope: 'BRANCH', specialRules: 'Record branch utilities, petty cash, and transport' },
      CASHIER: { allowed: true, scope: 'OWN', specialRules: 'Petty cash under 500 ETB with receipt attachment' },
      INVENTORY_STAFF: { allowed: false, scope: 'NONE' },
      ACCOUNTANT: { allowed: true, scope: 'ALL', specialRules: 'Full ledger classification, tax, and salary' },
      SALESPERSON: { allowed: false, scope: 'NONE' },
      SUPER_ADMIN: { allowed: false, scope: 'NONE' },
    },
  },
  {
    moduleId: 'profit_loss_reports',
    moduleNameEn: 'Profit & Loss & Analytics',
    moduleNameAm: 'የትርፍና ኪሳራ ሪፖርቶች',
    category: 'Governance',
    permissions: {
      OWNER: { allowed: true, scope: 'ALL', specialRules: 'Unrestricted net profit, COGS, and margin analytics' },
      MANAGER: { allowed: true, scope: 'BRANCH', specialRules: 'Gross sales and inventory turnover (Net profit masked)' },
      CASHIER: { allowed: false, scope: 'NONE', specialRules: 'Only sees shift daily cash drawer totals' },
      INVENTORY_STAFF: { allowed: false, scope: 'NONE' },
      ACCOUNTANT: { allowed: true, scope: 'ALL', specialRules: 'Full audited P&L, balance sheets, and tax reports' },
      SALESPERSON: { allowed: false, scope: 'NONE' },
      SUPER_ADMIN: { allowed: false, scope: 'NONE', specialRules: 'Zero access to tenant financial data' },
    },
  },
  {
    moduleId: 'transaction_reversal',
    moduleNameEn: 'Refunds & Sale Reversals',
    moduleNameAm: 'የሽያጭ ስረዛና ተመላሽ (Reversals)',
    category: 'Financial',
    permissions: {
      OWNER: { allowed: true, scope: 'ALL', specialRules: 'Reverse transaction (creates offsetting corrective record)' },
      MANAGER: { allowed: true, scope: 'BRANCH', specialRules: 'Requires dual authorization and logged customer reason' },
      CASHIER: { allowed: false, scope: 'NONE', specialRules: 'Cannot reverse completed financial transactions' },
      INVENTORY_STAFF: { allowed: false, scope: 'NONE' },
      ACCOUNTANT: { allowed: true, scope: 'ALL', specialRules: 'Post accounting credit adjustment note' },
      SALESPERSON: { allowed: false, scope: 'NONE' },
      SUPER_ADMIN: { allowed: false, scope: 'NONE' },
    },
  },
  {
    moduleId: 'employees_rbac',
    moduleNameEn: 'Employee Management & Roles',
    moduleNameAm: 'የሰራተኞችና የስልጣን አስተዳደር',
    category: 'Governance',
    permissions: {
      OWNER: { allowed: true, scope: 'ALL', specialRules: 'Create, hire, set PIN, assign roles, terminate' },
      MANAGER: { allowed: true, scope: 'BRANCH', specialRules: 'Assign shifts and monitor cashiers' },
      CASHIER: { allowed: false, scope: 'NONE' },
      INVENTORY_STAFF: { allowed: false, scope: 'NONE' },
      ACCOUNTANT: { allowed: false, scope: 'NONE' },
      SALESPERSON: { allowed: false, scope: 'NONE' },
      SUPER_ADMIN: { allowed: false, scope: 'NONE' },
    },
  },
  {
    moduleId: 'audit_logs',
    moduleNameEn: 'Audit Trail & Compliance',
    moduleNameAm: 'የእንቅስቃሴና ኦዲት መዝገብ',
    category: 'Governance',
    permissions: {
      OWNER: { allowed: true, scope: 'ALL', specialRules: 'View all append-only logs across all branches' },
      MANAGER: { allowed: true, scope: 'BRANCH', specialRules: 'View branch operational audit logs' },
      CASHIER: { allowed: false, scope: 'NONE' },
      INVENTORY_STAFF: { allowed: false, scope: 'NONE' },
      ACCOUNTANT: { allowed: true, scope: 'ALL', specialRules: 'Audit financial modifications and adjustments' },
      SALESPERSON: { allowed: false, scope: 'NONE' },
      SUPER_ADMIN: { allowed: true, scope: 'PLATFORM_ONLY', specialRules: 'Platform security logs only (No tenant data)' },
    },
  },
  {
    moduleId: 'super_admin_boundaries',
    moduleNameEn: 'SaaS Platform Admin Scope',
    moduleNameAm: 'የሲስተም አድሚን ወሰን (Super Admin)',
    category: 'Governance',
    permissions: {
      OWNER: { allowed: false, scope: 'NONE' },
      MANAGER: { allowed: false, scope: 'NONE' },
      CASHIER: { allowed: false, scope: 'NONE' },
      INVENTORY_STAFF: { allowed: false, scope: 'NONE' },
      ACCOUNTANT: { allowed: false, scope: 'NONE' },
      SALESPERSON: { allowed: false, scope: 'NONE' },
      SUPER_ADMIN: {
        allowed: true,
        scope: 'PLATFORM_ONLY',
        specialRules: 'Manage subscriptions, plans, system health; STRICTLY FORBIDDEN from viewing store finances',
      },
    },
  },
];
