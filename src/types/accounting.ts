export type AccountType =
  | 'ASSET'
  | 'LIABILITY'
  | 'EQUITY'
  | 'REVENUE'
  | 'COGS'
  | 'EXPENSE'
  | 'OTHER_INCOME'
  | 'OTHER_EXPENSE';

export type NormalBalance = 'DEBIT' | 'CREDIT';

export interface Account {
  id: string;
  businessId: string;
  code: string; // e.g. "1000", "1030", "2000", "4000", "5000", "6000"
  name: string;
  amharicName: string;
  accountType: AccountType;
  parentId?: string;
  normalBalance: NormalBalance;
  currency: 'ETB' | string;
  isSystemAccount: boolean;
  isActive: boolean;
  balance: number; // Current balance calculated based on normal balance
  description?: string;
}

export type JournalStatus = 'DRAFT' | 'POSTED' | 'REVERSED';

export type JournalReferenceType =
  | 'SALE'
  | 'SALE_RETURN'
  | 'PURCHASE'
  | 'PURCHASE_RETURN'
  | 'EXPENSE'
  | 'CUSTOMER_PAYMENT'
  | 'SUPPLIER_PAYMENT'
  | 'OWNER_CAPITAL'
  | 'OWNER_DRAWING'
  | 'LOAN'
  | 'INVENTORY_ADJUSTMENT'
  | 'CASH_VARIANCE'
  | 'BAD_DEBT'
  | 'REVERSAL'
  | 'MANUAL';

export interface JournalEntryLine {
  id: string;
  journalEntryId: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  debit: number; // Fixed 2-decimal ETB
  credit: number; // Fixed 2-decimal ETB
  currency: 'ETB' | string;
  description: string;
  customerId?: string;
  customerName?: string;
  supplierId?: string;
  supplierName?: string;
  productId?: string;
  productName?: string;
  branchId?: string;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  businessId: string;
  branchId: string;
  referenceType: JournalReferenceType;
  referenceId: string;
  journalNumber: string; // e.g. "JRN-2026-0001"
  transactionDate: string; // ISO date
  description: string;
  status: JournalStatus;
  lines: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  postedAt?: string;
  postedBy: string;
  postedByName?: string;
  reversedEntryId?: string;
  createdAt: string;
}

export interface FinancialTransaction {
  id: string;
  businessId: string;
  branchId: string;
  transactionNumber: string;
  transactionType: JournalReferenceType;
  referenceType: string;
  referenceId: string;
  amount: number;
  currency: 'ETB' | string;
  transactionDate: string;
  status: 'DRAFT' | 'POSTED' | 'REVERSED';
  createdBy: string;
  createdAt: string;
  postedAt?: string;
  reversedAt?: string;
  reversalId?: string;
}

export type CashRegisterStatus = 'OPEN' | 'CLOSED' | 'RECONCILIATION_REQUIRED';

export interface CashRegister {
  id: string;
  businessId: string;
  branchId: string;
  employeeId: string;
  employeeName: string;
  openingBalance: number; // Starting float cash
  closingBalance?: number;
  expectedBalance: number;
  actualBalance?: number;
  difference?: number; // actual - expected (positive = overage, negative = shortage)
  openedAt: string;
  closedAt?: string;
  status: CashRegisterStatus;
  notes?: string;
}

export type FinancialPeriodStatus = 'OPEN' | 'CLOSED' | 'LOCKED';

export interface FinancialPeriod {
  id: string;
  businessId: string;
  periodName: string; // e.g. "Tikimt 2019 / October 2026"
  startDate: string;
  endDate: string;
  status: FinancialPeriodStatus;
  closedAt?: string;
  closedBy?: string;
}

export interface AccountingSettings {
  baseCurrency: 'ETB';
  taxEnabled: boolean;
  taxInclusive: boolean;
  taxRatePercent: number; // e.g. 15%
  taxRegistrationNumber?: string;
  taxRoundingPolicy: 'LINE_LEVEL' | 'INVOICE_LEVEL';
  inventoryMethod: 'WEIGHTED_AVERAGE' | 'FIFO';
  negativeStockPolicy: 'BLOCK' | 'WARN' | 'ALLOW_WITH_PERMISSION';
  negativeCashPolicy: 'BLOCK' | 'WARN';
  cashVariancePolicy: 'AUTO_POST_VARIANCE' | 'REQUIRE_APPROVAL';
  creditLimitPolicy: 'BLOCK_EXCEEDED' | 'ALLOW_WITH_OVERRIDE';
  approvalThreshold: number; // ETB e.g. 5,000
}

export interface GeneralLedgerLine {
  date: string;
  referenceType: string;
  referenceId: string;
  journalNumber: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

export interface AgingBucket {
  bucket: 'CURRENT' | 'DAYS_1_30' | 'DAYS_31_60' | 'DAYS_61_90' | 'DAYS_90_PLUS';
  labelEn: string;
  labelAm: string;
  amount: number;
  customerCount: number;
}

export interface BalanceSheetData {
  asOfDate: string;
  assets: {
    cash: number;
    bank: number;
    mobileMoney: number;
    accountsReceivable: number;
    inventory: number;
    equipment: number;
    totalAssets: number;
  };
  liabilities: {
    accountsPayable: number;
    taxPayable: number;
    loanPayable: number;
    totalLiabilities: number;
  };
  equity: {
    ownerCapital: number;
    retainedEarnings: number;
    currentPeriodProfit: number;
    ownerDrawings: number;
    totalEquity: number;
  };
  isBalanced: boolean;
  imbalanceAmount: number;
}

export interface ProfitAndLossData {
  periodLabel: string;
  grossSales: number;
  salesDiscounts: number;
  salesReturns: number;
  netSales: number;
  costOfGoodsSold: number;
  grossProfit: number;
  grossMarginPercent: number;
  operatingExpenses: {
    rent: number;
    salaries: number;
    electricity: number;
    water: number;
    internet: number;
    transport: number;
    marketing: number;
    maintenance: number;
    supplies: number;
    other: number;
    total: number;
  };
  operatingProfit: number;
  otherIncome: number;
  otherExpense: number;
  netProfit: number;
  netProfitMarginPercent: number;
  isEstimated: boolean;
  unpostedCount: number;
}
