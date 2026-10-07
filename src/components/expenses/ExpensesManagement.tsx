import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Expense, ExpenseCategory } from '../../types';
import { TrendingDown, Plus, Search, Calendar, Tag, DollarSign } from 'lucide-react';

interface ExpensesManagementProps {
  onOpenAddExpense: () => void;
}

export const ExpensesManagement: React.FC<ExpensesManagementProps> = ({ onOpenAddExpense }) => {
  const { expenses, language } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTotal = expenses
    .filter((e) => e.createdAt.startsWith(todayStr))
    .reduce((acc, e) => acc + e.amount, 0);

  const totalAllTime = expenses.reduce((acc, e) => acc + e.amount, 0);

  const filtered = expenses.filter((e) => {
    if (selectedCategory !== 'all' && e.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-slate-900 rounded-2xl p-5 text-white border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {language === 'am' ? 'የንግድ ወጪዎች መቆጣጠሪያ' : 'Expense Management'}
            </h2>
            <p className="text-xs text-slate-400">
              {language === 'am'
                ? 'ኪራይ፣ ደመወዝ፣ መብራትና ሌሎች የስራ ማስኬጃ ወጪዎችን ይቆጣጠሩ'
                : 'Track store rent, electricity, salaries, and operating expenses'}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenAddExpense}
          className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'am' ? '+ አዲስ ወጪ መዝግብ' : '+ Record Expense'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-slate-500 block font-medium">
            {language === 'am' ? 'የዛሬ ወጪዎች' : "Today's Expenses"}
          </span>
          <p className="text-xl font-bold text-red-600 mt-1 font-mono">
            {todayTotal.toLocaleString()} <span className="text-xs text-slate-500">ETB</span>
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-slate-500 block font-medium">
            {language === 'am' ? 'የወሩ ጠቅላላ ወጪ' : 'Monthly Expenses'}
          </span>
          <p className="text-xl font-bold text-slate-900 mt-1 font-mono">
            {totalAllTime.toLocaleString()} <span className="text-xs text-slate-500">ETB</span>
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm col-span-2 md:col-span-1">
          <span className="text-slate-500 block font-medium">
            {language === 'am' ? 'የተመዘገቡ ወጪዎች ብዛት' : 'Total Expense Entries'}
          </span>
          <p className="text-xl font-bold text-slate-900 mt-1 font-mono">
            {expenses.length} <span className="text-xs text-slate-500">entries</span>
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">{language === 'am' ? 'ቀን' : 'Date'}</th>
              <th className="py-3 px-3">{language === 'am' ? 'ዘርፍ / Category' : 'Category'}</th>
              <th className="py-3 px-3">{language === 'am' ? 'ማብራሪያ' : 'Description'}</th>
              <th className="py-3 px-3">{language === 'am' ? 'የክፍያ ዘዴ' : 'Method'}</th>
              <th className="py-3 px-3">{language === 'am' ? 'መዝጋቢ' : 'Recorded By'}</th>
              <th className="py-3 px-4 text-right">{language === 'am' ? 'መጠን' : 'Amount'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50">
                <td className="py-3 px-4 font-mono text-slate-600">
                  {new Date(e.createdAt).toLocaleDateString()}
                </td>
                <td className="py-3 px-3 font-semibold text-slate-800">
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px]">
                    {e.category}
                  </span>
                </td>
                <td className="py-3 px-3 text-slate-700">{e.description}</td>
                <td className="py-3 px-3 text-slate-500">{e.paymentMethod}</td>
                <td className="py-3 px-3 text-slate-500">{e.recordedBy}</td>
                <td className="py-3 px-4 text-right font-bold text-red-600 font-mono">
                  -{e.amount.toLocaleString()} ETB
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
