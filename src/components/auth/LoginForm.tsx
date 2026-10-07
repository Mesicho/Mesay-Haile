import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import {
  LogIn,
  Eye,
  EyeOff,
  Lock,
  Mail,
  AlertCircle,
  Loader2,
  Sparkles,
  ShieldCheck,
  Building,
} from 'lucide-react';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword: () => void;
  isAmharic?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSwitchToRegister,
  onSwitchToForgotPassword,
  isAmharic = true,
}) => {
  const { login, isLoading, error, errorAm, clearError, switchDemoAccount, isSupabaseConnected } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localValidation, setLocalValidation] = useState<{ field?: string; message: string; messageAm: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalValidation(null);
    clearError();

    if (!identifier.trim()) {
      setLocalValidation({
        field: 'identifier',
        message: 'Please enter your email or phone number.',
        messageAm: 'እባክዎ ኢሜይል ወይም ስልክ ቁጥር ያስገቡ።',
      });
      return;
    }

    if (!password) {
      setLocalValidation({
        field: 'password',
        message: 'Please enter your password.',
        messageAm: 'እባክዎ የይለፍ ቃል ያስገቡ።',
      });
      return;
    }

    await login({
      identifier: identifier.trim(),
      password,
    });
  };

  const handleQuickDemo = (role: UserRole) => {
    clearError();
    setLocalValidation(null);
    switchDemoAccount(role);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header Info */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {isAmharic ? 'ወደ መለያዎ ይግቡ' : 'Sign In to Your Account'}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          {isAmharic
            ? 'የንግድዎን ሙሉ እንቅስቃሴ በአንድ ቦታ ያስተዳድሩ'
            : 'Manage your Ethiopian business operations in one secure system'}
        </p>

        {/* Cloud / Supabase status tag */}
        <div className="mt-3 flex items-center justify-center gap-2">
          {isSupabaseConnected ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Supabase Cloud Auth Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <ShieldCheck className="w-3 h-3" />
              {isAmharic ? 'የንግድ ክፍለ-ጊዜ (Local Secured)' : 'Local Business Auth'}
            </span>
          )}
        </div>
      </div>

      {/* Error Banners */}
      {(localValidation || error) && (
        <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-start gap-2.5 animate-fadeIn">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">{localValidation ? (isAmharic ? localValidation.messageAm : localValidation.message) : (isAmharic ? (errorAm || error) : error)}</p>
          </div>
        </div>
      )}

      {/* Main Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Identifier (Email or Phone) */}
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
              onChange={(e) => {
                setIdentifier(e.target.value);
                if (localValidation?.field === 'identifier') setLocalValidation(null);
              }}
              placeholder={isAmharic ? 'ለምሳሌ፡ 0911234567 ወይም owner@ethiobiz.et' : 'e.g. 0911234567 or owner@ethiobiz.et'}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
              autoComplete="username"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {isAmharic ? 'የይለፍ ቃል' : 'Password'}
            </label>
            <button
              type="button"
              onClick={onSwitchToForgotPassword}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {isAmharic ? 'የይለፍ ቃል ረሱ?' : 'Forgot Password?'}
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (localValidation?.field === 'password') setLocalValidation(null);
              }}
              placeholder="••••••••"
              className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition disabled:opacity-60 active:scale-[0.99] cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{isAmharic ? 'በማረጋገጥ ላይ...' : 'Authenticating...'}</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>{isAmharic ? 'ግባ' : 'Login'}</span>
            </>
          )}
        </button>
      </form>

      {/* Switch to Registration */}
      <div className="mt-6 text-center">
        <p className="text-xs text-slate-600 dark:text-slate-400">
          {isAmharic ? 'አዲስ ንግድ አለዎት?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-blue-600 dark:text-blue-400 font-bold hover:underline ml-1"
          >
            {isAmharic ? 'አዲስ መለያ ይፍጠሩ' : 'Create New Account'}
          </button>
        </p>
      </div>

      {/* Quick Test Demo Role Access */}
      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5 justify-center mb-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>{isAmharic ? 'የሙከራ መለያዎች (1-Click Test)' : 'Instant Demo Accounts'}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleQuickDemo('OWNER')}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 text-left transition flex flex-col cursor-pointer"
          >
            <span className="text-[11px] font-bold text-slate-900 dark:text-white flex items-center gap-1">
              👑 {isAmharic ? 'ባለቤት' : 'Owner'}
            </span>
            <span className="text-[9px] text-slate-500 truncate">owner@ethiobiz.et</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemo('CASHIER')}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 text-left transition flex flex-col cursor-pointer"
          >
            <span className="text-[11px] font-bold text-slate-900 dark:text-white flex items-center gap-1">
              💵 {isAmharic ? 'ገንዘብ ተቀባይ' : 'Cashier'}
            </span>
            <span className="text-[9px] text-slate-500 truncate">cashier@ethiobiz.et</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemo('MANAGER')}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 text-left transition flex flex-col cursor-pointer"
          >
            <span className="text-[11px] font-bold text-slate-900 dark:text-white flex items-center gap-1">
              💼 {isAmharic ? 'ስራ አስኪያጅ' : 'Manager'}
            </span>
            <span className="text-[9px] text-slate-500 truncate">manager@ethiobiz.et</span>
          </button>
        </div>
      </div>
    </div>
  );
};
