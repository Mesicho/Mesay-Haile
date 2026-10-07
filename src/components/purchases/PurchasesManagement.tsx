import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Purchase, Supplier } from '../../types';
import { Truck, Plus, Building, Phone, Calendar, CheckCircle2 } from 'lucide-react';

interface PurchasesManagementProps {
  onOpenRecordPurchase: () => void;
}

export const PurchasesManagement: React.FC<PurchasesManagementProps> = ({ onOpenRecordPurchase }) => {
  const { purchases, suppliers, language } = useApp();
  const [activeTab, setActiveTab] = useState<'purchases' | 'suppliers'>('purchases');

  const totalPayables = suppliers.reduce((acc, s) => acc + s.outstandingPayable, 0);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-slate-900 rounded-2xl p-5 text-white border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {language === 'am' ? 'የእቃ ግዢና አቅራቢዎች' : 'Purchases & Suppliers'}
            </h2>
            <p className="text-xs text-slate-400">
              {language === 'am'
                ? 'ከአቅራቢዎች እቃ ሲገዛ ክምችት ወዲያውኑ ይጨምራል፣ የባለዕዳ ክፍያዎች ይመዘገባሉ'
                : 'Purchase receiving auto-increases stock levels and manages accounts payable'}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenRecordPurchase}
          className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'am' ? '+ አዲስ ግዢ መዝግብ' : '+ Record Purchase'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('purchases')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'purchases'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          {language === 'am' ? 'የግዢ ታሪክ' : 'Purchase Orders'} ({purchases.length})
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'suppliers'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          {language === 'am' ? 'አቅራቢዎች' : 'Suppliers'} ({suppliers.length})
        </button>
      </div>

      {activeTab === 'purchases' ? (
        /* Purchases Table */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">{language === 'am' ? 'ደረሰኝ #' : 'Invoice #'}</th>
                <th className="py-3 px-3">{language === 'am' ? 'አቅራቢ' : 'Supplier'}</th>
                <th className="py-3 px-3">{language === 'am' ? 'የእቃ ብዛት' : 'Items'}</th>
                <th className="py-3 px-3 text-right">{language === 'am' ? 'ጠቅላላ ዋጋ' : 'Total'}</th>
                <th className="py-3 px-3 text-right">{language === 'am' ? 'የተከፈለ' : 'Paid'}</th>
                <th className="py-3 px-3 text-right">{language === 'am' ? 'ዕዳ/ቀሪ' : 'Payable'}</th>
                <th className="py-3 px-4">{language === 'am' ? 'ቀን' : 'Date'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchases.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.invoiceNumber}</td>
                  <td className="py-3 px-3 font-semibold text-slate-800">{p.supplierName}</td>
                  <td className="py-3 px-3 text-slate-600">
                    {p.items.map((i) => `${i.productName} (${i.quantity})`).join(', ')}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono">
                    {p.totalAmount.toLocaleString()} ETB
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-emerald-600 font-mono">
                    {p.amountPaid.toLocaleString()} ETB
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-red-600 font-mono">
                    {p.debtPayable.toLocaleString()} ETB
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Suppliers Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suppliers.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-2">
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-sm text-slate-900">{s.name}</h4>
                <span className="text-xs text-red-600 font-bold font-mono">
                  {language === 'am' ? 'ለአቅራቢው ያለብን:' : 'Payable:'} {s.outstandingPayable.toLocaleString()} ETB
                </span>
              </div>
              <p className="text-xs text-slate-600 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {s.phone}
              </p>
              <p className="text-xs text-slate-500">{s.address}</p>
              <p className="text-xs text-slate-400">ግንኙነት: {s.contactPerson || '-'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
