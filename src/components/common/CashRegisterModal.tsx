import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DollarSign, CheckCircle2, AlertTriangle, X, Lock, Unlock } from 'lucide-react';

interface CashRegisterModalProps {
  onClose: () => void;
}

export const CashRegisterModal: React.FC<CashRegisterModalProps> = ({ onClose }) => {
  const { sales, currentUser, language, business } = useApp();

  const [registerStatus, setRegisterStatus] = useState<'OPEN' | 'CLOSED'>('OPEN');
  const [openingBalance, setOpeningBalance] = useState<number>(2000); // 2,000 ETB float
  const [countedCash, setCountedCash] = useState<number | ''>('');
  const [shiftNotes, setShiftNotes] = useState('');
  const [reconciliationDone, setReconciliationDone] = useState(false);

  // Today cash receipts
  const todayStr = new Date().toISOString().split('T')[0];
  const shiftCashSales = sales
    .filter((s) => s.createdAt.startsWith(todayStr) && (s.paymentMethod === 'CASH' || s.paymentMethod === 'SPLIT'))
    .reduce((acc, s) => acc + s.amountPaid, 0);

  const expectedTotalCash = openingBalance + shiftCashSales;
  const countedNum = countedCash === '' ? 0 : Number(countedCash);
  const variance = countedNum - expectedTotalCash;

  const handleCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (countedCash === '') return;
    setReconciliationDone(true);
    setRegisterStatus('CLOSED');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">
                {language === 'am' ? 'የገንዘብ መመዝገቢያ ሳጥን (Cash Drawer Shift)' : 'Cash Register Shift Management'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {currentUser.name} • {business.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Shift status badge */}
          <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-slate-500 text-[11px] block">
                {language === 'am' ? 'የሳጥን ሁኔታ:' : 'Drawer Status:'}
              </span>
              <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5 mt-0.5">
                {registerStatus === 'OPEN' ? (
                  <>
                    <Unlock className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">{language === 'am' ? 'ክፍት (ስራ ላይ)' : 'OPEN / ACTIVE'}</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-red-600" />
                    <span className="text-red-700">{language === 'am' ? 'የተዘጋ (ሂሳብ የተወራረደ)' : 'CLOSED / RECONCILED'}</span>
                  </>
                )}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-mono">
              Counter #1
            </span>
          </div>

          {/* Reconciliation Balance Grid */}
          <div className="space-y-2 p-3.5 rounded-xl bg-slate-100 border border-slate-200 font-mono">
            <div className="flex justify-between text-slate-600">
              <span>{language === 'am' ? 'የመክፈቻ ተቀማጭ (Opening Float):' : 'Opening Float:'}</span>
              <span>{openingBalance.toLocaleString()} ETB</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>{language === 'am' ? 'የዛሬ ጥሬ ገንዘብ ሽያጭ (Cash Sales):' : 'Today Cash Sales:'}</span>
              <span className="text-emerald-700 font-bold">+{shiftCashSales.toLocaleString()} ETB</span>
            </div>
            <div className="flex justify-between text-slate-900 font-bold pt-2 border-t border-slate-300 text-sm">
              <span>{language === 'am' ? 'በሳጥን ውስጥ መገኘት ያለበት ድምር:' : 'Expected In Drawer:'}</span>
              <span className="text-blue-800">{expectedTotalCash.toLocaleString()} ETB</span>
            </div>
          </div>

          {!reconciliationDone ? (
            <form onSubmit={handleCloseShift} className="space-y-3">
              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  {language === 'am' ? 'በእጅ የተቆጠረ ጥሬ ገንዘብ (Counted Cash):' : 'Counted Physical Cash (ETB):'}
                </label>
                <input
                  type="number"
                  step="any"
                  value={countedCash}
                  onChange={(e) => setCountedCash(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 5200"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-base font-bold font-mono text-slate-900"
                  required
                />
              </div>

              {countedCash !== '' && (
                <div
                  className={`p-3 rounded-xl border text-xs flex justify-between items-center ${
                    variance === 0
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : variance > 0
                      ? 'bg-blue-50 border-blue-300 text-blue-900'
                      : 'bg-red-50 border-red-300 text-red-900'
                  }`}
                >
                  <span className="font-bold">
                    {variance === 0
                      ? (language === 'am' ? 'ልዩነት የለም (ትክክለኛ ሂሳብ)' : 'Balanced (Zero Variance)')
                      : variance > 0
                      ? (language === 'am' ? 'ትርፍ ተገኝቷል (Over):' : 'Cash Overage:')
                      : (language === 'am' ? 'ጉድለት ተገኝቷል (Short):' : 'Cash Shortage:')}
                  </span>
                  <span className="font-bold font-mono text-sm">
                    {variance > 0 ? `+${variance}` : variance} ETB
                  </span>
                </div>
              )}

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  {language === 'am' ? 'የፈረቃ ማስታወሻ (Shift Notes):' : 'Shift Notes:'}
                </label>
                <input
                  type="text"
                  value={shiftNotes}
                  onChange={(e) => setShiftNotes(e.target.value)}
                  placeholder={language === 'am' ? 'ለምሳሌ: የቀን ፈረቃ በሰላም ተጠናቋል' : 'e.g. Day shift end reconciliation'}
                  className="w-full p-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Lock className="w-4 h-4" />
                <span>{language === 'am' ? 'ፈረቃውን ዝጋና ሂሳብ አወራርድ' : 'Close Shift & Reconcile'}</span>
              </button>
            </form>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-slate-900">
                {language === 'am' ? 'የፈረቃው ሂሳብ በተሳካ ሁኔታ ተወራርዷል!' : 'Shift Reconciled Successfully!'}
              </h4>
              <p className="text-xs text-slate-600">
                {language === 'am'
                  ? `የተቆጠረ ገንዘብ: ${countedNum.toLocaleString()} ብር • ልዩነት: ${variance} ብር`
                  : `Counted: ${countedNum.toLocaleString()} ETB • Variance: ${variance} ETB`}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs"
          >
            {language === 'am' ? 'ዝጋ' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
