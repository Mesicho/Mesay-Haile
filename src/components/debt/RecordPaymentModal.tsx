import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CustomerDebt } from '../../types';
import { DollarSign, CheckCircle2, AlertCircle, X, Receipt } from 'lucide-react';

interface RecordPaymentModalProps {
  initialDebt?: CustomerDebt | null;
  onClose: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  initialDebt,
  onClose,
}) => {
  const { debts, language, addDebtPayment, business } = useApp();

  const activeDebts = debts.filter((d) => d.remainingDebt > 0);
  const [selectedDebtId, setSelectedDebtId] = useState<string>(
    initialDebt ? initialDebt.id : activeDebts[0]?.id || ''
  );
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [referenceNo, setReferenceNo] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successReceipt, setSuccessReceipt] = useState<string | null>(null);

  const currentDebt = debts.find((d) => d.id === selectedDebtId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!currentDebt) {
      setErrorMsg(language === 'am' ? 'እባክዎ ዕዳ ያለበት ደንበኛ ይምረጡ' : 'Select a debt record');
      return;
    }

    const numAmount = Number(paymentAmount);
    if (!numAmount || numAmount <= 0) {
      setErrorMsg(language === 'am' ? 'ትክክለኛ የገንዘብ መጠን ያስገቡ' : 'Enter a valid payment amount');
      return;
    }

    if (numAmount > currentDebt.remainingDebt) {
      setErrorMsg(
        language === 'am'
          ? `የክፍያው መጠን ከቀሪው ዕዳ (${currentDebt.remainingDebt} ብር) መብለጥ የለበትም`
          : `Amount exceeds remaining debt (${currentDebt.remainingDebt} ETB)`
      );
      return;
    }

    const res = addDebtPayment({
      debtId: currentDebt.id,
      amount: numAmount,
      paymentMethod,
      referenceNo,
      notes,
    });

    if (res.success) {
      setSuccessReceipt(res.receiptNumber || 'REC-DEBT');
    } else {
      setErrorMsg(res.message);
    }
  };

  const remainingAfterPayment = currentDebt && paymentAmount
    ? Math.max(0, currentDebt.remainingDebt - Number(paymentAmount))
    : currentDebt?.remainingDebt || 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm">
              {language === 'am' ? 'የዕዳ ክፍያ መቀበያ' : 'Record Debt Payment'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {successReceipt ? (
          /* Success Screen */
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-bold text-base text-slate-900">
                {language === 'am' ? 'ክፍያው በተሳካ ሁኔታ ተመዝግቧል!' : 'Payment Recorded Successfully!'}
              </h4>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                ደረሰኝ ቁጥር: {successReceipt}
              </p>
              <p className="text-xs text-emerald-700 font-semibold mt-2">
                {language === 'am'
                  ? `የ${paymentAmount} ብር ክፍያ ተቀናንሶ ቀሪ ዕዳ ወደ ${remainingAfterPayment} ብር ተዘምኗል።`
                  : `Paid ${paymentAmount} ETB. Remaining debt updated to ${remainingAfterPayment} ETB.`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800"
            >
              {language === 'am' ? 'እሺ (ተጠናቋል)' : 'Close'}
            </button>
          </div>
        ) : (
          /* Payment Form */
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Customer Debt Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {language === 'am' ? 'ደንበኛና ዕዳ ምረጥ:' : 'Select Customer Debt:'}
              </label>
              <select
                value={selectedDebtId}
                onChange={(e) => setSelectedDebtId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
              >
                {activeDebts.length === 0 ? (
                  <option value="">
                    {language === 'am' ? 'ምንም ያልተከፈለ ዕዳ የለም' : 'No outstanding debts'}
                  </option>
                ) : (
                  activeDebts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.customerName} - {language === 'am' ? 'ቀሪ' : 'Remaining'}: {d.remainingDebt} ETB ({d.invoiceNumber})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Current Debt Card */}
            {currentDebt && (
              <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>{language === 'am' ? 'የመጀመሪያ ዕዳ:' : 'Original Debt:'}</span>
                  <span className="font-mono">{currentDebt.originalDebt.toLocaleString()} ETB</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>{language === 'am' ? 'ቀደም ሲል የተከፈለ:' : 'Already Paid:'}</span>
                  <span className="font-mono text-emerald-600">{currentDebt.totalPaid.toLocaleString()} ETB</span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-slate-200">
                  <span>{language === 'am' ? 'የአሁኑ ቀሪ ዕዳ:' : 'Current Balance Due:'}</span>
                  <span className="font-mono text-red-600">{currentDebt.remainingDebt.toLocaleString()} ETB</span>
                </div>
              </div>
            )}

            {/* Payment Amount */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  {language === 'am' ? 'የሚከፈለው ገንዘብ (ETB):' : 'Payment Amount (ETB):'}
                </label>
                {currentDebt && (
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(currentDebt.remainingDebt)}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {language === 'am' ? 'ሙሉውን ክፈል' : 'Full Payment'}
                  </button>
                )}
              </div>
              <input
                type="number"
                step="any"
                min="1"
                max={currentDebt?.remainingDebt}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 1000"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:ring-2 focus:ring-blue-500 font-bold"
                required
              />
            </div>

            {/* Calculation Preview */}
            {currentDebt && paymentAmount !== '' && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex justify-between items-center">
                <span className="text-emerald-800 font-medium">
                  {language === 'am' ? 'ከክፍያው በኋላ የሚቀረው ዕዳ:' : 'Remaining Balance After Payment:'}
                </span>
                <span className="font-bold text-emerald-900 font-mono">
                  {remainingAfterPayment.toLocaleString()} ETB
                </span>
              </div>
            )}

            {/* Payment Method */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {language === 'am' ? 'የክፍያ ዘዴ:' : 'Payment Method:'}
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              >
                <option value="Cash">ካሽ (Cash)</option>
                <option value="Telebirr">ቴሌብር (Telebirr)</option>
                <option value="CBE Birr">ሲቢኢ ብር (CBE Birr)</option>
                <option value="Bank Transfer (CBE)">የኢትዮጵያ ንግድ ባንክ (CBE)</option>
                <option value="Bank Transfer (Awash)">አዋሽ ባንክ (Awash Bank)</option>
                <option value="Bank Transfer (BoA)">አቢሲንያ ባንክ (Bank of Abyssinia)</option>
              </select>
            </div>

            {/* Reference Number */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {language === 'am' ? 'የትራንዛክሽን ማጣቀሻ ቁጥር (አማራጭ):' : 'Transaction Reference / Txn ID (Optional):'}
              </label>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="e.g. TEL-991203"
                className="w-full p-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs text-slate-600 hover:bg-slate-100 font-medium"
              >
                {language === 'am' ? 'ሰርዝ' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{language === 'am' ? 'ክፍያውን አረጋግጥ' : 'Confirm Payment'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
