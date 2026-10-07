import React from 'react';
import { useApp } from '../../context/AppContext';
import { Customer } from '../../types';
import { Printer, Download, Share2, X, FileText } from 'lucide-react';

interface StatementModalProps {
  customer: Customer;
  onClose: () => void;
}

export const StatementModal: React.FC<StatementModalProps> = ({ customer, onClose }) => {
  const { business, debtTransactions, language } = useApp();

  const transactions = debtTransactions
    .filter((tx) => tx.customerId === customer.id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <span className="font-semibold text-sm">
              {language === 'am' ? 'የደንበኛ የሂሳብ መግለጫ (Customer Statement)' : 'Customer Statement of Account'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">{language === 'am' ? 'አትም' : 'Print'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Statement Document */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800 text-xs">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-200 gap-4">
            <div>
              <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-bold text-xs uppercase tracking-wide">
                ETHIO BUSINESS HELPER
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                {business.amharicName || business.name}
              </h2>
              <p className="text-slate-500 text-xs">{business.address || 'Addis Ababa, Ethiopia'}</p>
              <p className="text-slate-500 text-xs">ስልክ: {business.phone}</p>
            </div>
            <div className="sm:text-right bg-slate-50 p-3 rounded-xl border border-slate-200 w-full sm:w-auto">
              <span className="text-[10px] uppercase font-bold text-slate-400">STATEMENT FOR</span>
              <h3 className="text-sm font-bold text-slate-900">{customer.name}</h3>
              <p className="text-slate-600 text-xs">ስልክ: {customer.phone}</p>
              <p className="text-slate-500 text-[11px]">{customer.address || 'Addis Ababa'}</p>
              <p className="text-slate-400 text-[10px] mt-1">
                የወጣበት ቀን: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Balance Summary KPI */}
          <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-100 border border-slate-200">
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold">
                {language === 'am' ? 'ጠቅላላ የተገዛ' : 'Total Purchased'}
              </p>
              <p className="text-sm font-bold text-slate-900">{customer.totalPurchased.toLocaleString()} ETB</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold">
                {language === 'am' ? 'የተከፈለ ገንዘብ' : 'Total Paid'}
              </p>
              <p className="text-sm font-bold text-emerald-600">{customer.totalPaid.toLocaleString()} ETB</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold">
                {language === 'am' ? 'ያልተከፈለ ቀሪ ዕዳ' : 'Outstanding Balance'}
              </p>
              <p className="text-sm font-bold text-red-600">{customer.currentDebt.toLocaleString()} ETB</p>
            </div>
          </div>

          {/* Ledger Table */}
          <div>
            <h4 className="font-bold text-xs text-slate-900 mb-2 uppercase tracking-wide">
              {language === 'am' ? 'የእንቅስቃሴ ዝርዝር (Ledger Transactions)' : 'Transaction History'}
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-[11px] text-slate-600 uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">ቀን (Date)</th>
                    <th className="py-2.5 px-3">ዝርዝር (Description)</th>
                    <th className="py-2.5 px-3 text-right">ዕዳ (+) Debit</th>
                    <th className="py-2.5 px-3 text-right">ክፍያ (-) Credit</th>
                    <th className="py-2.5 px-3 text-right">ቀሪ ሂሳብ (Balance)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-400">
                        ምንም የተመዘገበ የዕዳ እንቅስቃሴ የለም (No transactions)
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => {
                      const isCreditSale = tx.type === 'CREDIT_SALE';
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono text-slate-600">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-800">
                            {tx.notes || (isCreditSale ? 'የብድር ሽያጭ' : 'የዕዳ ክፍያ')}
                            {tx.paymentMethod && (
                              <span className="text-[10px] text-slate-500 block">
                                ({tx.paymentMethod})
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right font-semibold text-red-600 font-mono">
                            {isCreditSale ? `+${tx.amount.toLocaleString()} ETB` : '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-semibold text-emerald-600 font-mono">
                            {!isCreditSale ? `-${tx.amount.toLocaleString()} ETB` : '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900 font-mono">
                            {tx.newBalance.toLocaleString()} ETB
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Terms */}
          <div className="pt-4 border-t border-slate-200 text-slate-500 text-[11px] flex justify-between items-center">
            <p>
              {language === 'am'
                ? 'ማንኛውም ቅሬታ ወይም ጥያቄ ካለዎት እባክዎ ሱቃችንን በስልክ ያነጋግሩ።'
                : 'For any discrepancies or questions regarding this statement, please contact us.'}
            </p>
            <div className="text-right">
              <span className="font-bold text-slate-800">
                {language === 'am' ? 'ያልተከፈለ ቀሪ:' : 'Balance Due:'}
              </span>{' '}
              <span className="text-sm font-bold text-red-600">{customer.currentDebt.toLocaleString()} ETB</span>
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="p-3 bg-slate-50 border-t border-slate-200">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition"
          >
            {language === 'am' ? 'ዝጋ' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
