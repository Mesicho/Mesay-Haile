import { Router, Request, Response } from 'express';
import { authenticateTenantUser, requirePermission } from '../middleware/auth';
import { handleIdempotency } from '../middleware/idempotency';
import { ApiSuccessResponse, ApiErrorResponse } from '../types/api';
import securityRouter from './security';
import { authRouter } from './auth';

const router = Router();

// Helper for standard success responses
const sendSuccess = <T>(res: Response, data: T, meta?: any, status = 200) => {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    meta,
    timestamp: new Date().toISOString(),
  };
  return res.status(status).json(response);
};

// ============================================================
// 1. AUTHENTICATION & USER ACCOUNTS (Public & Protected Auth)
// ============================================================
router.use('/auth', authRouter);

// Apply tenant auth middleware across all remaining v1 business API routes
router.use(authenticateTenantUser);

// Mount Security Engine routes
router.use('/security', securityRouter);

// ============================================================
// 2. BUSINESSES & BRANCHES
// ============================================================

router.get('/businesses/profile', requirePermission('settings.view'), (req: Request, res: Response) => {
  return sendSuccess(res, {
    id: req.businessId,
    name: 'Selam Supermarket & Wholesale',
    amharicName: 'ሰላም ሱፐርማርኬት እና የሸቀጥ ንግድ',
    phone: '0911223344',
    city: 'Addis Ababa',
    subCity: 'Bole',
    currency: 'ETB',
    tinNumber: '0054891230',
    plan: 'BUSINESS',
  });
});

router.get('/branches', requirePermission('branches.view'), (req: Request, res: Response) => {
  return sendSuccess(res, [
    { id: 'br_01', name: 'Bole Main Branch', amharicName: 'ቦሌ ዋና ቅርንጫፍ', code: 'BOL-01', isMain: true, active: true },
    { id: 'br_02', name: 'Piassa Branch', amharicName: 'ፒያሳ ቅርንጫፍ', code: 'PIA-02', isMain: false, active: true },
  ]);
});

// ============================================================
// 3. PRODUCTS & BARCODE LOOKUP
// ============================================================

router.get('/products', requirePermission('products.view'), (req: Request, res: Response) => {
  const { barcode, search, category, page = 1, limit = 50 } = req.query;

  // Sample payload respecting tenant isolation
  return sendSuccess(
    res,
    [
      { id: 'prd_01', name: 'Tomoca Coffee 250g', amharicName: 'ቶሞካ ቡና 250ግ', sku: 'TOM-250', barcode: '6001001001', sellingPrice: 480, purchasePrice: 380, quantity: 45, minStock: 15, unit: 'pack' },
      { id: 'prd_05', name: 'Coca-Cola 300ml', amharicName: 'ኮካ ኮላ 300ml', sku: 'COCA-300', barcode: '6001001005', sellingPrice: 35, purchasePrice: 28, quantity: 6, minStock: 24, unit: 'bottle' },
    ],
    { page: Number(page), limit: Number(limit), total: 10 }
  );
});

router.post('/products', requirePermission('products.create'), handleIdempotency, (req: Request, res: Response) => {
  const { name, purchasePrice, sellingPrice, sku } = req.body;
  if (!name || purchasePrice == null || sellingPrice == null) {
    return res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Name, purchasePrice and sellingPrice are required.', message_am: 'የእቃ ስም፣ መግዣና መሸጫ ዋጋ ያስፈልጋል', status: 422 },
      timestamp: new Date().toISOString(),
    });
  }

  return sendSuccess(
    res,
    {
      id: `prd_${Date.now()}`,
      businessId: req.businessId,
      ...req.body,
      createdAt: new Date().toISOString(),
    },
    undefined,
    201
  );
});

// ============================================================
// 4. INVENTORY & STOCK MOVEMENTS
// ============================================================

router.post('/inventory/adjust', requirePermission('inventory.adjust'), handleIdempotency, (req: Request, res: Response) => {
  const { productId, quantityDelta, type, reason } = req.body;
  if (!productId || quantityDelta == null || !reason) {
    return res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'productId, quantityDelta, and reason are required.', message_am: 'የእቃ መለያ፣ የብዛት ለውጥና ምክንያት ያስፈልጋል', status: 422 },
      timestamp: new Date().toISOString(),
    });
  }

  return sendSuccess(
    res,
    {
      transactionId: `itx_${Date.now()}`,
      productId,
      quantityDelta,
      type,
      reason,
      adjustedBy: req.user?.name,
      createdAt: new Date().toISOString(),
    },
    undefined,
    201
  );
});

