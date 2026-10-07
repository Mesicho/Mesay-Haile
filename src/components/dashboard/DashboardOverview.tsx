import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ActiveTab } from '../common/MobileBottomNav';
import {
  TrendingUp,
  CreditCard,
  AlertTriangle,
  Package,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Sparkles,
  ShoppingBag,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { CustomerDebt, Product, Sale } from '../../types';
import { ReminderModal } from '../common/ReminderModal';
import { ReceiptModal } from '../common/ReceiptModal';
import { DailySalesGoalWidget } from './DailySalesGoalWidget';

interface DashboardOverviewProps {
  setActiveTab: (tab: ActiveTab) => void;
  onOpenQuickSale: () => void;
  onOpenAddCustomer: () => void;
  onOpenRecordPayment: (debt?: CustomerDebt) => void;
  onOpenAddProduct: () => void;
  onOpenAddExpense: () => void;
  onOpenRecordPurchase: () => void;
  onOpenAssistant: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  setActiveTab,
  onOpenQuickSale,
  onOpenAddCustomer,
  onOpenRecordPayment,
  onOpenAddProduct,
  onOpenAddExpense,
  onOpenRecordPurchase,
  onOpenAssistant,
}) => {
  const {
    business,
    currentUser,
    language,
    sales,
    expenses,
    debts,
    products,
    currentBranchId,
  } = useApp();

  const [selectedDebtForReminder, setSelectedDebtForReminder] = useState<CustomerDebt | null>(null);
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);

  // Time based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (language === 'am') {
      if (hour < 12) return 'እንደምን አደሩ';
      if (hour < 17) return 'እንደምን ዋሉ';
      return 'እንደምን አመሹ';
    } else {
      if (hour < 12) return 'Good morning';
      if (hour < 17) return 'Good afternoon';
      return 'Good evening';
    }
  };

  // Branch filtered records
  const filteredSales =
    currentBranchId === 'all'
      ? sales
      : sales.filter((s) => s.branchId === currentBranchId);

  const filteredExpenses =
    currentBranchId === 'all'
      ? expenses
      : expenses.filter((e) => e.branchId === currentBranchId);

  // Financial aggregates
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySalesList = filteredSales.filter((s) => s.createdAt.startsWith(todayStr));

  const todaySalesTotal = todaySalesList.reduce((acc, s) => acc + s.total, 0);
  const todayCashReceived = todaySalesList.reduce((acc, s) => acc + s.amountPaid, 0);
  const todayCreditSales = todaySalesList.reduce((acc, s) => acc + s.creditAmount, 0);
  const todayCOGS = todaySalesList.reduce((acc, s) => acc + (s.costOfGoodsSold || 0), 0);
  const todayGrossProfit = todaySalesTotal - todayCOGS;

  const todayExpensesList = filteredExpenses.filter((e) => e.createdAt.startsWith(todayStr));
  const todayExpensesTotal = todayExpensesList.reduce((acc, e) => acc + e.amount, 0);
  const todayNetProfit = todayGrossProfit - todayExpensesTotal;

  // Outstanding Debts
  const totalOutstandingDebt = debts.reduce((acc, d) => acc + d.remainingDebt, 0);
  const overdueDebts = debts.filter((d) => d.status === 'OVERDUE' && d.remainingDebt > 0);
  const overdueAmount = overdueDebts.reduce((acc, d) => acc + d.remainingDebt, 0);
  const dueTodayDebts = debts.filter((d) => d.dueDate === todayStr && d.remainingDebt > 0);
  const dueTodayAmount = dueTodayDebts.reduce((acc, d) => acc + d.remainingDebt, 0);

  // Low stock
  const lowStockProducts = products.filter((p) => p.quantity <= p.minStock);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-4 sm:p-6 text-white shadow-lg border border-slate-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">👋</span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {getGreeting()}, {currentUser.name.split(' ')[0]}!
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 flex items-center gap-2">
              <span className="font-semibold text-amber-400">
                {business.amharicName || business.name}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">
                {language === 'am' ? 'የንግድ ቁጥጥር ማዕከል' : 'Business Control Center'}
              </span>
            </p>
          </div>

          {/* Slogan Pill */}
          <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
            {language === 'am'
              ? '“ንግድዎን በደብተር ሳይሆን በአንድ ስርዓት ያስተዳድሩ!”'
              : '“Manage your business with a system, not a notebook!”'}
          </div>
        </div>

        {/* 4 CORE QUESTIONS BANNER (The Core Differentiator) */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <p className="text-[11px] uppercase tracking-wider text-amber-400 font-bold mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {language === 'am' ? 'የዛሬ 4 ወሳኝ ጥያቄዎች መልስ' : 'TODAY: 4 ESSENTIAL BUSINESS ANSWERS'}
            </span>
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Question 1: ስንት ሸጥኩ? */}
            <div className="bg-slate-800/70 backdrop-blur-md p-3.5 rounded-xl border border-slate-700/80 hover:border-blue-500 transition">
              <span className="text-xs font-semibold text-slate-300 block">
                {language === 'am' ? '💰 ስንት ሸጥኩ?' : "💰 How much did I sell?"}
              </span>
              <p className="text-lg sm:text-xl font-bold text-white mt-1 font-mono">
                {todaySalesTotal.toLocaleString()} <span className="text-xs font-normal text-amber-400">ETB</span>
              </p>
              <span className="text-[10px] text-slate-400">
                {todaySalesList.length} {language === 'am' ? 'ሽያጮች ዛሬ' : 'transactions today'}
              </span>
            </div>

            {/* Question 2: ስንት አተረፍኩ? */}
            <div className="bg-slate-800/70 backdrop-blur-md p-3.5 rounded-xl border border-slate-700/80 hover:border-emerald-500 transition">
              <span className="text-xs font-semibold text-slate-300 block">
                {language === 'am' ? '📈 ስንት አተረፍኩ?' : "📈 How much did I profit?"}
              </span>
              <p className="text-lg sm:text-xl font-bold text-emerald-400 mt-1 font-mono">
                {todayNetProfit.toLocaleString()} <span className="text-xs font-normal text-amber-400">ETB</span>
              </p>
              <span className="text-[10px] text-slate-400">
                Gross: {todayGrossProfit.toLocaleString()} ETB
              </span>
            </div>

            {/* Question 3: ማን ዕዳ አለበት? */}
            <div
              onClick={() => setActiveTab('debt')}
              className="bg-slate-800/70 backdrop-blur-md p-3.5 rounded-xl border border-slate-700/80 hover:border-red-500 transition cursor-pointer group"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-300">
                  {language === 'am' ? '💳 ማን ዕዳ አለበት?' : '💳 Who owes debt?'}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-400 transition" />
              </div>
              <p className="text-lg sm:text-xl font-bold text-red-400 mt-1 font-mono">
                {totalOutstandingDebt.toLocaleString()} <span className="text-xs font-normal text-amber-400">ETB</span>
              </p>
              <span className="text-[10px] text-red-300/90 font-medium">
                {overdueDebts.length > 0
                  ? (language === 'am' ? `${overdueDebts.length} ደንበኛ ቀን ያለፈበት!` : `${overdueDebts.length} overdue!`)
                  : (language === 'am' ? 'ቀን ያለፈበት የለም' : 'No overdue')}
              </span>
            </div>

            {/* Question 4: ምን እቃ ሊያልቅ ነው? */}
            <div
              onClick={() => setActiveTab('inventory')}
              className="bg-slate-800/70 backdrop-blur-md p-3.5 rounded-xl border border-slate-700/80 hover:border-amber-500 transition cursor-pointer group"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-300">
                  {language === 'am' ? '📦 ምን እቃ ሊያልቅ ነው?' : '📦 Low stock items?'}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 transition" />
              </div>
              <p className="text-lg sm:text-xl font-bold text-amber-400 mt-1 font-mono">
                {lowStockProducts.length}{' '}
                <span className="text-xs font-normal text-slate-300">
                  {language === 'am' ? 'እቃዎች' : 'items'}
                </span>
              </p>
              <span className="text-[10px] text-amber-300/80">
                {language === 'am' ? 'እንደገና ማዘዝ ያስፈልጋል' : 'Reorder recommended'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS ROW */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
          {language === 'am' ? 'ፈጣን ተግባራት' : 'Quick Actions'}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          <button
            onClick={onOpenQuickSale}
            className="flex items-center gap-2 p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition active:scale-95 justify-center"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{language === 'am' ? 'አዲስ ሽያጭ' : 'New Sale'}</span>
          </button>
          <button
            onClick={onOpenAddCustomer}
            className="flex items-center gap-2 p-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-medium text-xs border border-slate-700 shadow-sm transition active:scale-95 justify-center"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>{language === 'am' ? 'አዲስ ደንበኛ' : 'Add Customer'}</span>
          </button>
          <button
            onClick={() => onOpenRecordPayment()}
            className="flex items-center gap-2 p-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-medium text-xs border border-slate-700 shadow-sm transition active:scale-95 justify-center"
          >
            <CreditCard className="w-4 h-4 text-amber-400" />
            <span>{language === 'am' ? 'የዕዳ ክፍያ' : 'Record Payment'}</span>
          </button>
          <button
            onClick={onOpenAddProduct}
            className="flex items-center gap-2 p-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-medium text-xs border border-slate-700 shadow-sm transition active:scale-95 justify-center"
          >
            <Package className="w-4 h-4 text-purple-400" />
            <span>{language === 'am' ? 'እቃ መዝግብ' : 'Add Product'}</span>
          </button>
          <button
            onClick={onOpenAddExpense}
            className="flex items-center gap-2 p-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-medium text-xs border border-slate-700 shadow-sm transition active:scale-95 justify-center"
          >
            <ArrowDownRight className="w-4 h-4 text-red-400" />
            <span>{language === 'am' ? 'ወጪ መዝግብ' : 'Add Expense'}</span>
          </button>
          <button
            onClick={onOpenRecordPurchase}
            className="flex items-center gap-2 p-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-medium text-xs border border-slate-700 shadow-sm transition active:scale-95 justify-center"
          >
            <ArrowUpRight className="w-4 h-4 text-cyan-400" />
            <span>{language === 'am' ? 'ግዢ መዝግብ' : 'Record Purchase'}</span>
          </button>
        </div>
      </div>

      {/* DAILY SALES GOAL WIDGET */}
      <DailySalesGoalWidget
        todaySalesTotal={todaySalesTotal}
        language={language}
      />

      {/* DETAILED KPI METRIC CARDS */}
      <div>
        <div className="flex justify-between items-center mb-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {language === 'am' ? 'የዛሬ የፋይናንስ ሁኔታ' : "Today's Financial Status"}
          </h3>
          <span className="text-[11px] text-slate-500">
            {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Cash Received */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-500">
              {language === 'am' ? 'ጥሬ ገንዘብ የተሰበሰበ' : 'Cash Received'}
            </span>
            <p className="text-lg font-bold text-slate-900 mt-1 font-mono">
              {todayCashReceived.toLocaleString()} <span className="text-xs font-normal text-slate-500">ETB</span>
            </p>
            <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" />
              {language === 'am' ? 'በካሽ/ቴሌብር የገባ' : 'Direct collection'}
            </span>
          </div>

          {/* Credit Sales */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-500">
              {language === 'am' ? 'የብድር ሽያጭ' : 'Credit Sales'}
            </span>
            <p className="text-lg font-bold text-slate-900 mt-1 font-mono">
              {todayCreditSales.toLocaleString()} <span className="text-xs font-normal text-slate-500">ETB</span>
            </p>
            <span className="text-[10px] text-amber-600 font-medium">
              {language === 'am' ? 'ወደ ዕዳ የተመዘገበ' : 'Added to customer debts'}
            </span>
          </div>

          {/* Today's Expenses */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-500">
              {language === 'am' ? 'የዛሬ ወጪዎች' : "Today's Expenses"}
            </span>
            <p className="text-lg font-bold text-red-600 mt-1 font-mono">
              {todayExpensesTotal.toLocaleString()} <span className="text-xs font-normal text-slate-500">ETB</span>
            </p>
            <span className="text-[10px] text-slate-400">
              {todayExpensesList.length} {language === 'am' ? 'የተመዘገቡ ወጪዎች' : 'items recorded'}
            </span>
          </div>

          {/* Estimated Net Profit */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-500">
              {language === 'am' ? 'የተጣራ ትርፍ (Net Profit)' : 'Estimated Net Profit'}
            </span>
            <p className="text-lg font-bold text-emerald-600 mt-1 font-mono">
              {todayNetProfit.toLocaleString()} <span className="text-xs font-normal text-slate-500">ETB</span>
            </p>
            <span className="text-[10px] text-slate-500">
              Gross: {todayGrossProfit.toLocaleString()} - Exp: {todayExpensesTotal.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* TWO COLUMN GRID: DEBT ALERTS & LOW STOCK */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OVERDUE & DUE DEBT ALERT CARD */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <h3 className="font-bold text-sm text-slate-900">
                  {language === 'am' ? 'የዕዳ ማስጠንቀቂያና ክትትል' : 'Debt Attention & Reminders'}
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('debt')}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
              >
                {language === 'am' ? 'ሁሉንም እይ' : 'View All'} →
              </button>
            </div>

            <div className="space-y-2.5">
              {overdueDebts.length === 0 && dueTodayDebts.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-xs bg-slate-50 rounded-xl">
                  {language === 'am' ? 'ዛሬ ወይም ቀኑ ያለፈበት አጣዳፊ ዕዳ የለም 🎉' : 'No overdue or due-today debts! 🎉'}
                </div>
              ) : (
                <>
                  {overdueDebts.map((debt) => (
                    <div
                      key={debt.id}
                      className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-red-900">{debt.customerName}</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-red-200 text-red-800 font-semibold">
                            {language === 'am' ? 'ቀን አልፏል' : 'OVERDUE'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          {debt.customerPhone} • ቀኑ: {new Date(debt.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-red-700 font-mono">
                          {debt.remainingDebt.toLocaleString()} ETB
                        </p>
                        <div className="flex gap-1.5 mt-1 justify-end">
                          <button
                            onClick={() => setSelectedDebtForReminder(debt)}
                            className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-semibold flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            <span>{language === 'am' ? 'ማስታወሻ' : 'Remind'}</span>
                          </button>
                          <button
                            onClick={() => onOpenRecordPayment(debt)}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-semibold"
                          >
                            {language === 'am' ? 'ክፍያ' : 'Pay'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {dueTodayDebts.map((debt) => (
                    <div
                      key={debt.id}
                      className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-amber-900">{debt.customerName}</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-200 text-amber-800 font-semibold">
                            {language === 'am' ? 'ዛሬ የሚከፈል' : 'DUE TODAY'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">{debt.customerPhone}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-amber-800 font-mono">
                          {debt.remainingDebt.toLocaleString()} ETB
                        </p>
                        <div className="flex gap-1.5 mt-1 justify-end">
                          <button
                            onClick={() => setSelectedDebtForReminder(debt)}
                            className="px-2 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold"
                          >
                            {language === 'am' ? 'ማስታወሻ' : 'Remind'}
                          </button>
                          <button
                            onClick={() => onOpenRecordPayment(debt)}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-semibold"
                          >
                            {language === 'am' ? 'ክፍያ' : 'Pay'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">
              {language === 'am' ? 'ጠቅላላ ያልተሰበሰበ የደንበኞች ዕዳ:' : 'Total Outstanding Debt:'}
            </span>
            <span className="font-bold text-red-600 text-sm font-mono">
              {totalOutstandingDebt.toLocaleString()} ETB
            </span>
          </div>
        </div>

        {/* LOW STOCK ALERTS */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-sm text-slate-900">
                  {language === 'am' ? 'ሊያልቁ የተቃረቡ እቃዎች (Low Stock)' : 'Low Stock Items Alert'}
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('inventory')}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
              >
                {language === 'am' ? 'ሁሉንም እይ' : 'View All'} →
              </button>
            </div>

            <div className="space-y-2">
              {lowStockProducts.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-xs bg-slate-50 rounded-xl">
                  {language === 'am' ? 'ሁሉም እቃዎች በቂ ክምችት አላቸው 👍' : 'All items have healthy stock levels 👍'}
                </div>
              ) : (
                lowStockProducts.slice(0, 4).map((prod) => (
                  <div
                    key={prod.id}
                    className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-xs text-slate-900">
                        {language === 'am' && prod.amharicName ? prod.amharicName : prod.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        SKU: {prod.sku} • {language === 'am' ? 'የመሸጫ ዋጋ' : 'Price'}: {prod.sellingPrice} ETB
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="inline-block px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                        {prod.quantity} {prod.unit}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Min: {prod.minStock} {prod.unit}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
            <span className="text-xs text-slate-500">
              {language === 'am' ? 'አስቸኳይ ግዢ ይመከራል' : 'Reorder recommended'}
            </span>
            <button
              onClick={onOpenRecordPurchase}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition"
            >
              + {language === 'am' ? 'ግዢ መዝግብ' : 'Record Purchase'}
            </button>
          </div>
        </div>
      </div>

      {/* RECENT SALES TRANSACTIONS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">
              {language === 'am' ? 'የቅርብ ጊዜ ሽያጮች' : 'Recent Transactions'}
            </h3>
          </div>
          <button
            onClick={() => setActiveTab('sales')}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
          >
            {language === 'am' ? 'ሙሉ ታሪክ' : 'Full History'} →
          </button>
        </div>

        <div className="divide-y divide-slate-100 overflow-x-auto">
          {filteredSales.slice(0, 5).map((sale) => (
            <div
              key={sale.id}
              className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-lg transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                  {sale.paymentMethod.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{sale.invoiceNumber}</span>
                    <span className="text-[11px] text-slate-500">• {sale.customerName || 'Walk-in'}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {sale.items.length} items • {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Cashier: {sale.cashierName}
                  </p>
                </div>
              </div>

              <div className="text-right flex items-center gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-900 font-mono">
                    {sale.total.toLocaleString()} ETB
                  </p>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                    {sale.paymentMethod}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedSaleForReceipt(sale)}
                  className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
                >
                  {language === 'am' ? 'ደረሰኝ' : 'Receipt'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reminder Modal */}
      {selectedDebtForReminder && (
        <ReminderModal
          debt={selectedDebtForReminder}
          onClose={() => setSelectedDebtForReminder(null)}
        />
      )}

      {/* Receipt Modal */}
      {selectedSaleForReceipt && (
        <ReceiptModal
          sale={selectedSaleForReceipt}
          onClose={() => setSelectedSaleForReceipt(null)}
        />
      )}
    </div>
  );
};
