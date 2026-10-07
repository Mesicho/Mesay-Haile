import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CustomerDebt, DebtStatus } from '../../types';
import {
  CreditCard,
  AlertCircle,
  Clock,
  CheckCircle,
  Search,
  DollarSign,
  Send,
  FileText,
  Calendar,
  History,
  Filter,
  ArrowDownLeft,
} from 'lucide-react';
import { StatementModal } from '../common/StatementModal';
import { ReminderModal } from '../common/ReminderModal';

interface DebtManagementHubProps {
  onOpenRecordPayment: (debt?: CustomerDebt) => void;
}

export const DebtManagementHub: React.FC<DebtManagementHubProps> = ({ onOpenRecordPayment }) => {
  const {
    debts,
    customers,
    debtTransactions,
    language,
    editDebtDueDate,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | DebtStatus>('ALL');
  const [selectedStatementCustomer, setSelectedStatementCustomer] = useState<any | null>(null);
  const [selectedReminderDebt, setSelectedReminderDebt] = useState<CustomerDebt | null>(null);
  const [viewHistoryDebtId, setViewHistoryDebtId] = useState<string | null>(null);

  // Edit Due Date Modal State
  const [editingDueDateDebt, setEditingDueDateDebt] = useState<CustomerDebt | null>(null);
  const [newDueDateValue, setNewDueDateValue] = useState('');
  const [dueDateChangeReason, setDueDateChangeReason] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  // Financial KPI calculations
  const totalOutstanding = debts.reduce((acc, d) => acc + d.remainingDebt, 0);
  const overdueDebts = debts.filter((d) => d.status === 'OVERDUE' && d.remainingDebt > 0);
  const overdueAmount = overdueDebts.reduce((acc, d) => acc + d.remainingDebt, 0);
  const dueTodayDebts = debts.filter((d) => d.dueDate === todayStr && d.remainingDebt > 0);
  const dueTodayAmount = dueTodayDebts.reduce((acc, d) => acc + d.remainingDebt, 0);

  // Collected today
  const collectedTodayAmount = debtTransactions
    .filter((tx) => tx.type === 'PAYMENT' && tx.createdAt.startsWith(todayStr))
    .reduce((acc, tx) => acc + tx.amount, 0);

  // Filtered Debt list
  const filteredDebts = debts.filter((d) => {
    if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        d.customerName.toLowerCase().includes(q) ||
        d.customerPhone.includes(q) ||
        (d.invoiceNumber && d.invoiceNumber.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleSaveDueDate = () => {
    if (!editingDueDateDebt || !newDueDateValue) return;
    editDebtDueDate(editingDueDateDebt.id, newDueDateValue, dueDateChangeReason);
    setEditingDueDateDebt(null);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Title & Core Distinction */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-blue-950 rounded-2xl p-5 sm:p-6 text-white border border-red-900/50 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-red-600/30 border border-red-500/40 text-red-400">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  {language === 'am' ? 'የብድርና ዕዳ መቆጣጠሪያ ማዕከል' : 'Credit & Debt Management Hub'}
                </h2>
                <p className="text-xs text-red-200 mt-0.5">
                  {language === 'am'
                    ? 'የማን ዕዳ አለበት? የሚለውን ወሳኝ ጥያቄ በግልጽ ይመልሱ'
                    : 'Track every single credit transaction, partial payment, and overdue balance'}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => onOpenRecordPayment()}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center gap-2"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>{language === 'am' ? '+ የዕዳ ክፍያ ተቀበል' : '+ Record Debt Payment'}</span>
          </button>
        </div>

        {/* TOP DEBT KPI STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800">
          {/* Total Outstanding */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs font-semibold text-slate-400">
              {language === 'am' ? 'ጠቅላላ ያልተከፈለ ዕዳ' : 'Total Outstanding Debt'}
            </span>
            <p className="text-lg sm:text-xl font-bold text-red-400 mt-1 font-mono">
              {totalOutstanding.toLocaleString()} <span className="text-xs text-slate-400">ETB</span>
            </p>
            <span className="text-[10px] text-slate-500">
              {debts.filter((d) => d.remainingDebt > 0).length} {language === 'am' ? 'ደንበኞች' : 'active borrowers'}
            </span>
          </div>

          {/* Overdue Debt */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-red-900/60">
            <span className="text-xs font-semibold text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {language === 'am' ? 'ቀኑ ያለፈበት ዕዳ' : 'Overdue Debt'}
            </span>
            <p className="text-lg sm:text-xl font-bold text-red-500 mt-1 font-mono">
              {overdueAmount.toLocaleString()} <span className="text-xs text-slate-400">ETB</span>
            </p>
            <span className="text-[10px] text-red-400">
              {overdueDebts.length} {language === 'am' ? 'አስቸኳይ ማስታወሻ ያስፈልጋቸዋል' : 'need immediate reminder'}
            </span>
          </div>

          {/* Due Today */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-amber-900/60">
            <span className="text-xs font-semibold text-amber-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {language === 'am' ? 'ዛሬ የሚከፈል' : 'Due Today'}
            </span>
            <p className="text-lg sm:text-xl font-bold text-amber-400 mt-1 font-mono">
              {dueTodayAmount.toLocaleString()} <span className="text-xs text-slate-400">ETB</span>
            </p>
            <span className="text-[10px] text-amber-300">
              {dueTodayDebts.length} {language === 'am' ? 'የዛሬ ቀነ-ቀጠሮ' : 'due today'}
            </span>
          </div>

          {/* Collected Today */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-emerald-900/60">
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              {language === 'am' ? 'ዛሬ የተሰበሰበ' : 'Collected Today'}
            </span>
            <p className="text-lg sm:text-xl font-bold text-emerald-400 mt-1 font-mono">
              {collectedTodayAmount.toLocaleString()} <span className="text-xs text-slate-400">ETB</span>
            </p>
            <span className="text-[10px] text-emerald-300">
              {language === 'am' ? 'ጥሬ ገንዘብ የገባ' : 'Recovered into cash'}
            </span>
          </div>
        </div>
      </div>

      {/* SEARCH & STATUS FILTER BAR */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === 'am'
                ? 'የደንበኛ ስም፣ ስልክ ቁጥር ወይም ደረሰኝ ፈልግ...'
                : 'Search customer name, phone, or invoice...'
            }
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
          {(
            [
              { id: 'ALL', labelAm: 'ሁሉም', labelEn: 'All' },
              { id: 'OVERDUE', labelAm: 'ቀን ያለፈበት', labelEn: 'Overdue' },
              { id: 'UNPAID', labelAm: 'ያልተከፈለ', labelEn: 'Unpaid' },
              { id: 'PARTIALLY_PAID', labelAm: 'በከፊል', labelEn: 'Partially Paid' },
              { id: 'PAID', labelAm: 'የተጠናቀቀ', labelEn: 'Fully Settled' },
            ] as const
          ).map((filter) => (
            <button
              key={filter.id}
              onClick={() => setStatusFilter(filter.id)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition ${
                statusFilter === filter.id
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {language === 'am' ? filter.labelAm : filter.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* DEBTS LIST / CARDS */}
      <div className="space-y-3">
        {filteredDebts.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
            {language === 'am'
              ? 'ምንም የተገኘ የዕዳ መዝገብ የለም።'
              : 'No debt records match your search criteria.'}
          </div>
        ) : (
          filteredDebts.map((debt) => {
            const customerObj = customers.find((c) => c.id === debt.customerId);
            const isOverdue = debt.status === 'OVERDUE';
            const isDueToday = debt.dueDate === todayStr;
            const isSettled = debt.remainingDebt === 0;

            const relatedTransactions = debtTransactions.filter((tx) => tx.debtId === debt.id);

            return (
              <div
                key={debt.id}
                className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-sm transition space-y-3 ${
                  isOverdue
                    ? 'border-red-300 ring-1 ring-red-200'
                    : isDueToday
                    ? 'border-amber-300 ring-1 ring-amber-200'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                        isOverdue
                          ? 'bg-red-100 text-red-700'
                          : isDueToday
                          ? 'bg-amber-100 text-amber-700'
                          : isSettled
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {debt.customerName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm sm:text-base text-slate-900">
                          {debt.customerName}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isOverdue
                              ? 'bg-red-100 text-red-800'
                              : isDueToday
                              ? 'bg-amber-100 text-amber-800'
                              : isSettled
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {debt.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        ስልክ: <strong className="text-slate-700">{debt.customerPhone}</strong> • {debt.invoiceNumber}
                      </p>
                    </div>
                  </div>

                  {/* Remaining Debt Badge */}
                  <div className="text-left sm:text-right">
                    <p className="text-[11px] text-slate-500 uppercase font-semibold">
                      {language === 'am' ? 'ቀሪ ዕዳ' : 'Remaining Balance'}
                    </p>
                    <p
                      className={`text-lg sm:text-xl font-bold font-mono ${
                        isSettled ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {debt.remainingDebt.toLocaleString()} <span className="text-xs">ETB</span>
                    </p>
                  </div>
                </div>

                {/* Numbers Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      {language === 'am' ? 'የመጀመሪያ ዕዳ' : 'Original Debt'}
                    </span>
                    <p className="font-bold text-slate-800 font-mono">
                      {debt.originalDebt.toLocaleString()} ETB
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      {language === 'am' ? 'የተከፈለ' : 'Total Paid'}
                    </span>
                    <p className="font-bold text-emerald-600 font-mono">
                      {debt.totalPaid.toLocaleString()} ETB
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      {language === 'am' ? 'የመክፈያ ቀን' : 'Due Date'}
                    </span>
                    <p
                      className={`font-bold font-mono flex items-center gap-1 ${
                        isOverdue ? 'text-red-600' : 'text-slate-800'
                      }`}
                    >
                      <Calendar className="w-3 h-3" />
                      {new Date(debt.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      {language === 'am' ? 'የመጨረሻ ክፍያ' : 'Last Payment'}
                    </span>
                    <p className="font-medium text-slate-600 font-mono">
                      {debt.lastPaymentDate
                        ? new Date(debt.lastPaymentDate).toLocaleDateString()
                        : '-'}
                    </p>
                  </div>
                </div>

                {/* Immutable Ledger History (Collapsible) */}
                {viewHistoryDebtId === debt.id && (
                  <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs space-y-2 font-mono">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                      <span className="font-bold text-amber-400 flex items-center gap-1">
                        <History className="w-3.5 h-3.5" />
                        {language === 'am' ? 'የዕዳ ታሪክ መዝገብ (የማይሰረዝ)' : 'Immutable Audit Ledger'}
                      </span>
                      <button
                        onClick={() => setViewHistoryDebtId(null)}
                        className="text-[11px] text-slate-400 hover:text-white"
                      >
                        {language === 'am' ? 'ደብቅ' : 'Hide'}
                      </button>
                    </div>
                    {relatedTransactions.length === 0 ? (
                      <p className="text-slate-400">ምንም ዝርዝር የለም</p>
                    ) : (
                      relatedTransactions.map((tx) => (
                        <div key={tx.id} className="flex justify-between items-center py-1 border-b border-slate-800/60">
                          <div>
                            <span className="text-slate-400 text-[10px] block">
                              {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-slate-200">{tx.notes || tx.type}</span>
                            {tx.receivedBy && (
                              <span className="text-[10px] text-slate-400 block">
                                ተቀባይ: {tx.receivedBy}
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <span
                              className={`font-bold ${
                                tx.type === 'CREDIT_SALE' ? 'text-red-400' : 'text-emerald-400'
                              }`}
                            >
                              {tx.type === 'CREDIT_SALE' ? '+' : '-'}
                              {tx.amount.toLocaleString()} ETB
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              ቀሪ: {tx.newBalance.toLocaleString()} ETB
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Actions Row */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setViewHistoryDebtId(viewHistoryDebtId === debt.id ? null : debt.id)
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>{language === 'am' ? 'ታሪክ' : 'History'}</span>
                    </button>

                    <button
                      onClick={() => {
                        if (customerObj) setSelectedStatementCustomer(customerObj);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{language === 'am' ? 'መግለጫ (Statement)' : 'Statement'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setEditingDueDateDebt(debt);
                        setNewDueDateValue(debt.dueDate);
                        setDueDateChangeReason('');
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{language === 'am' ? 'ቀን ቀይር' : 'Edit Date'}</span>
                    </button>
                  </div>

                  <div className="flex gap-2">
                    {!isSettled && (
                      <button
                        onClick={() => setSelectedReminderDebt(debt)}
                        className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold flex items-center gap-1"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{language === 'am' ? 'ማስታወሻ ላክ' : 'Send Reminder'}</span>
                      </button>
                    )}

                    {!isSettled && (
                      <button
                        onClick={() => onOpenRecordPayment(debt)}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>{language === 'am' ? 'ክፍያ ተቀበል' : 'Record Payment'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Statement Modal */}
      {selectedStatementCustomer && (
        <StatementModal
          customer={selectedStatementCustomer}
          onClose={() => setSelectedStatementCustomer(null)}
        />
      )}

      {/* Reminder Modal */}
      {selectedReminderDebt && (
        <ReminderModal
          debt={selectedReminderDebt}
          onClose={() => setSelectedReminderDebt(null)}
        />
      )}

      {/* Edit Due Date Dialog */}
      {editingDueDateDebt && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl">
            <h3 className="font-bold text-sm text-slate-900">
              {language === 'am' ? 'የመክፈያ ቀን ማሻሻያ' : 'Edit Due Date'}
            </h3>
            <p className="text-xs text-slate-500">
              {editingDueDateDebt.customerName} - {language === 'am' ? 'ቀሪ ዕዳ' : 'Balance'}: {editingDueDateDebt.remainingDebt} ETB
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {language === 'am' ? 'አዲስ የመክፈያ ቀን:' : 'New Due Date:'}
              </label>
              <input
                type="date"
                value={newDueDateValue}
                onChange={(e) => setNewDueDateValue(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {language === 'am' ? 'የተቀየረበት ምክንያት (ለኦዲት):' : 'Reason for extension:'}
              </label>
              <input
                type="text"
                value={dueDateChangeReason}
                onChange={(e) => setDueDateChangeReason(e.target.value)}
                placeholder={language === 'am' ? 'ለምሳሌ: በደንበኛው ጥያቄ መሰረት' : 'e.g. Customer request'}
                className="w-full p-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingDueDateDebt(null)}
                className="px-3 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100"
              >
                {language === 'am' ? 'ሰርዝ' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveDueDate}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
              >
                {language === 'am' ? 'አስቀምጥ' : 'Save Date'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