// ============================================================
// 5. CUSTOMERS & CREDIT LIMITS
// ============================================================

router.get('/customers', requirePermission('customers.view'), (req: Request, res: Response) => {
  return sendSuccess(res, [
    { id: 'cst_01', name: 'አበበ ከበደ (Abebe Kebede)', phone: '0911234567', creditLimit: 10000, currentDebt: 2500, availableCredit: 7500, status: 'ACTIVE' },
    { id: 'cst_02', name: 'ፋጢማ ዑመር (Fatima Omer)', phone: '0922876543', creditLimit: 15000, currentDebt: 4800, availableCredit: 10200, status: 'ACTIVE' },
  ]);
});

router.get('/customers/:id/statement', requirePermission('customers.view'), (req: Request, res: Response) => {
  const { id } = req.params;
  return sendSuccess(res, {
    customerId: id,
    customerName: 'አበበ ከበደ',
    totalPurchased: 24500,
    totalPaid: 22000,
    outstandingBalance: 2500,
    ledger: [
      { date: '2026-10-01', description: 'Credit Sale INV-00101', debit: 4500, credit: 0, balance: 4500 },
      { date: '2026-10-04', description: 'Cash Payment REC-00441', debit: 0, credit: 2000, balance: 2500 },
    ],
  });
});

// ============================================================
// 6. CREDIT & DEBT MANAGEMENT (CORE DIFFERENTIATOR)
// ============================================================

router.get('/debts', requirePermission('debts.view'), (req: Request, res: Response) => {
  return sendSuccess(res, {
    summary: {
      totalOutstandingDebt: 11600,
      dueToday: 1200,
      overdue: 4800,
      collectedToday: 2000,
    },
    debts: [
      { id: 'dbt_01', customerName: 'አበበ ከበደ', phone: '0911234567', original: 4500, paid: 2000, remaining: 2500, dueDate: '2026-10-15', status: 'PARTIALLY_PAID' },
      { id: 'dbt_02', customerName: 'ፋጢማ ዑመር', phone: '0922876543', original: 4800, paid: 0, remaining: 4800, dueDate: '2026-10-01', status: 'OVERDUE' },
      { id: 'dbt_03', customerName: 'ዮናስ አለሙ', phone: '0913998877', original: 1200, paid: 0, remaining: 1200, dueDate: '2026-10-05', status: 'UNPAID' },
    ],
  });
});

router.post('/debts/:id/pay', requirePermission('debts.payment'), handleIdempotency, (req: Request, res: Response) => {
  const { id } = req.params;
  const { amount, paymentMethod, referenceNo, notes } = req.body;

  if (!amount || amount <= 0) {
    return res.status(422).json({
      success: false,
      error: { code: 'INVALID_AMOUNT', message: 'Payment amount must be greater than 0.', message_am: 'የክፍያው መጠን ከ 0 በላይ መሆን አለበት', status: 422 },
      timestamp: new Date().toISOString(),
    });
  }

  const receiptNumber = `REC-DEBT-${Date.now().toString().slice(-5)}`;

  return sendSuccess(res, {
    debtId: id,
    paidAmount: amount,
    paymentMethod: paymentMethod || 'Cash',
    receiptNumber,
    receivedBy: req.user?.name,
    timestamp: new Date().toISOString(),
  });
});

router.post('/debts/:id/reminder', requirePermission('debts.reminder'), (req: Request, res: Response) => {
  const { id } = req.params;
  const { channel, template } = req.body; // SMS, WhatsApp, Telegram

  return sendSuccess(res, {
    debtId: id,
    channel: channel || 'SMS',
    status: 'QUEUED',
    message: 'Reminder queued successfully for delivery.',
    message_am: 'የማስታወሻ መልዕክቱ በተሳካ ሁኔታ ተልኳል',
  });
});

// ============================================================
// 7. SALES & ATOMIC POS CHECKOUT
// ============================================================

