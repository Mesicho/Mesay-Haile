import {
  Account,
  JournalEntry,
  JournalEntryLine,
  JournalReferenceType,
  ProfitAndLossData,
  BalanceSheetData,
  AgingBucket,
  GeneralLedgerLine,
} from '../types/accounting';
import { Sale, Expense, Purchase, CustomerDebt, Customer, Supplier } from '../types';

/**
 * Ensures clean 2-decimal money precision (ETB)
 */
export const roundETB = (amount: number): number => {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
};

/**
 * Format ETB for presentation (e.g. 2,500.00 ብር)
 */
export const formatETB = (amount: number, lang: 'am' | 'en' = 'en'): string => {
  const formatted = roundETB(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return lang === 'am' ? `${formatted} ብር` : `${formatted} ETB`;
};

/**
 * Weighted Average Cost Formula:
 * New Avg = (Old Qty * Old Cost + New Qty * Purchase Cost) / (Old Qty + New Qty)
 */
export const calculateWeightedAverageCost = (
  existingQty: number,
  existingCost: number,
  newQty: number,
  newPurchaseCost: number
): number => {
  const safeExistingQty = Math.max(0, existingQty);
  const totalUnits = safeExistingQty + newQty;
  if (totalUnits <= 0) return newPurchaseCost;

  const totalValue = safeExistingQty * existingCost + newQty * newPurchaseCost;
  return roundETB(totalValue / totalUnits);
};

/**
 * Generates a balanced Journal Entry for a Sale (Cash, Bank, Mobile, or Credit)
 * Satisfies: TOTAL DEBITS = TOTAL CREDITS
 */
export const createSaleJournalEntry = (
  sale: Sale,
  userId: string,
  userName: string
): JournalEntry => {
  const lines: JournalEntryLine[] = [];
  const entryId = `jrn_sale_${sale.id}`;
  const now = new Date().toISOString();

  // 1. Process payment inflows (Assets DEBIT)
  if (sale.splitPayments && sale.splitPayments.length > 0) {
    sale.splitPayments.forEach((p, idx) => {
      let accCode = '1000';
      let accName = 'Cash on Hand';
      if (p.method === 'BANK') {
        accCode = '1010';
        accName = 'Bank Account';
      } else if (p.method === 'MOBILE') {
        accCode = '1020';
        accName = 'Mobile Money (Telebirr)';
      } else if (p.method === 'CREDIT') {
        accCode = '1030';
        accName = 'Accounts Receivable';
      }

      if (p.amount > 0) {
        lines.push({
          id: `line_${entryId}_pay_${idx}`,
          journalEntryId: entryId,
          accountId: `acc_${accCode}`,
          accountCode: accCode,
          accountName: accName,
          accountType: 'ASSET',
          debit: roundETB(p.amount),
          credit: 0,
          currency: 'ETB',
          description: `Sale Payment (${p.method}) - Invoice ${sale.invoiceNumber}`,
          customerId: sale.customerId,
          customerName: sale.customerName,
          branchId: sale.branchId,
          createdAt: now,
        });
      }
    });
  } else {
    // Single payment method
    if (sale.amountPaid > 0) {
      let accCode = '1000';
      let accName = 'Cash on Hand';
      if (sale.paymentMethod === 'BANK') {
        accCode = '1010';
        accName = 'Bank Account';
      } else if (sale.paymentMethod === 'MOBILE') {
        accCode = '1020';
        accName = 'Mobile Money';
      }

      lines.push({
        id: `line_${entryId}_cash`,
        journalEntryId: entryId,
        accountId: `acc_${accCode}`,
        accountCode: accCode,
        accountName: accName,
        accountType: 'ASSET',
        debit: roundETB(sale.amountPaid),
        credit: 0,
        currency: 'ETB',
        description: `Sale Cash Receipt - Invoice ${sale.invoiceNumber}`,
        customerId: sale.customerId,
        customerName: sale.customerName,
        branchId: sale.branchId,
        createdAt: now,
      });
    }

    if (sale.creditAmount > 0) {
      lines.push({
        id: `line_${entryId}_ar`,
        journalEntryId: entryId,
        accountId: 'acc_1030',
        accountCode: '1030',
        accountName: 'Accounts Receivable (Customer Debt)',
        accountType: 'ASSET',
        debit: roundETB(sale.creditAmount),
        credit: 0,
        currency: 'ETB',
        description: `Customer Credit Receivable - Invoice ${sale.invoiceNumber}`,
        customerId: sale.customerId,
        customerName: sale.customerName,
        branchId: sale.branchId,
        createdAt: now,
      });
    }
  }

  // 2. Sales Discount (Contra-revenue DEBIT) if any
  if (sale.discount > 0) {
    lines.push({
      id: `line_${entryId}_discount`,
      journalEntryId: entryId,
      accountId: 'acc_4040',
      accountCode: '4040',
      accountName: 'Sales Discounts Given',
      accountType: 'REVENUE',
      debit: roundETB(sale.discount),
      credit: 0,
      currency: 'ETB',
      description: `Sales Discount - Invoice ${sale.invoiceNumber}`,
      customerId: sale.customerId,
      customerName: sale.customerName,
      branchId: sale.branchId,
      createdAt: now,
    });
  }

  // 3. Tax Component (Liability CREDIT) if tax included or enabled
  if (sale.tax > 0) {
    lines.push({
      id: `line_${entryId}_tax`,
      journalEntryId: entryId,
      accountId: 'acc_2010',
      accountCode: '2010',
      accountName: 'Tax Payable (VAT / TOT)',
      accountType: 'LIABILITY',
      debit: 0,
      credit: roundETB(sale.tax),
      currency: 'ETB',
      description: `Sales Tax Collected - Invoice ${sale.invoiceNumber}`,
      branchId: sale.branchId,
      createdAt: now,
    });
  }

  // 4. Sales Revenue (Revenue CREDIT)
  // Revenue = Subtotal (gross sales before discount)
  const grossSales = sale.subtotal > 0 ? sale.subtotal : sale.total + sale.discount;
  lines.push({
    id: `line_${entryId}_rev`,
    journalEntryId: entryId,
    accountId: 'acc_4000',
    accountCode: '4000',
    accountName: 'Product Sales Revenue',
    accountType: 'REVENUE',
    debit: 0,
    credit: roundETB(grossSales),
    currency: 'ETB',
    description: `Gross Product Sales - Invoice ${sale.invoiceNumber}`,
    customerId: sale.customerId,
    customerName: sale.customerName,
    branchId: sale.branchId,
    createdAt: now,
  });

  // 5. Cost of Goods Sold & Inventory Asset (COGS DEBIT, Inventory CREDIT)
  if (sale.costOfGoodsSold > 0) {
    lines.push({
      id: `line_${entryId}_cogs`,
      journalEntryId: entryId,
      accountId: 'acc_5000',
      accountCode: '5000',
      accountName: 'Cost of Goods Sold (COGS)',
      accountType: 'COGS',
      debit: roundETB(sale.costOfGoodsSold),
      credit: 0,
      currency: 'ETB',
      description: `COGS for Invoice ${sale.invoiceNumber}`,
      branchId: sale.branchId,
      createdAt: now,
    });

    lines.push({
      id: `line_${entryId}_inv`,
      journalEntryId: entryId,
      accountId: 'acc_1040',
      accountCode: '1040',
      accountName: 'Merchandise Inventory',
      accountType: 'ASSET',
      debit: 0,
      credit: roundETB(sale.costOfGoodsSold),
      currency: 'ETB',
      description: `Inventory reduction for Invoice ${sale.invoiceNumber}`,
      branchId: sale.branchId,
      createdAt: now,
    });
  }

  const totalDebit = roundETB(lines.reduce((sum, l) => sum + l.debit, 0));
  const totalCredit = roundETB(lines.reduce((sum, l) => sum + l.credit, 0));

  return {
    id: entryId,
    businessId: sale.businessId,
    branchId: sale.branchId,
    referenceType: 'SALE',
    referenceId: sale.id,
    journalNumber: `JRN-${sale.invoiceNumber}`,
    transactionDate: sale.createdAt,
    description: `POS Sale #${sale.invoiceNumber} (${sale.customerName || 'Walk-in'})`,
    status: 'POSTED',
    lines,
    totalDebit,
    totalCredit,
    postedAt: now,
    postedBy: userId,
    postedByName: userName,
    createdAt: now,
  };
};

/**
 * Customer Debt Payment Journal Entry
 * Golden Rule: Customer payment decreases Accounts Receivable. It DOES NOT create new revenue!
 * Debit: Cash/Bank/Mobile
 * Credit: Accounts Receivable (1030)
 */
export const createCustomerPaymentJournalEntry = (params: {
  businessId: string;
  branchId: string;
  paymentId: string;
  receiptNumber: string;
  amount: number;
  paymentMethod: string;
  customerId: string;
  customerName: string;
  userId: string;
  userName: string;
}): JournalEntry => {
  const {
    businessId,
    branchId,
    paymentId,
    receiptNumber,
    amount,
    paymentMethod,
    customerId,
    customerName,
    userId,
    userName,
  } = params;

  const entryId = `jrn_pay_${paymentId}`;
  const now = new Date().toISOString();

  let assetCode = '1000';
  let assetName = 'Cash on Hand';
  if (paymentMethod.toUpperCase().includes('BANK')) {
    assetCode = '1010';
    assetName = 'Bank Account';
  } else if (paymentMethod.toUpperCase().includes('TELEBIRR') || paymentMethod.toUpperCase().includes('MOBILE')) {
    assetCode = '1020';
    assetName = 'Mobile Money (Telebirr)';
  }

  const roundedAmount = roundETB(amount);

  const lines: JournalEntryLine[] = [
    {
      id: `line_${entryId}_debit`,
      journalEntryId: entryId,
      accountId: `acc_${assetCode}`,
      accountCode: assetCode,
      accountName: assetName,
      accountType: 'ASSET',
      debit: roundedAmount,
      credit: 0,
      currency: 'ETB',
      description: `Debt payment received from ${customerName} (Receipt #${receiptNumber})`,
      customerId,
      customerName,
      branchId,
      createdAt: now,
    },
    {
      id: `line_${entryId}_credit`,
      journalEntryId: entryId,
      accountId: 'acc_1030',
      accountCode: '1030',
      accountName: 'Accounts Receivable (Customer Debt)',
      accountType: 'ASSET',
      debit: 0,
      credit: roundedAmount,
      currency: 'ETB',
      description: `Reduction of Accounts Receivable for ${customerName}`,
      customerId,
      customerName,
      branchId,
      createdAt: now,
    },
  ];

  return {
    id: entryId,
    businessId,
    branchId,
    referenceType: 'CUSTOMER_PAYMENT',
    referenceId: paymentId,
    journalNumber: `JRN-RCP-${receiptNumber}`,
    transactionDate: now,
    description: `Customer debt collection from ${customerName} - ${roundedAmount} ETB`,
    status: 'POSTED',
    lines,
    totalDebit: roundedAmount,
    totalCredit: roundedAmount,
    postedAt: now,
    postedBy: userId,
    postedByName: userName,
    createdAt: now,
  };
};

/**
 * Purchase Journal Entry
 * Golden Rule: Inventory purchase is an ASSET, NOT an immediate operating expense!
 * Debit: Merchandise Inventory (1040)
 * Credit: Cash (1000) / Bank (1010) / Accounts Payable (2000)
 */
export const createPurchaseJournalEntry = (
  purchase: Purchase,
  userId: string,
  userName: string
): JournalEntry => {
  const entryId = `jrn_pur_${purchase.id}`;
  const now = new Date().toISOString();
  const roundedTotal = roundETB(purchase.totalAmount);
  const roundedPaid = roundETB(purchase.amountPaid);
  const roundedPayable = roundETB(purchase.debtPayable);

  const lines: JournalEntryLine[] = [
    // 1. Debit Inventory Asset
    {
      id: `line_${entryId}_inv`,
      journalEntryId: entryId,
      accountId: 'acc_1040',
      accountCode: '1040',
      accountName: 'Merchandise Inventory',
      accountType: 'ASSET',
      debit: roundedTotal,
      credit: 0,
      currency: 'ETB',
      description: `Inventory acquired from supplier ${purchase.supplierName} - Inv #${purchase.invoiceNumber}`,
      supplierId: purchase.supplierId,
      supplierName: purchase.supplierName,
      branchId: purchase.branchId,
      createdAt: now,
    },
  ];

  // 2. Credit Cash / Bank if cash paid
  if (roundedPaid > 0) {
    let cashCode = '1000';
    let cashName = 'Cash on Hand';
    if (purchase.paymentMethod.toUpperCase().includes('BANK')) {
      cashCode = '1010';
      cashName = 'Bank Account';
    }

    lines.push({
      id: `line_${entryId}_cash`,
      journalEntryId: entryId,
      accountId: `acc_${cashCode}`,
      accountCode: cashCode,
      accountName: cashName,
      accountType: 'ASSET',
      debit: 0,
      credit: roundedPaid,
      currency: 'ETB',
      description: `Payment to supplier ${purchase.supplierName}`,
      supplierId: purchase.supplierId,
      supplierName: purchase.supplierName,
      branchId: purchase.branchId,
      createdAt: now,
    });
  }

  // 3. Credit Accounts Payable if bought on credit
  if (roundedPayable > 0) {
    lines.push({
      id: `line_${entryId}_ap`,
      journalEntryId: entryId,
      accountId: 'acc_2000',
      accountCode: '2000',
      accountName: 'Accounts Payable (Supplier Debt)',
      accountType: 'LIABILITY',
      debit: 0,
      credit: roundedPayable,
      currency: 'ETB',
      description: `Supplier credit payable to ${purchase.supplierName}`,
      supplierId: purchase.supplierId,
      supplierName: purchase.supplierName,
      branchId: purchase.branchId,
      createdAt: now,
    });
  }

  return {
    id: entryId,
    businessId: purchase.businessId,
    branchId: purchase.branchId,
    referenceType: 'PURCHASE',
    referenceId: purchase.id,
    journalNumber: `JRN-PUR-${purchase.invoiceNumber}`,
    transactionDate: purchase.createdAt,
    description: `Purchase from ${purchase.supplierName} (Inv #${purchase.invoiceNumber})`,
    status: 'POSTED',
    lines,
    totalDebit: roundedTotal,
    totalCredit: roundedTotal,
    postedAt: now,
    postedBy: userId,
    postedByName: userName,
    createdAt: now,
  };
};

/**
 * Operating Expense Journal Entry
 * Debit: Specific Operating Expense Account (Rent 6000, Salary 6040, etc.)
 * Credit: Cash (1000) or Bank (1010)
 */
export const createExpenseJournalEntry = (
  expense: Expense,
  userId: string,
  userName: string
): JournalEntry => {
  const entryId = `jrn_exp_${expense.id}`;
  const now = new Date().toISOString();
  const roundedAmount = roundETB(expense.amount);

  let expenseAccountCode = '6140';
  let expenseAccountName = 'Miscellaneous / Other Expenses';

  switch (expense.category) {
    case 'Rent':
      expenseAccountCode = '6000';
      expenseAccountName = 'Rent Expense';
      break;
    case 'Electricity':
      expenseAccountCode = '6010';
      expenseAccountName = 'Electricity Expense';
      break;
    case 'Water':
      expenseAccountCode = '6020';
      expenseAccountName = 'Water Expense';
      break;
    case 'Internet':
      expenseAccountCode = '6030';
      expenseAccountName = 'Internet & Telecom';
      break;
    case 'Salary':
      expenseAccountCode = '6040';
      expenseAccountName = 'Salaries & Wages';
      break;
    case 'Transport':
      expenseAccountCode = '6050';
      expenseAccountName = 'Transport & Freight';
      break;
    case 'Marketing':
      expenseAccountCode = '6060';
      expenseAccountName = 'Marketing & Promotion';
      break;
    case 'Maintenance':
      expenseAccountCode = '6070';
      expenseAccountName = 'Maintenance & Repairs';
      break;
    case 'Supplies':
      expenseAccountCode = '6080';
      expenseAccountName = 'Office & Store Supplies';
      break;
    case 'Tax':
      expenseAccountCode = '2010'; // Or tax expense
      expenseAccountName = 'Tax Payment';
      break;
  }

  let creditCode = '1000';
  let creditName = 'Cash on Hand';
  if (expense.paymentMethod.toUpperCase().includes('BANK')) {
    creditCode = '1010';
    creditName = 'Bank Account';
  } else if (expense.paymentMethod.toUpperCase().includes('TELEBIRR')) {
    creditCode = '1020';
    creditName = 'Mobile Money (Telebirr)';
  }

  const lines: JournalEntryLine[] = [
    {
      id: `line_${entryId}_exp`,
      journalEntryId: entryId,
      accountId: `acc_${expenseAccountCode}`,
      accountCode: expenseAccountCode,
      accountName: expenseAccountName,
      accountType: 'EXPENSE',
      debit: roundedAmount,
      credit: 0,
      currency: 'ETB',
      description: `${expense.category} expense: ${expense.description}`,
      branchId: expense.branchId,
      createdAt: now,
    },
    {
      id: `line_${entryId}_cash`,
      journalEntryId: entryId,
      accountId: `acc_${creditCode}`,
      accountCode: creditCode,
      accountName: creditName,
      accountType: 'ASSET',
      debit: 0,
      credit: roundedAmount,
      currency: 'ETB',
      description: `Payment for ${expense.category}`,
      branchId: expense.branchId,
      createdAt: now,
    },
  ];

  return {
    id: entryId,
    businessId: expense.businessId,
    branchId: expense.branchId,
    referenceType: 'EXPENSE',
    referenceId: expense.id,
    journalNumber: `JRN-EXP-${expense.receiptNumber || expense.id.slice(-6)}`,
    transactionDate: expense.createdAt,
    description: `Operating Expense: ${expense.category} (${roundedAmount} ETB)`,
    status: 'POSTED',
    lines,
    totalDebit: roundedAmount,
    totalCredit: roundedAmount,
    postedAt: now,
    postedBy: userId,
    postedByName: userName,
    createdAt: now,
  };
};

/**
 * Inventory Adjustment / Write-Off Journal Entry (Damage / Expired / Shortage)
 * Debit: Inventory Write-Off Expense (5020)
 * Credit: Merchandise Inventory (1040)
 */
export const createInventoryAdjustmentJournalEntry = (params: {
  businessId: string;
  branchId: string;
  productId: string;
  productName: string;
  quantityLost: number;
  unitCost: number;
  reason: string;
  userId: string;
  userName: string;
}): JournalEntry => {
  const {
    businessId,
    branchId,
    productId,
    productName,
    quantityLost,
    unitCost,
    reason,
    userId,
    userName,
  } = params;

  const entryId = `jrn_adj_${Date.now()}`;
  const now = new Date().toISOString();
  const writeOffAmount = roundETB(quantityLost * unitCost);

  const lines: JournalEntryLine[] = [
    {
      id: `line_${entryId}_loss`,
      journalEntryId: entryId,
      accountId: 'acc_5020',
      accountCode: '5020',
      accountName: 'Inventory Write-off (Damage/Expired)',
      accountType: 'COGS',
      debit: writeOffAmount,
      credit: 0,
      currency: 'ETB',
      description: `Write-off of ${quantityLost} units of ${productName} (${reason})`,
      productId,
      productName,
      branchId,
      createdAt: now,
    },
    {
      id: `line_${entryId}_inv`,
      journalEntryId: entryId,
      accountId: 'acc_1040',
      accountCode: '1040',
      accountName: 'Merchandise Inventory',
      accountType: 'ASSET',
      debit: 0,
      credit: writeOffAmount,
      currency: 'ETB',
      description: `Reduction of inventory for write-off of ${productName}`,
      productId,
      productName,
      branchId,
      createdAt: now,
    },
  ];

  return {
    id: entryId,
    businessId,
    branchId,
    referenceType: 'INVENTORY_ADJUSTMENT',
    referenceId: productId,
    journalNumber: `JRN-ADJ-${Date.now().toString().slice(-6)}`,
    transactionDate: now,
    description: `Inventory Write-Off: ${productName} - ${reason} (${writeOffAmount} ETB)`,
    status: 'POSTED',
    lines,
    totalDebit: writeOffAmount,
    totalCredit: writeOffAmount,
    postedAt: now,
    postedBy: userId,
    postedByName: userName,
    createdAt: now,
  };
};

/**
 * Owner Capital Inflow Journal Entry
 * Golden Rule: Owner capital is EQUITY, NOT REVENUE!
 * Debit: Cash (1000)
 * Credit: Owner Capital (3000)
 */
export const createOwnerCapitalJournalEntry = (params: {
  businessId: string;
  branchId: string;
  amount: number;
  userId: string;
  userName: string;
  notes?: string;
}): JournalEntry => {
  const entryId = `jrn_cap_${Date.now()}`;
  const now = new Date().toISOString();
  const roundedAmount = roundETB(params.amount);

  const lines: JournalEntryLine[] = [
    {
      id: `line_${entryId}_cash`,
      journalEntryId: entryId,
      accountId: 'acc_1000',
      accountCode: '1000',
      accountName: 'Cash on Hand',
      accountType: 'ASSET',
      debit: roundedAmount,
      credit: 0,
      currency: 'ETB',
      description: `Owner capital injected: ${params.notes || 'Additional store capital'}`,
      branchId: params.branchId,
      createdAt: now,
    },
    {
      id: `line_${entryId}_equity`,
      journalEntryId: entryId,
      accountId: 'acc_3000',
      accountCode: '3000',
      accountName: 'Owner Capital',
      accountType: 'EQUITY',
      debit: 0,
      credit: roundedAmount,
      currency: 'ETB',
      description: `Owner equity contribution`,
      branchId: params.branchId,
      createdAt: now,
    },
  ];

  return {
    id: entryId,
    businessId: params.businessId,
    branchId: params.branchId,
    referenceType: 'OWNER_CAPITAL',
    referenceId: `cap_${Date.now()}`,
    journalNumber: `JRN-CAP-${Date.now().toString().slice(-6)}`,
    transactionDate: now,
    description: `Owner Capital Contribution (${roundedAmount} ETB)`,
    status: 'POSTED',
    lines,
    totalDebit: roundedAmount,
    totalCredit: roundedAmount,
    postedAt: now,
    postedBy: params.userId,
    postedByName: params.userName,
    createdAt: now,
  };
};

/**
 * Owner Drawings Journal Entry
 * Golden Rule: Personal drawings reduce EQUITY, NOT an operating expense!
 * Debit: Owner Drawings (3020)
 * Credit: Cash (1000)
 */
export const createOwnerDrawingJournalEntry = (params: {
  businessId: string;
  branchId: string;
  amount: number;
  userId: string;
  userName: string;
  notes?: string;
}): JournalEntry => {
  const entryId = `jrn_draw_${Date.now()}`;
  const now = new Date().toISOString();
  const roundedAmount = roundETB(params.amount);

  const lines: JournalEntryLine[] = [
    {
      id: `line_${entryId}_draw`,
      journalEntryId: entryId,
      accountId: 'acc_3020',
      accountCode: '3020',
      accountName: 'Owner Drawings',
      accountType: 'EQUITY',
      debit: roundedAmount,
      credit: 0,
      currency: 'ETB',
      description: `Owner personal drawing: ${params.notes || 'Personal withdrawal'}`,
      branchId: params.branchId,
      createdAt: now,
    },
    {
      id: `line_${entryId}_cash`,
      journalEntryId: entryId,
      accountId: 'acc_1000',
      accountCode: '1000',
      accountName: 'Cash on Hand',
      accountType: 'ASSET',
      debit: 0,
      credit: roundedAmount,
      currency: 'ETB',
      description: `Cash withdrawal by owner`,
      branchId: params.branchId,
      createdAt: now,
    },
  ];

  return {
    id: entryId,
    businessId: params.businessId,
    branchId: params.branchId,
    referenceType: 'OWNER_DRAWING',
    referenceId: `draw_${Date.now()}`,
    journalNumber: `JRN-DRAW-${Date.now().toString().slice(-6)}`,
    transactionDate: now,
    description: `Owner Personal Drawing (${roundedAmount} ETB)`,
    status: 'POSTED',
    lines,
    totalDebit: roundedAmount,
    totalCredit: roundedAmount,
    postedAt: now,
    postedBy: params.userId,
    postedByName: params.userName,
    createdAt: now,
  };
};

/**
 * Bank Loan Inflow Journal Entry
 * Golden Rule: Loan is a LIABILITY, NOT REVENUE!
 * Debit: Bank (1010)
 * Credit: Bank Loan Payable (2020)
 */
export const createLoanJournalEntry = (params: {
  businessId: string;
  branchId: string;
  amount: number;
  userId: string;
  userName: string;
  notes?: string;
}): JournalEntry => {
  const entryId = `jrn_loan_${Date.now()}`;
  const now = new Date().toISOString();
  const roundedAmount = roundETB(params.amount);

  const lines: JournalEntryLine[] = [
    {
      id: `line_${entryId}_bank`,
      journalEntryId: entryId,
      accountId: 'acc_1010',
      accountCode: '1010',
      accountName: 'Bank Account (CBE / Awash)',
      accountType: 'ASSET',
      debit: roundedAmount,
      credit: 0,
      currency: 'ETB',
      description: `Loan received deposited into bank: ${params.notes || 'Commercial loan'}`,
      branchId: params.branchId,
      createdAt: now,
    },
    {
      id: `line_${entryId}_liability`,
      journalEntryId: entryId,
      accountId: 'acc_2020',
      accountCode: '2020',
      accountName: 'Bank Loan Payable',
      accountType: 'LIABILITY',
      debit: 0,
      credit: roundedAmount,
      currency: 'ETB',
      description: `Loan liability obligation`,
      branchId: params.branchId,
      createdAt: now,
    },
  ];

  return {
    id: entryId,
    businessId: params.businessId,
    branchId: params.branchId,
    referenceType: 'LOAN',
    referenceId: `loan_${Date.now()}`,
    journalNumber: `JRN-LOAN-${Date.now().toString().slice(-6)}`,
    transactionDate: now,
    description: `Bank Loan Received (${roundedAmount} ETB)`,
    status: 'POSTED',
    lines,
    totalDebit: roundedAmount,
    totalCredit: roundedAmount,
    postedAt: now,
    postedBy: params.userId,
    postedByName: params.userName,
    createdAt: now,
  };
};

/**
 * Cash Register Variance Journal Entry
 * Shortage: Debit Cash Shortage Expense (7010), Credit Cash (1000)
 * Overage: Debit Cash (1000), Credit Cash Overage / Other Income (7000)
 */
export const createCashVarianceJournalEntry = (params: {
  businessId: string;
  branchId: string;
  difference: number; // positive = overage, negative = shortage
  cashRegisterId: string;
  userId: string;
  userName: string;
  reason?: string;
}): JournalEntry => {
  const { businessId, branchId, difference, cashRegisterId, userId, userName, reason } = params;
  const entryId = `jrn_var_${Date.now()}`;
  const now = new Date().toISOString();
  const absDiff = roundETB(Math.abs(difference));

  const lines: JournalEntryLine[] = [];

  if (difference < 0) {
    // Shortage
    lines.push(
      {
        id: `line_${entryId}_shortage`,
        journalEntryId: entryId,
        accountId: 'acc_7010',
        accountCode: '7010',
        accountName: 'Cash Register Shortage Expense',
        accountType: 'OTHER_EXPENSE',
        debit: absDiff,
        credit: 0,
        currency: 'ETB',
        description: `Cash shortage in register: ${reason || 'Physical count variance'}`,
        branchId,
        createdAt: now,
      },
      {
        id: `line_${entryId}_cash`,
        journalEntryId: entryId,
        accountId: 'acc_1000',
        accountCode: '1000',
        accountName: 'Cash on Hand',
        accountType: 'ASSET',
        debit: 0,
        credit: absDiff,
        currency: 'ETB',
        description: `Reduction of cash for register shortage`,
        branchId,
        createdAt: now,
      }
    );
  } else {
    // Overage
    lines.push(
      {
        id: `line_${entryId}_cash`,
        journalEntryId: entryId,
        accountId: 'acc_1000',
        accountCode: '1000',
        accountName: 'Cash on Hand',
        accountType: 'ASSET',
        debit: absDiff,
        credit: 0,
        currency: 'ETB',
        description: `Cash overage added to cash-on-hand`,
        branchId,
        createdAt: now,
      },
      {
        id: `line_${entryId}_overage`,
        journalEntryId: entryId,
        accountId: 'acc_7000',
        accountCode: '7000',
        accountName: 'Cash Register Overage / Other Income',
        accountType: 'OTHER_INCOME',
        debit: 0,
        credit: absDiff,
        currency: 'ETB',
        description: `Cash overage: ${reason || 'Physical count excess'}`,
        branchId,
        createdAt: now,
      }
    );
  }

  return {
    id: entryId,
    businessId,
    branchId,
    referenceType: 'CASH_VARIANCE',
    referenceId: cashRegisterId,
    journalNumber: `JRN-VAR-${Date.now().toString().slice(-6)}`,
    transactionDate: now,
    description: `Cash Register Reconciliation Variance (${difference < 0 ? '-' : '+'}${absDiff} ETB)`,
    status: 'POSTED',
    lines,
    totalDebit: absDiff,
    totalCredit: absDiff,
    postedAt: now,
    postedBy: userId,
    postedByName: userName,
    createdAt: now,
  };
};

/**
 * Reversal Entry Creator:
 * Inverts all Debits and Credits and links to reversedEntryId
 */
export const createJournalReversal = (
  originalEntry: JournalEntry,
  userId: string,
  userName: string,
  reason: string
): JournalEntry => {
  const reversalId = `jrn_rev_${Date.now()}`;
  const now = new Date().toISOString();

  const reversalLines: JournalEntryLine[] = originalEntry.lines.map((l, idx) => ({
    id: `line_${reversalId}_${idx}`,
    journalEntryId: reversalId,
    accountId: l.accountId,
    accountCode: l.accountCode,
    accountName: l.accountName,
    accountType: l.accountType,
    debit: l.credit, // SWAP
    credit: l.debit, // SWAP
    currency: l.currency,
    description: `REVERSAL of ${l.description} (${reason})`,
    customerId: l.customerId,
    customerName: l.customerName,
    supplierId: l.supplierId,
    supplierName: l.supplierName,
    productId: l.productId,
    productName: l.productName,
    branchId: l.branchId,
    createdAt: now,
  }));

  return {
    id: reversalId,
    businessId: originalEntry.businessId,
    branchId: originalEntry.branchId,
    referenceType: 'REVERSAL',
    referenceId: originalEntry.referenceId,
    journalNumber: `JRN-REV-${originalEntry.journalNumber}`,
    transactionDate: now,
    description: `REVERSAL: ${originalEntry.description} - Reason: ${reason}`,
    status: 'POSTED',
    lines: reversalLines,
    totalDebit: originalEntry.totalCredit,
    totalCredit: originalEntry.totalDebit,
    postedAt: now,
    postedBy: userId,
    postedByName: userName,
    reversedEntryId: originalEntry.id,
    createdAt: now,
  };
};

// ============================================================
// FINANCIAL REPORT GENERATORS
// ============================================================

/**
 * Profit & Loss Report Generator:
 * Strict Accounting Separation:
 * Gross Sales - Sales Discounts - Sales Returns = Net Sales
 * Net Sales - COGS = Gross Profit
 * Gross Profit - Operating Expenses = Operating Profit
 * Operating Profit + Other Income - Other Expenses = Net Profit
 */
export const generateProfitAndLoss = (
  accounts: Account[],
  unpostedCount = 0
): ProfitAndLossData => {
  const getBal = (code: string) => accounts.find((a) => a.code === code)?.balance || 0;

  const grossSales = getBal('4000') + getBal('4010');
  const salesDiscounts = getBal('4040');
  const salesReturns = getBal('4030');
  const netSales = roundETB(grossSales - salesDiscounts - salesReturns);

  const costOfGoodsSold = roundETB(getBal('5000') + getBal('5020'));
  const grossProfit = roundETB(netSales - costOfGoodsSold);
  const grossMarginPercent = netSales > 0 ? roundETB((grossProfit / netSales) * 100) : 0;

  const operatingExpenses = {
    rent: getBal('6000'),
    electricity: getBal('6010'),
    water: getBal('6020'),
    internet: getBal('6030'),
    salaries: getBal('6040'),
    transport: getBal('6050'),
    marketing: getBal('6060'),
    maintenance: getBal('6070'),
    supplies: getBal('6080'),
    other: getBal('6100') + getBal('6140'),
    total: 0,
  };

  operatingExpenses.total = roundETB(
    operatingExpenses.rent +
      operatingExpenses.electricity +
      operatingExpenses.water +
      operatingExpenses.internet +
      operatingExpenses.salaries +
      operatingExpenses.transport +
      operatingExpenses.marketing +
      operatingExpenses.maintenance +
      operatingExpenses.supplies +
      operatingExpenses.other
  );

  const operatingProfit = roundETB(grossProfit - operatingExpenses.total);
  const otherIncome = getBal('7000');
  const otherExpense = getBal('7010');
  const netProfit = roundETB(operatingProfit + otherIncome - otherExpense);
  const netProfitMarginPercent = netSales > 0 ? roundETB((netProfit / netSales) * 100) : 0;

  return {
    periodLabel: 'Current Fiscal Period',
    grossSales,
    salesDiscounts,
    salesReturns,
    netSales,
    costOfGoodsSold,
    grossProfit,
    grossMarginPercent,
    operatingExpenses,
    operatingProfit,
    otherIncome,
    otherExpense,
    netProfit,
    netProfitMarginPercent,
    isEstimated: unpostedCount > 0,
    unpostedCount,
  };
};

/**
 * Balance Sheet Generator:
 * ASSETS = LIABILITIES + EQUITY
 */
export const generateBalanceSheet = (
  accounts: Account[],
  currentPeriodNetProfit: number
): BalanceSheetData => {
  const getBal = (code: string) => accounts.find((a) => a.code === code)?.balance || 0;

  const cash = getBal('1000');
  const bank = getBal('1010');
  const mobileMoney = getBal('1020');
  const accountsReceivable = getBal('1030');
  const inventory = getBal('1040');
  const equipment = getBal('1070');
  const totalAssets = roundETB(cash + bank + mobileMoney + accountsReceivable + inventory + equipment);

  const accountsPayable = getBal('2000');
  const taxPayable = getBal('2010');
  const loanPayable = getBal('2020');
  const totalLiabilities = roundETB(accountsPayable + taxPayable + loanPayable);

  const ownerCapital = getBal('3000');
  const retainedEarnings = getBal('3010');
  const ownerDrawings = getBal('3020'); // Drawings reduce equity
  const totalEquity = roundETB(ownerCapital + retainedEarnings + currentPeriodNetProfit - ownerDrawings);

  const liabilitiesPlusEquity = roundETB(totalLiabilities + totalEquity);
  const imbalance = roundETB(Math.abs(totalAssets - liabilitiesPlusEquity));
  const isBalanced = imbalance < 0.05; // Decimal rounding tolerance

  return {
    asOfDate: new Date().toISOString().split('T')[0],
    assets: {
      cash,
      bank,
      mobileMoney,
      accountsReceivable,
      inventory,
      equipment,
      totalAssets,
    },
    liabilities: {
      accountsPayable,
      taxPayable,
      loanPayable,
      totalLiabilities,
    },
    equity: {
      ownerCapital,
      retainedEarnings,
      currentPeriodProfit: currentPeriodNetProfit,
      ownerDrawings,
      totalEquity,
    },
    isBalanced,
    imbalanceAmount: imbalance,
  };
};

/**
 * Trial Balance Report:
 * Confirms that Sum(Debits) === Sum(Credits) across all active accounts
 */
export const generateTrialBalance = (accounts: Account[]) => {
  let totalDebits = 0;
  let totalCredits = 0;

  const rows = accounts.map((acc) => {
    let debit = 0;
    let credit = 0;

    if (acc.normalBalance === 'DEBIT') {
      debit = acc.balance;
      totalDebits += debit;
    } else {
      credit = acc.balance;
      totalCredits += credit;
    }

    return {
      code: acc.code,
      name: acc.name,
      amharicName: acc.amharicName,
      type: acc.accountType,
      debit: roundETB(debit),
      credit: roundETB(credit),
    };
  });

  totalDebits = roundETB(totalDebits);
  totalCredits = roundETB(totalCredits);
  const difference = roundETB(Math.abs(totalDebits - totalCredits));

  return {
    rows,
    totalDebits,
    totalCredits,
    isBalanced: difference < 0.05,
    difference,
  };
};

/**
 * General Ledger Generator:
 * Given journal entries and an account code, computes chronologically running ledger lines
 */
export const generateGeneralLedger = (
  accountCode: string,
  accounts: Account[],
  journalEntries: JournalEntry[]
): { account: Account | undefined; lines: GeneralLedgerLine[]; endingBalance: number } => {
  const account = accounts.find((a) => a.code === accountCode);
  const lines: GeneralLedgerLine[] = [];

  let runningBalance = 0;

  // Collect all journal lines for this account
  const matchingEntries = journalEntries
    .filter((j) => j.status === 'POSTED')
    .sort((a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime());

  matchingEntries.forEach((j) => {
    j.lines
      .filter((l) => l.accountCode === accountCode)
      .forEach((l) => {
        if (account?.normalBalance === 'DEBIT') {
          runningBalance += l.debit - l.credit;
        } else {
          runningBalance += l.credit - l.debit;
        }

        lines.push({
          date: j.transactionDate,
          referenceType: j.referenceType,
          referenceId: j.referenceId,
          journalNumber: j.journalNumber,
          description: l.description,
          debit: l.debit,
          credit: l.credit,
          runningBalance: roundETB(runningBalance),
        });
      });
  });

  return {
    account,
    lines,
    endingBalance: roundETB(runningBalance),
  };
};

/**
 * Accounts Receivable Aging Generator:
 * Buckets customer debts: Current, 1-30, 31-60, 61-90, 90+ days
 */
export const generateReceivablesAging = (debts: CustomerDebt[]): AgingBucket[] => {
  const now = new Date().getTime();

  const buckets: Record<string, { amount: number; count: number }> = {
    CURRENT: { amount: 0, count: 0 },
    DAYS_1_30: { amount: 0, count: 0 },
    DAYS_31_60: { amount: 0, count: 0 },
    DAYS_61_90: { amount: 0, count: 0 },
    DAYS_90_PLUS: { amount: 0, count: 0 },
  };

  debts.forEach((debt) => {
    if (debt.remainingDebt <= 0) return;

    const due = new Date(debt.dueDate).getTime();
    const diffDays = Math.floor((now - due) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      buckets.CURRENT.amount += debt.remainingDebt;
      buckets.CURRENT.count += 1;
    } else if (diffDays <= 30) {
      buckets.DAYS_1_30.amount += debt.remainingDebt;
      buckets.DAYS_1_30.count += 1;
    } else if (diffDays <= 60) {
      buckets.DAYS_31_60.amount += debt.remainingDebt;
      buckets.DAYS_31_60.count += 1;
    } else if (diffDays <= 90) {
      buckets.DAYS_61_90.amount += debt.remainingDebt;
      buckets.DAYS_61_90.count += 1;
    } else {
      buckets.DAYS_90_PLUS.amount += debt.remainingDebt;
      buckets.DAYS_90_PLUS.count += 1;
    }
  });

  return [
    {
      bucket: 'CURRENT',
      labelEn: 'Current (Not due yet)',
      labelAm: 'ወቅታዊ (ቀኑ ያልደረሰ)',
      amount: roundETB(buckets.CURRENT.amount),
      customerCount: buckets.CURRENT.count,
    },
    {
      bucket: 'DAYS_1_30',
      labelEn: '1 – 30 Days Overdue',
      labelAm: '1 – 30 ቀናት ያለፈበት',
      amount: roundETB(buckets.DAYS_1_30.amount),
      customerCount: buckets.DAYS_1_30.count,
    },
    {
      bucket: 'DAYS_31_60',
      labelEn: '31 – 60 Days Overdue',
      labelAm: '31 – 60 ቀናት ያለፈበት',
      amount: roundETB(buckets.DAYS_31_60.amount),
      customerCount: buckets.DAYS_31_60.count,
    },
    {
      bucket: 'DAYS_61_90',
      labelEn: '61 – 90 Days Overdue',
      labelAm: '61 – 90 ቀናት ያለፈበት',
      amount: roundETB(buckets.DAYS_61_90.amount),
      customerCount: buckets.DAYS_61_90.count,
    },
    {
      bucket: 'DAYS_90_PLUS',
      labelEn: '90+ Days (High Risk)',
      labelAm: 'ከ 90 ቀናት በላይ (ከፍተኛ ስጋት)',
      amount: roundETB(buckets.DAYS_90_PLUS.amount),
      customerCount: buckets.DAYS_90_PLUS.count,
    },
  ];
};

/**
 * Cash Flow Statement Generator:
 * Operating, Investing, Financing Activities
 */
export const generateCashFlow = (journalEntries: JournalEntry[]) => {
  let operatingInflows = 0;
  let operatingOutflows = 0;
  let investingOutflows = 0;
  let financingInflows = 0;
  let financingOutflows = 0;

  journalEntries
    .filter((j) => j.status === 'POSTED')
    .forEach((j) => {
      // Find cash lines
      const cashDebit = j.lines
        .filter((l) => ['1000', '1010', '1020'].includes(l.accountCode))
        .reduce((sum, l) => sum + l.debit, 0);

      const cashCredit = j.lines
        .filter((l) => ['1000', '1010', '1020'].includes(l.accountCode))
        .reduce((sum, l) => sum + l.credit, 0);

      if (['SALE', 'CUSTOMER_PAYMENT'].includes(j.referenceType)) {
        operatingInflows += cashDebit;
      } else if (['EXPENSE', 'PURCHASE'].includes(j.referenceType)) {
        operatingOutflows += cashCredit;
      } else if (j.referenceType === 'OWNER_CAPITAL' || j.referenceType === 'LOAN') {
        financingInflows += cashDebit;
      } else if (j.referenceType === 'OWNER_DRAWING') {
        financingOutflows += cashCredit;
      }
    });

  const netOperating = roundETB(operatingInflows - operatingOutflows);
  const netInvesting = roundETB(-investingOutflows);
  const netFinancing = roundETB(financingInflows - financingOutflows);
  const netChange = roundETB(netOperating + netInvesting + netFinancing);

  return {
    operating: {
      inflows: roundETB(operatingInflows),
      outflows: roundETB(operatingOutflows),
      net: netOperating,
    },
    investing: {
      outflows: roundETB(investingOutflows),
      net: netInvesting,
    },
    financing: {
      inflows: roundETB(financingInflows),
      outflows: roundETB(financingOutflows),
      net: netFinancing,
    },
    netChange,
  };
};
