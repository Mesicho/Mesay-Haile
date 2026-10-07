import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Customer } from '../../types';
import { Users, Plus, Search, Phone, FileText, CreditCard, ShieldCheck } from 'lucide-react';
import { StatementModal } from '../common/StatementModal';

interface CustomersManagementProps {
  onOpenAddCustomer: () => void;
  onOpenRecordPayment: (debt?: any) => void;
}

export const CustomersManagement: React.FC<CustomersManagementProps> = ({
  onOpenAddCustomer,
  onOpenRecordPayment,
}) => {
  const { customers, language } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatementCustomer, setSelectedStatementCustomer] = useState<Customer | null>(null);

  const filtered = customers.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.address && c.address.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-slate-900 rounded-2xl p-5 text-white border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {language === 'am' ? 'የደንበኞች ማህደር' : 'Customer Directory'}
            </h2>
            <p className="text-xs text-slate-400">
              {language === 'am'
                ? 'የደንበኞች የብድር ጣሪያ፣ የሽያጭና የክፍያ ታሪክ መቆጣጠሪያ'
                : 'Customer credit limits, lifetime purchases, and account statements'}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenAddCustomer}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'am' ? '+ አዲስ ደንበኛ መዝግብ' : '+ Add Customer'}</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'am' ? 'ደንበኛ በስም ወይም ስልክ ቁጥር ፈልግ...' : 'Search customer by name or phone...'}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => {
          const hasDebt = c.currentDebt > 0;
          const availableCredit = Math.max(0, c.creditLimit - c.currentDebt);

          return (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{c.name}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" />
                      {c.phone}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                    {c.customerType}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 mt-1">{c.address || 'Addis Ababa'}</p>

                {/* Financial badges */}
                <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>{language === 'am' ? 'ያለበት ዕዳ:' : 'Current Debt:'}</span>
                    <strong className={`font-mono ${hasDebt ? 'text-red-600' : 'text-slate-900'}`}>
                      {c.currentDebt.toLocaleString()} ETB
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>{language === 'am' ? 'የተፈቀደ የብድር ጣሪያ:' : 'Credit Limit:'}</span>
                    <span className="font-mono">{c.creditLimit.toLocaleString()} ETB</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>{language === 'am' ? 'የቀረው የብድር መጠን:' : 'Available Credit:'}</span>
                    <strong className="font-mono text-emerald-700">{availableCredit.toLocaleString()} ETB</strong>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-200">
                    <span>{language === 'am' ? 'ጠቅላላ የገዛው:' : 'Lifetime Buy:'}</span>
                    <span className="font-mono">{c.totalPurchased.toLocaleString()} ETB</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedStatementCustomer(c)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{language === 'am' ? 'መግለጫ (Statement)' : 'Statement'}</span>
                </button>
                {hasDebt && (
                  <button
                    onClick={() => onOpenRecordPayment()}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                  >
                    {language === 'am' ? 'ክፍያ' : 'Pay'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedStatementCustomer && (
        <StatementModal
          customer={selectedStatementCustomer}
          onClose={() => setSelectedStatementCustomer(null)}
        />
      )}
    </div>
  );
};
