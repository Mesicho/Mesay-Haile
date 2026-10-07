import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BusinessType } from '../../types';
import {
  UserPlus,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  User,
  Building,
  MapPin,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  isAmharic?: boolean;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSwitchToLogin,
  isAmharic = true,
}) => {
  const { register, isLoading, error, errorAm, clearError, isSupabaseConnected } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState<BusinessType>('Shop');
  const [businessAddress, setBusinessAddress] = useState('');

  const [localErrors, setLocalErrors] = useState<Record<string, { en: string; am: string }>>({});

  // Calculate password strength
  const calculateStrength = (pass: string): { score: number; labelEn: string; labelAm: string; color: string } => {
    if (!pass) return { score: 0, labelEn: 'None', labelAm: 'የለም', color: 'bg-slate-300 dark:bg-slate-700' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score++;
    if (/\d/.test(pass)) score++;
    if (/[^a-zA-Z\d]/.test(pass)) score++;

    if (score <= 1) {
      return { score: 1, labelEn: 'Weak', labelAm: 'ደካማ', color: 'bg-red-500' };
    } else if (score <= 3) {
      return { score: 2, labelEn: 'Medium', labelAm: 'መካከለኛ', color: 'bg-amber-500' };
    } else {
      return { score: 3, labelEn: 'Strong', labelAm: 'ጠንካራ', color: 'bg-emerald-500' };
    }
  };

  const strength = calculateStrength(password);

  const validate = () => {
    const errs: Record<string, { en: string; am: string }> = {};

    if (!fullName.trim()) {
      errs.fullName = { en: 'Full name is required.', am: 'ሙሉ ስምዎን ያስገቡ።' };
    }

    if (!phone.trim()) {
      errs.phone = { en: 'Phone number is required.', am: 'ስልክ ቁጥር ያስገቡ።' };
    } else if (!/^[0-9+\s-]{9,15}$/.test(phone.trim())) {
      errs.phone = { en: 'Enter a valid Ethiopian phone number.', am: 'ትክክለኛ የኢትዮጵያ ስልክ ቁጥር ያስገቡ (ለምሳሌ 0911234567)።' };
    }

    if (!businessName.trim()) {
      errs.businessName = { en: 'Business name is required.', am: 'የንግድ ስም ያስገቡ።' };
    }

    if (!password) {
      errs.password = { en: 'Password is required.', am: 'የይለፍ ቃል ያስገቡ።' };
    } else if (password.length < 8) {
      errs.password = { en: 'Password must be at least 8 characters.', am: 'የይለፍ ቃል ቢያንስ 8 ፊደላት ወይም ቁጥሮች መሆን አለበት።' };
    }

    if (!confirmPassword) {
      errs.confirmPassword = { en: 'Please confirm password.', am: 'የይለፍ ቃሉን ደግመው ያረጋግጡ።' };
    } else if (password !== confirmPassword) {
      errs.confirmPassword = { en: 'Passwords do not match.', am: 'የይለፍ ቃሎቹ አይመሳሰሉም።' };
    }

    setLocalErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validate()) return;

    await register({
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      password,
      businessName: businessName.trim(),
      businessType,
      businessAddress: businessAddress.trim() || undefined,
    });
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {isAmharic ? 'አዲስ መለያ ይፍጠሩ' : 'Create New Account'}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          {isAmharic
            ? 'ንግድዎን በደብተር ሳይሆን በአንድ ዘመናዊ ስርዓት ያስተዳድሩ!'
            : 'Upgrade your business management from paper ledger to a modern cloud system!'}
        </p>

        {isSupabaseConnected && (
          <div className="mt-2 flex items-center justify-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              Supabase Auth Cloud Sync
            </span>
          </div>
        )}
      </div>

      {/* Global Error Banner */}
      {(error || errorAm) && (
        <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p className="font-semibold">{isAmharic ? errorAm || error : error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name & Phone Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              {isAmharic ? 'ሙሉ ስም *' : 'Full Name *'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={isAmharic ? 'አበበ ተስፋዬ' : 'Abebe Tesfaye'}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            {localErrors.fullName && (
              <p className="text-[11px] text-red-500 mt-1">{isAmharic ? localErrors.fullName.am : localErrors.fullName.en}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              {isAmharic ? 'ስልክ ቁጥር *' : 'Phone Number *'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0911234567"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            {localErrors.phone && (
              <p className="text-[11px] text-red-500 mt-1">{isAmharic ? localErrors.phone.am : localErrors.phone.en}</p>
            )}
          </div>
        </div>

        {/* Email (Optional) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            {isAmharic ? 'ኢሜይል (አስገዳጅ ያልሆነ)' : 'Email Address (Optional)'}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@ethiobiz.et"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Business Name & Type Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              {isAmharic ? 'የንግድ ስም *' : 'Business Name *'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Building className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder={isAmharic ? 'አዲስ ሱፐርማርኬት' : 'Addis Supermarket'}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            {localErrors.businessName && (
              <p className="text-[11px] text-red-500 mt-1">{isAmharic ? localErrors.businessName.am : localErrors.businessName.en}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              {isAmharic ? 'የንግድ ዘርፍ *' : 'Business Type *'}
            </label>
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value as BusinessType)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="Shop">{isAmharic ? 'የችርቻሮ ሱቅ (Retail Shop)' : 'Retail Shop'}</option>
              <option value="Café">{isAmharic ? 'ካፌ (Café)' : 'Café'}</option>
              <option value="Restaurant">{isAmharic ? 'ሬስቶራንት (Restaurant)' : 'Restaurant'}</option>
              <option value="Boutique">{isAmharic ? 'የልብስ ቡቲክ (Boutique)' : 'Boutique'}</option>
              <option value="Salon">{isAmharic ? 'የውበት ሳሎን (Beauty Salon)' : 'Beauty Salon'}</option>
              <option value="Electronics">{isAmharic ? 'ኤሌክትሮኒክስ (Electronics)' : 'Electronics'}</option>
              <option value="Phone Shop">{isAmharic ? 'ስልክ መሸጫ (Phone Shop)' : 'Phone Shop'}</option>
              <option value="Wholesale">{isAmharic ? 'ጅምላ አከፋፋይ (Wholesale)' : 'Wholesale'}</option>
              <option value="Service Business">{isAmharic ? 'አገልግሎት (Service Business)' : 'Service Business'}</option>
              <option value="Freelancer">{isAmharic ? 'ፍሪላንሰር / ባለሙያ (Freelancer)' : 'Freelancer'}</option>
              <option value="Other">{isAmharic ? 'ሌላ (Other)' : 'Other'}</option>
            </select>
          </div>
        </div>

        {/* Business Address (Optional) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            {isAmharic ? 'የንግድ አድራሻ (አስገዳጅ ያልሆነ)' : 'Business Location (Optional)'}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <MapPin className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={businessAddress}
              onChange={(e) => setBusinessAddress(e.target.value)}
              placeholder={isAmharic ? 'መገናኛ፣ አዲስ አበባ' : 'Megenagna, Addis Ababa'}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Password & Confirm Password Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              {isAmharic ? 'የይለፍ ቃል *' : 'Password *'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {localErrors.password && (
              <p className="text-[11px] text-red-500 mt-1">{isAmharic ? localErrors.password.am : localErrors.password.en}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              {isAmharic ? 'የይለፍ ቃል ማረጋገጫ *' : 'Confirm Password *'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            {localErrors.confirmPassword && (
              <p className="text-[11px] text-red-500 mt-1">{isAmharic ? localErrors.confirmPassword.am : localErrors.confirmPassword.en}</p>
            )}
          </div>
        </div>

        {/* Password Strength Meter */}
        {password && (
          <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500 dark:text-slate-400">
                {isAmharic ? 'የይለፍ ቃል ጥንካሬ፡' : 'Password strength:'}
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {isAmharic ? strength.labelAm : strength.labelEn}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex gap-1">
              <div className={`h-full rounded-full transition-all ${strength.score >= 1 ? strength.color : 'bg-transparent'} flex-1`} />
              <div className={`h-full rounded-full transition-all ${strength.score >= 2 ? strength.color : 'bg-transparent'} flex-1`} />
              <div className={`h-full rounded-full transition-all ${strength.score >= 3 ? strength.color : 'bg-transparent'} flex-1`} />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition disabled:opacity-60 active:scale-[0.99] cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{isAmharic ? 'መለያ በመፍጠር ላይ...' : 'Creating Account...'}</span>
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              <span>{isAmharic ? 'አዲስ መለያ ፍጠር' : 'Create Account'}</span>
            </>
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="mt-5 text-center">
        <p className="text-xs text-slate-600 dark:text-slate-400">
          {isAmharic ? 'ቀድሞ መለያ አለዎት?' : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-blue-600 dark:text-blue-400 font-bold hover:underline ml-1"
          >
            {isAmharic ? 'ግባ' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
};