router.post('/sales', requirePermission('sales.create'), handleIdempotency, (req: Request, res: Response) => {
  const { items, total, amountPaid, creditAmount, paymentMethod, customerId, splitPayments } = req.body;

  if (!items || !items.length || total == null) {
    return res.status(422).json({
      success: false,
      error: { code: 'EMPTY_CART', message: 'Cart items and total are required.', message_am: 'የሽያጭ እቃዎች ያስፈልጋሉ', status: 422 },
      timestamp: new Date().toISOString(),
    });
  }

  // Credit check
  if (creditAmount > 0 && !customerId) {
    return res.status(422).json({
      success: false,
      error: { code: 'CUSTOMER_REQUIRED_FOR_CREDIT', message: 'Credit sale requires registered customer.', message_am: 'በብድር ለመሸጥ ደንበኛ መመረጥ አለበት', status: 422 },
      timestamp: new Date().toISOString(),
    });
  }

  const invoiceNumber = `INV-${Math.floor(10000 + Math.random() * 90000)}`;

  return sendSuccess(
    res,
    {
      saleId: `sal_${Date.now()}`,
      invoiceNumber,
      total,
      amountPaid: amountPaid || total,
      creditAmount: creditAmount || 0,
      paymentMethod,
      splitPayments,
      cashier: req.user?.name,
      createdAt: new Date().toISOString(),
    },
    undefined,
    201
  );
});

router.post('/sales/:id/reverse', requirePermission('sales.reverse'), (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason) {
    return res.status(422).json({
      success: false,
      error: { code: 'REASON_REQUIRED', message: 'Reversal reason is mandatory for audit trail.', message_am: 'የሽያጭ ስረዛ ምክንያት መገለጽ አለበት', status: 422 },
      timestamp: new Date().toISOString(),
    });
  }

  return sendSuccess(res, {
    saleId: id,
    status: 'REVERSED',
    reversedBy: req.user?.name,
    reason,
    auditLogged: true,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// 8. EXPENSES & APPROVAL WORKFLOW
// ============================================================

router.post('/expenses', requirePermission('expenses.create'), handleIdempotency, (req: Request, res: Response) => {
  const { amount, category, description, paymentMethod } = req.body;
  if (!amount || amount <= 0 || !category) {
    return res.status(422).json({
      success: false,
      error: { code: 'INVALID_EXPENSE', message: 'Valid amount and category required.', message_am: 'ትክክለኛ የወጪ መጠንና ዘርፍ ያስፈልጋል', status: 422 },
      timestamp: new Date().toISOString(),
    });
  }

  return sendSuccess(
    res,
    {
      id: `exp_${Date.now()}`,
      amount,
      category,
      description,
      paymentMethod: paymentMethod || 'Cash',
      recordedBy: req.user?.name,
      status: 'POSTED',
      createdAt: new Date().toISOString(),
    },
    undefined,
    201
  );
});

// ============================================================
// 9. REPORTS & P&L
// ============================================================

router.get('/reports/pnl', requirePermission('reports.financial'), (req: Request, res: Response) => {
  return sendSuccess(res, {
    currency: 'ETB',
    period: 'Current Month',
    grossRevenue: 98500,
    cogs: 72100,
    grossProfit: 26400,
    operatingExpenses: 17050,
    netProfit: 9350,
    cashReceived: 88500,
    creditSales: 10000,
  });
});

// ============================================================
// 10. OFFLINE BATCH SYNCHRONIZATION (PART 7 ARCHITECTURE)
// ============================================================

router.post('/sync/push', handleIdempotency, (req: Request, res: Response) => {
  const { deviceId, events } = req.body;
  if (!events || !Array.isArray(events)) {
    return res.status(422).json({
      success: false,
      error: { code: 'INVALID_SYNC_PAYLOAD', message: 'Events array is required.', message_am: 'የመመሳሰያ ዳታ አልተገኘም', status: 422 },
      timestamp: new Date().toISOString(),
    });
  }

  const processedEvents = events.map((ev: any) => ({
    id: ev.id,
    eventId: ev.eventId || ev.id,
    entityType: ev.entityType,
    status: 'SYNCED',
    committedAt: new Date().toISOString(),
  }));

  return sendSuccess(res, {
    deviceId: deviceId || 'unknown_device',
    syncedCount: processedEvents.length,
    conflicts: [],
    events: processedEvents,
    serverCursor: new Date().toISOString(),
  });
});

router.get('/sync/pull', (req: Request, res: Response) => {
  const { since, branchId } = req.query;

  return sendSuccess(res, {
    since: since || '0',
    currentCursor: new Date().toISOString(),
    changes: {
      products: [],
      debts: [],
      customers: [],
      priceUpdates: [],
    },
    hasMore: false,
  });
});

router.post('/sync/resolve-conflict', (req: Request, res: Response) => {
  const { conflictId, resolutionStrategy, resolvedPayload } = req.body;

  if (!conflictId || !resolutionStrategy) {
    return res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'conflictId and resolutionStrategy are required.', message_am: 'የግጭት መለያና የመፍትሄ ስልት ያስፈልጋል', status: 422 },
      timestamp: new Date().toISOString(),
    });
  }

  return sendSuccess(res, {
    conflictId,
    resolved: true,
    strategyApplied: resolutionStrategy, // 'SERVER_WINS' | 'CLIENT_WINS' | 'MANUAL_MERGE'
    updatedAt: new Date().toISOString(),
  });
});

