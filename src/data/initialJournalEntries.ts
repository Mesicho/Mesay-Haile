import { JournalEntry } from '../types/accounting';
import { initialSales, initialPurchases, initialExpenses, initialDebtTransactions } from './initialData';
import {
  createSaleJournalEntry,
  createPurchaseJournalEntry,
  createExpenseJournalEntry,
  createCustomerPaymentJournalEntry,
} from '../accounting/accountingEngine';

export const buildInitialJournalEntries = (): JournalEntry[] => {
  const entries: JournalEntry[] = [];

  // Seed owner capital entry (3000 Capital, 1000 Cash, 1010 Bank, 1070 Equipment)
  entries.push({
    id: 'jrn_opening_equity',
    businessId: 'biz_001',
    branchId: 'br_01',
    referenceType: 'OWNER_CAPITAL',
    referenceId: 'init_capital_01',
    journalNumber: 'JRN-OPEN-001',
    transactionDate: '2026-09-01T08:00:00Z',
    description: 'Owner Initial Capital Contribution & Store Establishment',
    status: 'POSTED',
    lines: [
      {
        id: 'line_open_cash',
        journalEntryId: 'jrn_opening_equity',
        accountId: 'acc_1000',
        accountCode: '1000',
        accountName: 'Cash on Hand',
        accountType: 'ASSET',
        debit: 40000,
        credit: 0,
        currency: 'ETB',
        description: 'Opening Cash on Hand',
        branchId: 'br_01',
        createdAt: '2026-09-01T08:00:00Z',
      },
      {
        id: 'line_open_bank',
        journalEntryId: 'jrn_opening_equity',
        accountId: 'acc_1010',
        accountCode: '1010',
        accountName: 'Bank Account (CBE / Awash)',
        accountType: 'ASSET',
        debit: 145000,
        credit: 0,
        currency: 'ETB',
        description: 'Opening Commercial Bank Deposits',
        branchId: 'br_01',
        createdAt: '2026-09-01T08:00:00Z',
      },
      {
        id: 'line_open_equip',
        journalEntryId: 'jrn_opening_equity',
        accountId: 'acc_1070',
        accountCode: '1070',
        accountName: 'Store Equipment & Assets',
        accountType: 'ASSET',
        debit: 55000,
        credit: 0,
        currency: 'ETB',
        description: 'Initial Shelving and POS equipment',
        branchId: 'br_01',
        createdAt: '2026-09-01T08:00:00Z',
      },
      {
        id: 'line_open_cap',
        journalEntryId: 'jrn_opening_equity',
        accountId: 'acc_3000',
        accountCode: '3000',
        accountName: 'Owner Capital',
        accountType: 'EQUITY',
        debit: 0,
        credit: 240000,
        currency: 'ETB',
        description: 'Abebe Bikila Initial Capital',
        branchId: 'br_01',
        createdAt: '2026-09-01T08:00:00Z',
      },
    ],
    totalDebit: 240000,
    totalCredit: 240000,
    postedAt: '2026-09-01T08:00:00Z',
    postedBy: 'usr_01',
    postedByName: 'አበበ ቢቂላ (Owner)',
    createdAt: '2026-09-01T08:00:00Z',
  });

  // Seed sales
  initialSales.forEach((s) => {
    try {
      const j = createSaleJournalEntry(s, 'usr_03', 'ዳዊት መኮንን (Cashier)');
      entries.push(j);
    } catch (e) {
      // safe fallback
    }
  });

  // Seed purchases
  initialPurchases.forEach((p) => {
    try {
      const j = createPurchaseJournalEntry(p, 'usr_02', 'ዮናስ ታደሰ (Manager)');
      entries.push(j);
    } catch (e) {
      // safe fallback
    }
  });

  // Seed expenses
  initialExpenses.forEach((exp) => {
    try {
      const j = createExpenseJournalEntry(exp, 'usr_02', 'ዮናስ ታደሰ (Manager)');
      entries.push(j);
    } catch (e) {
      // safe fallback
    }
  });

  // Seed customer debt payments
  initialDebtTransactions
    .filter((dtx) => dtx.type === 'PAYMENT')
    .forEach((dtx) => {
      try {
        const j = createCustomerPaymentJournalEntry({
          businessId: dtx.businessId,
          branchId: 'br_01',
          paymentId: dtx.id,
          receiptNumber: dtx.referenceNo || dtx.id.slice(-6),
          amount: dtx.amount,
          paymentMethod: dtx.paymentMethod || 'Cash',
          customerId: dtx.customerId,
          customerName: dtx.customerName,
          userId: 'usr_03',
          userName: dtx.receivedBy,
        });
        entries.push(j);
      } catch (e) {
        // safe fallback
      }
    });

  return entries;
};
