import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { KeyRound, Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
  isAmharic?: boolean;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onBackToLogin,
  isAmharic = true,
}) => {
  const { resetPassword, isLoading, error, errorAm } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [successInfo, setSuccessInfo] = useState<{ message: string; messageAm: string } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSuccessInfo(null);

    if (!identifier.trim()) {
      setValidationError(isAmharic ? 'እባክዎ ኢሜይልዎን ወይም ስልክ ቁጥርዎን ያስገቡ።' : 'Please enter your email or phone number.');
      return;
    }

    const res = await resetPassword(identifier);
    if (res.success) {
      setSuccessInfo({
        message: res.message || 'Instructions sent successfully.',
        messageAm: res.messageAm || 'የይለፍ ቃል መቀየሪያ መመሪያ በተሳካ ሁኔታ ተልኳል።',
      });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center mb-3">
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {isAmharic ? 'የይለፍ ቃልዎን ረሱ?' : 'Reset Your Password'}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          {isAmharic
            ? 'የተመዘገቡበትን ኢሜይል ወይም ስልክ ቁጥር ያስገቡ፣ የይለፍ ቃል መቀየሪያ መመሪያ እንልክልዎታለን።'
            : 'Enter your registered email or phone number and we will send you password reset instructions.'}
        </p>
      </div>

      {successInfo ? (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center animate-fadeIn">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <h3 className="font-bold text-slate-900 dark:text-white mb-1">
            {isAmharic ? 'መመሪያው ተልኳል!' : 'Instructions Sent!'}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
            {isAmharic ? successInfo.messageAm : successInfo.message}
          </p>
          <button
            type="button"
            onClick={onBackToLogin}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition"
          >
            {isAmharic ? 'ወደ መግቢያ ተመለስ' : 'Return to Login'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {(validationError || error) && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>{validationError || (isAmharic ? errorAm || error : error)}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              {isAmharic ? 'ኢሜይል ወይም ስልክ ቁጥር' : 'Email or Phone Number'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={isAmharic ? 'ለምሳሌ፡ 0911234567 ወይም owner@ethiobiz.et' : 'e.g. 0911234567 or owner@ethiobiz.et'}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isAmharic ? 'በመላክ ላይ...' : 'Sending...'}</span>
              </>
            ) : (
              <span>{isAmharic ? 'የይለፍ ቃል መቀየሪያ ላክ' : 'Send Reset Instructions'}</span>
            )}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onBackToLogin}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isAmharic ? 'ወደ መግቢያ ተመለስ' : 'Back to Login'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