router.post('/sync/batch', handleIdempotency, (req: Request, res: Response) => {
  const { deviceId, events } = req.body;
  if (!events || !Array.isArray(events)) {
    return res.status(422).json({
      success: false,
      error: { code: 'INVALID_SYNC_PAYLOAD', message: 'Events array is required.', message_am: 'የመመሳሰያ ዳታ አልተገኘም', status: 422 },
      timestamp: new Date().toISOString(),
    });
  }

  const processedEvents = events.map((ev: any) => ({
    id: ev.id,
    entityType: ev.entityType,
    status: 'SYNCED',
    committedAt: new Date().toISOString(),
  }));

  return sendSuccess(res, {
    syncedCount: processedEvents.length,
    conflicts: [],
    events: processedEvents,
  });
});

// ============================================================
// 11. AUDIT LOGS
// ============================================================

router.get('/audit', requirePermission('audit.view'), (req: Request, res: Response) => {
  return sendSuccess(
    res,
    [
      { id: 'aud_01', action: 'SALE_CREATED', actionAm: 'ሽያጭ ተመዝግቧል', userName: 'ዳዊት መኮንን', entityType: 'SALE', entityId: 'sal_201', createdAt: new Date().toISOString() },
      { id: 'aud_02', action: 'PRICE_CHANGE', actionAm: 'የዋጋ ለውጥ', userName: 'አበበ ቢቂላ (Owner)', entityType: 'PRODUCT', entityId: 'prd_03', oldValue: '1,500 ETB', newValue: '1,550 ETB', createdAt: new Date(Date.now() - 7200000).toISOString() },
    ],
    { page: 1, limit: 20, total: 2 }
  );
});

// ============================================================
// 12. ACCOUNTING & DOUBLE-ENTRY FINANCIAL ENGINE (PART 8)
// ============================================================

// 12.1 Chart of Accounts
router.get('/accounting/accounts', requirePermission('reports.view'), (req: Request, res: Response) => {
  return sendSuccess(res, [
    { code: '1000', name: 'Cash on Hand', amharicName: 'በእጅ ያለ ጥሬ ገንዘብ', accountType: 'ASSET', normalBalance: 'DEBIT', balance: 45000 },
    { code: '1010', name: 'Bank Account (CBE / Awash)', amharicName: 'የባንክ ሂሳብ', accountType: 'ASSET', normalBalance: 'DEBIT', balance: 125000 },
    { code: '1020', name: 'Mobile Money (Telebirr)', amharicName: 'የሞባይል ገንዘብ', accountType: 'ASSET', normalBalance: 'DEBIT', balance: 38400 },
    { code: '1030', name: 'Accounts Receivable (Customer Debt)', amharicName: 'ተሰብሳቢ ሂሳብ', accountType: 'ASSET', normalBalance: 'DEBIT', balance: 29500 },
    { code: '1040', name: 'Merchandise Inventory', amharicName: 'የሸቀጥ እቃ ክምችት', accountType: 'ASSET', normalBalance: 'DEBIT', balance: 85200 },
    { code: '1070', name: 'Store Equipment & Assets', amharicName: 'የሱቅ ንብረትና መገልገያዎች', accountType: 'ASSET', normalBalance: 'DEBIT', balance: 55000 },
    { code: '2000', name: 'Accounts Payable (Supplier Debt)', amharicName: 'ተከፋይ ሂሳብ', accountType: 'LIABILITY', normalBalance: 'CREDIT', balance: 34500 },
    { code: '2010', name: 'Tax Payable (VAT / TOT)', amharicName: 'ተከፋይ ግብር/ታክስ', accountType: 'LIABILITY', normalBalance: 'CREDIT', balance: 6200 },
    { code: '2020', name: 'Bank Loan Payable', amharicName: 'የባንክ ብድር ተከፋይ', accountType: 'LIABILITY', normalBalance: 'CREDIT', balance: 40000 },
    { code: '3000', name: 'Owner Capital', amharicName: 'የባለቤቱ ካፒታል', accountType: 'EQUITY', normalBalance: 'CREDIT', balance: 240000 },
    { code: '3010', name: 'Retained Earnings', amharicName: 'ያልተከፋፈለ የተጠራቀመ ትርፍ', accountType: 'EQUITY', normalBalance: 'CREDIT', balance: 42400 },
    { code: '3020', name: 'Owner Drawings', amharicName: 'የባለቤቱ ወጪ ክፍያ (ድርሻ)', accountType: 'EQUITY', normalBalance: 'DEBIT', balance: 15000 },
    { code: '4000', name: 'Product Sales Revenue', amharicName: 'የእቃዎች ሽያጭ ገቢ', accountType: 'REVENUE', normalBalance: 'CREDIT', balance: 98450 },
    { code: '4030', name: 'Sales Returns & Allowances', amharicName: 'የተመለሱ ሽያጮች ቅናሽ', accountType: 'REVENUE', normalBalance: 'DEBIT', balance: 1200 },
    { code: '4040', name: 'Sales Discounts Given', amharicName: 'ለደንበኞች የተሰጡ ቅናሾች', accountType: 'REVENUE', normalBalance: 'DEBIT', balance: 2450 },
    { code: '5000', name: 'Cost of Goods Sold (COGS)', amharicName: 'የተሸጡ እቃዎች የወጣባቸው ወጪ', accountType: 'COGS', normalBalance: 'DEBIT', balance: 62300 },
    { code: '5020', name: 'Inventory Write-off', amharicName: 'የተበላሹ እቃዎች ወጪ', accountType: 'COGS', normalBalance: 'DEBIT', balance: 1400 },
    { code: '6000', name: 'Rent Expense', amharicName: 'የሱቅ ኪራይ ወጪ', accountType: 'EXPENSE', normalBalance: 'DEBIT', balance: 8000 },
    { code: '6040', name: 'Salaries & Wages', amharicName: 'የሰራተኞች ደመወዝ', accountType: 'EXPENSE', normalBalance: 'DEBIT', balance: 6500 },
  ]);
});

