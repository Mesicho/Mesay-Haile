import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sale } from '../../types';
import { ShoppingBag, Search, Filter, Receipt, Calendar } from 'lucide-react';
import { ReceiptModal } from '../common/ReceiptModal';

export const SalesHistoryView: React.FC = () => {
  const { sales, language, currentBranchId } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const filtered = sales.filter((s) => {
    if (currentBranchId !== 'all' && s.branchId !== currentBranchId) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        s.invoiceNumber.toLowerCase().includes(q) ||
        (s.customerName && s.customerName.toLowerCase().includes(q)) ||
        s.paymentMethod.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-slate-900 rounded-2xl p-5 text-white border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {language === 'am' ? 'የሽያጭ ታሪክ መዝገብ' : 'Sales Transaction History'}
            </h2>
            <p className="text-xs text-slate-400">
              {language === 'am'
                ? 'የተከናወኑ የካሽና የብድር ሽያጮች ዝርዝር እና የዲጂታል ደረሰኞች መዝገብ'
                : 'Immutable audit log of all completed cash and credit sales'}
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === 'am'
                ? 'በደረሰኝ ቁጥር፣ ደንበኛ ወይም የክፍያ ዘዴ ፈልግ...'
                : 'Search by invoice number, customer, or payment method...'
            }
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">{language === 'am' ? 'ደረሰኝ #' : 'Invoice #'}</th>
                <th className="py-3 px-3">{language === 'am' ? 'ደንበኛ' : 'Customer'}</th>
                <th className="py-3 px-3">{language === 'am' ? 'የእቃዎች ብዛት' : 'Items'}</th>
                <th className="py-3 px-3 text-right">{language === 'am' ? 'ጠቅላላ ዋጋ' : 'Total'}</th>
                <th className="py-3 px-3 text-right">{language === 'am' ? 'የተከፈለ' : 'Paid'}</th>
                <th className="py-3 px-3 text-right">{language === 'am' ? 'ዕዳ' : 'Credit'}</th>
                <th className="py-3 px-3">{language === 'am' ? 'የክፍያ ዘዴ' : 'Method'}</th>
                <th className="py-3 px-3">{language === 'am' ? 'ቀንና ሰዓት' : 'Date & Time'}</th>
                <th className="py-3 px-4 text-right">{language === 'am' ? 'ደረሰኝ' : 'Receipt'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{sale.invoiceNumber}</td>
                  <td className="py-3 px-3 font-semibold text-slate-800">
                    {sale.customerName || (language === 'am' ? 'የመንገድ ደንበኛ' : 'Walk-in')}
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    {sale.items.reduce((a, b) => a + b.quantity, 0)} {language === 'am' ? 'እቃዎች' : 'items'}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                    {sale.total.toLocaleString()} ETB
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-600 font-semibold">
                    {sale.amountPaid.toLocaleString()} ETB
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-red-600 font-semibold">
                    {sale.creditAmount > 0 ? `${sale.creditAmount.toLocaleString()} ETB` : '-'}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">
                      {sale.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">
                    <div>{new Date(sale.createdAt).toLocaleDateString()}</div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedSale(sale)}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-1 ml-auto"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>{language === 'am' ? 'እይ' : 'View'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedSale && (
        <ReceiptModal
          sale={selectedSale}
          onClose={() => setSelectedSale(null)}
        />
      )}
    </div>
  );
};
