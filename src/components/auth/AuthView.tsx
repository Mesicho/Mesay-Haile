import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { useApp } from '../../context/AppContext';
import { Globe, Sun, Moon, Store, ShieldCheck, CheckCircle2, TrendingUp, CreditCard, Package } from 'lucide-react';

type AuthScreen = 'login' | 'register' | 'forgot-password';

export const AuthView: React.FC = () => {
  const { language, setLanguage, isDarkMode, toggleDarkMode } = useApp();
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>('login');
  const isAmharic = language === 'am';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-blue-600/15 via-emerald-600/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with Language and Theme Switcher */}
      <header className="relative z-10 max-w-6xl w-full mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-emerald-500 to-blue-600 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-emerald-500/20">
            🇪🇹
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-white block leading-none">
              ETHIO BUSINESS HELPER
            </span>
            <span className="text-[11px] text-amber-400 font-medium">
              የንግድ ረዳት
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(isAmharic ? 'en' : 'am')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-amber-300 border border-slate-800 transition"
            title="Toggle Language"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{isAmharic ? 'English' : 'አማርኛ'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-300" />}
          </button>
        </div>
      </header>

      {/* Hero & Form Section */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center max-w-6xl w-full mx-auto px-4 py-6 lg:py-12 gap-8 lg:gap-14">
        {/* Left Side: Ethiopian Business Helper Value Proposition */}
        <div className="w-full lg:w-1/2 text-left space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>{isAmharic ? 'የኢትዮጵያ ንግዶች መሪ ሲስተም' : 'Ethiopia #1 Business Operating System'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            “ንግድዎን በደብተር ሳይሆን በአንድ ስርዓት ያስተዳድሩ!”
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
            {isAmharic
              ? 'ለችርቻሮ ሱቆች፣ ካፌዎች፣ ቡቲኮች፣ ውበት ሳሎኖች፣ ኤሌክትሮኒክስ፣ ጅምላ ሻጮችና አነስተኛ ንግዶች የተዘጋጀ ሙሉ የሽያጭ፣ የዕዳ፣ የክምችትና የሂሳብ አያያዝ ቴክኖሎጂ።'
              : 'Production-ready business management suite crafted for retail shops, restaurants, boutiques, salons, electronics stores, wholesalers, and SMEs across Ethiopia.'}
          </p>

          {/* 4 Important Questions Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">💰 {isAmharic ? 'ስንት ሸጥኩ?' : 'How much sold?'}</p>
                <p className="text-[11px] text-slate-400">{isAmharic ? 'የዕለትና ወርሃዊ ሽያጭ' : 'Daily & monthly sales'}</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center flex-shrink-0">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">📈 {isAmharic ? 'ስንት አተረፍኩ?' : 'Net Profit?'}</p>
                <p className="text-[11px] text-slate-400">{isAmharic ? 'ወጪና ትርፍ ስሌት' : 'Real-time P&L'}</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">💳 {isAmharic ? 'ማን ዕዳ አለበት?' : 'Who owes debt?'}</p>
                <p className="text-[11px] text-slate-400">{isAmharic ? 'የደንበኞች ዕዳ መከታተያ' : 'Killer Debt Tracker'}</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">📦 {isAmharic ? 'ምን እቃ ሊያልቅ ነው?' : 'Low stock items?'}</p>
                <p className="text-[11px] text-slate-400">{isAmharic ? 'የክምችት ማስጠንቀቂያ' : 'Inventory alerts'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card Container */}
        <div className="w-full lg:w-1/2 max-w-md">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            {/* Tab Navigation if not forgot-password */}
            {currentScreen !== 'forgot-password' && (
              <div className="flex rounded-2xl bg-slate-950 p-1 mb-6 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setCurrentScreen('login')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                    currentScreen === 'login'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isAmharic ? 'ግባ (Login)' : 'Sign In'}
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentScreen('register')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                    currentScreen === 'register'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isAmharic ? 'አዲስ መለያ (Register)' : 'New Account'}
                </button>
              </div>
            )}

            {/* Screen Content */}
            {currentScreen === 'login' && (
              <LoginForm
                isAmharic={isAmharic}
                onSwitchToRegister={() => setCurrentScreen('register')}
                onSwitchToForgotPassword={() => setCurrentScreen('forgot-password')}
              />
            )}

            {currentScreen === 'register' && (
              <RegisterForm
                isAmharic={isAmharic}
                onSwitchToLogin={() => setCurrentScreen('login')}
              />
            )}

            {currentScreen === 'forgot-password' && (
              <ForgotPasswordForm
                isAmharic={isAmharic}
                onBackToLogin={() => setCurrentScreen('login')}
              />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-6xl w-full mx-auto px-4 py-4 text-center text-xs text-slate-500 border-t border-slate-900">
        <p>
          🇪🇹 ETHIO BUSINESS HELPER &copy; {new Date().getFullYear()} &bull;{' '}
          {isAmharic ? 'የኢትዮጵያ ንግድ ማህበረሰብ መተግበሪያ' : 'Empowering Ethiopian SME Commerce'}
        </p>
      </footer>
    </div>
  );
};