router.post('/accounting/accounts', requirePermission('settings.edit'), (req: Request, res: Response) => {
  const { code, name, amharicName, accountType, normalBalance } = req.body;
  if (!code || !name || !accountType) {
    return res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Account code, name and type are required.', message_am: 'የሂሳብ ቁጥር፣ ስምና አይነት ያስፈልጋል', status: 422 },
      timestamp: new Date().toISOString(),
    });
  }

  return sendSuccess(res, {
    id: `acc_${Date.now()}`,
    code,
    name,
    amharicName: amharicName || name,
    accountType,
    normalBalance: normalBalance || (['ASSET', 'COGS', 'EXPENSE'].includes(accountType) ? 'DEBIT' : 'CREDIT'),
    currency: 'ETB',
    isSystemAccount: false,
    isActive: true,
    balance: 0,
  }, undefined, 201);
});

// 12.2 Journal Entries
router.get('/accounting/journal-entries', requirePermission('reports.view'), (req: Request, res: Response) => {
  return sendSuccess(res, [
    {
      id: 'jrn_sal_201',
      journalNumber: 'JRN-INV-00201',
      transactionDate: '2026-10-05T09:30:00Z',
      referenceType: 'SALE',
      referenceId: 'sal_201',
      description: 'POS Sale #INV-00201 (ትዕግስት ኃይሌ)',
      status: 'POSTED',
      totalDebit: 8180,
      totalCredit: 8180,
      postedBy: 'ዳዊት መኮንን',
      lines: [
        { accountCode: '1020', accountName: 'Mobile Money', debit: 4500, credit: 0 },
        { accountCode: '4040', accountName: 'Sales Discounts', debit: 100, credit: 0 },
        { accountCode: '4000', accountName: 'Sales Revenue', debit: 0, credit: 4600 },
        { accountCode: '5000', accountName: 'COGS', debit: 3580, credit: 0 },
        { accountCode: '1040', accountName: 'Inventory', debit: 0, credit: 3580 },
      ],
    },
  ]);
});

router.post('/accounting/journal-entries/:id/reverse', requirePermission('accounting.reverse'), (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason) {
    return res.status(422).json({
      success: false,
      error: { code: 'REVERSAL_REASON_REQUIRED', message: 'Reversal reason is required.', message_am: 'የመቀልበሻ ምክንያት ያስፈልጋል', status: 422 },
      timestamp: new Date().toISOString(),
    });
  }

  return sendSuccess(res, {
    originalEntryId: id,
    reversalEntryId: `jrn_rev_${Date.now()}`,
    reversedAt: new Date().toISOString(),
    reason,
    status: 'REVERSED',
  });
});

// 12.3 Financial Reports
router.get('/accounting/profit-loss', requirePermission('reports.view'), (req: Request, res: Response) => {
  const grossSales = 98450;
  const salesDiscounts = 2450;
  const salesReturns = 1200;
  const netSales = grossSales - salesDiscounts - salesReturns; // 94,800
  const cogs = 63700;
  const grossProfit = netSales - cogs; // 31,100
  const operatingExpenses = 18700;
  const operatingProfit = grossProfit - operatingExpenses; // 12,400
  const otherIncome = 250;
  const netProfit = operatingProfit + otherIncome; // 12,650

  return sendSuccess(res, {
    period: 'Current Period (October 2026)',
    currency: 'ETB',
    grossSales,
    salesDiscounts,
    salesReturns,
    netSales,
    costOfGoodsSold: cogs,
    grossProfit,
    grossMarginPercent: 32.8,
    operatingExpenses,
    operatingProfit,
    otherIncome,
    netProfit,
    netProfitMarginPercent: 13.3,
    isEstimated: false,
  });
});

router.get('/accounting/balance-sheet', requirePermission('reports.view'), (req: Request, res: Response) => {
  const assets = {
    cash: 45000,
    bank: 125000,
    mobileMoney: 38400,
    accountsReceivable: 29500,
    inventory: 85200,
    equipment: 55000,
    totalAssets: 378100,
  };

  const liabilities = {
    accountsPayable: 34500,
    taxPayable: 6200,
    loanPayable: 40000,
    totalLiabilities: 80700,
  };

  const equity = {
    ownerCapital: 240000,
    retainedEarnings: 42400,
    currentPeriodProfit: 30000,
    ownerDrawings: 15000,
    totalEquity: 297400,
  };

  return sendSuccess(res, {
    asOfDate: new Date().toISOString().split('T')[0],
    assets,
    liabilities,
    equity,
    isBalanced: assets.totalAssets === liabilities.totalLiabilities + equity.totalEquity,
    checkEquation: `${assets.totalAssets} = ${liabilities.totalLiabilities} + ${equity.totalEquity}`,
  });
});

router.get('/accounting/trial-balance', requirePermission('reports.view'), (req: Request, res: Response) => {
  return sendSuccess(res, {
    totalDebits: 378100,
    totalCredits: 378100,
    isBalanced: true,
    difference: 0,
    status: 'BALANCED',
  });
});

router.get('/accounting/receivables', requirePermission('debt.view'), (req: Request, res: Response) => {
  return sendSuccess(res, {
    totalReceivable: 29500,
    aging: [
      { bucket: 'CURRENT', label: 'Current (0-15 days)', amount: 12000, count: 4 },
      { bucket: 'DAYS_16_30', label: '16-30 days', amount: 8500, count: 3 },
      { bucket: 'DAYS_31_60', label: '31-60 days', amount: 5500, count: 2 },
      { bucket: 'DAYS_60_PLUS', label: '60+ days (High Risk)', amount: 3500, count: 1 },
    ],
  });
});

router.get('/accounting/payables', requirePermission('reports.view'), (req: Request, res: Response) => {
  return sendSuccess(res, {
    totalPayable: 34500,
    aging: [
      { bucket: 'CURRENT', label: 'Current (0-15 days)', amount: 20000, count: 2 },
      { bucket: 'DAYS_16_30', label: '16-30 days', amount: 14500, count: 1 },
    ],
  });
});

router.get('/accounting/periods', requirePermission('reports.view'), (req: Request, res: Response) => {
  return sendSuccess(res, [
    { id: 'per_2026_10', periodName: 'ጥቅምት 2019 / October 2026', startDate: '2026-10-01', endDate: '2026-10-31', status: 'OPEN' },
    { id: 'per_2026_09', periodName: 'መስከረም 2019 / September 2026', startDate: '2026-09-01', endDate: '2026-09-30', status: 'CLOSED', closedAt: '2026-10-01T00:00:00Z', closedBy: 'አበበ ቢቂላ (Owner)' },
  ]);
});

router.post('/accounting/periods/:id/close', requirePermission('accounting.close'), (req: Request, res: Response) => {
  const { id } = req.params;
  return sendSuccess(res, {
    periodId: id,
    status: 'CLOSED',
    closedAt: new Date().toISOString(),
    closedBy: req.user?.name || 'Authorized Accountant',
  });
});

export default router;
