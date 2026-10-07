import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Store,
  Wifi,
  WifiOff,
  Bell,
  RefreshCw,
  Globe,
  UserCheck,
  ChevronDown,
  Sparkles,
  DollarSign,
  Moon,
  Sun,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SyncStatusModal } from './SyncStatusModal';
import { CashRegisterModal } from './CashRegisterModal';

interface HeaderProps {
  onOpenAssistant: () => void;
  onOpenNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAssistant, onOpenNotifications }) => {
  const {
    language,
    setLanguage,
    business,
    branches,
    currentBranchId,
    setCurrentBranchId,
    currentUser,
    users,
    setCurrentUser,
    isOffline,
    toggleOffline,
    syncNow,
    syncQueue,
    notifications,
    isDarkMode,
    toggleDarkMode,
  } = useApp();
  const { logout } = useAuth();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const unreadNotifs = notifications.filter((n) => !n.read).length;
  const pendingSyncCount = syncQueue.filter((s) => s.status === 'PENDING').length;

  const currentBranchName =
    currentBranchId === 'all'
      ? (language === 'am' ? 'ሁሉም ቅርንጫፎች' : 'All Branches')
      : branches.find((b) => b.id === currentBranchId)?.name || 'Branch';

  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-red-600 to-blue-700 flex items-center justify-center shadow-lg font-bold text-white text-lg ring-2 ring-amber-400/30">
            🇪🇹
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base sm:text-lg tracking-tight text-white flex items-center gap-1.5">
                <span>ETHIO BUSINESS HELPER</span>
                <span className="hidden md:inline text-xs font-normal px-2 py-0.5 rounded bg-blue-900/80 text-blue-200 border border-blue-700/50">
                  {business.amharicName || business.name}
                </span>
              </h1>
            </div>
            <p className="text-xs text-amber-300/90 font-medium truncate max-w-[200px] sm:max-w-md">
              {language === 'am' ? 'የንግድዎን ሙሉ አስተዳደር በአንድ ስርዓት' : 'Unified Business & Credit Management'}
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* AI Quick Button */}
          <button
            onClick={onOpenAssistant}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-sm transition active:scale-95 border border-blue-400/30"
            title="Smart Ethiopian Business AI Assistant"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span className="hidden sm:inline">
              {language === 'am' ? 'የንግድ ረዳት' : 'AI Assistant'}
            </span>
          </button>

          {/* Branch Switcher (Desktop/Tablet) */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setShowBranchMenu(!showBranchMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700"
            >
              <Store className="w-3.5 h-3.5 text-slate-400" />
              <span className="max-w-[110px] truncate">{currentBranchName}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showBranchMenu && (
              <div className="absolute right-0 mt-1 w-48 rounded-lg bg-slate-800 border border-slate-700 shadow-xl py-1 z-50 text-xs">
                <button
                  onClick={() => {
                    setCurrentBranchId('all');
                    setShowBranchMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-slate-700 ${
                    currentBranchId === 'all' ? 'text-amber-400 font-semibold bg-slate-750' : 'text-slate-200'
                  }`}
                >
                  {language === 'am' ? 'ሁሉም ቅርንጫፎች (ድምር)' : 'All Branches (Consolidated)'}
                </button>
                {branches.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setCurrentBranchId(b.id);
                      setShowBranchMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-700 ${
                      currentBranchId === b.id ? 'text-amber-400 font-semibold bg-slate-750' : 'text-slate-200'
                    }`}
                  >
                    {language === 'am' && b.amharicName ? b.amharicName : b.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Offline/Online Sync Drawer Trigger */}
          <button
            onClick={() => setShowSyncModal(true)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition ${
              isOffline
                ? 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                : 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
            }`}
            title="Inspect offline queue and sync status"
          >
            {isOffline ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="hidden sm:inline">
                  {language === 'am' ? 'ኦፍላይን' : 'Offline'}
                </span>
                {pendingSyncCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px]">
                    {pendingSyncCount}
                  </span>
                )}
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">
                  {language === 'am' ? 'ኦንላይን' : 'Online'}
                </span>
              </>
            )}
          </button>

          {/* Cash Drawer Shift Button */}
          <button
            onClick={() => setShowRegisterModal(true)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition"
            title="Cash Drawer Shift (የካዝና ፈረቃ)"
          >
            <DollarSign className="w-3.5 h-3.5" />
          </button>

          {/* Sync Button */}
          {pendingSyncCount > 0 && !isOffline && (
            <button
              onClick={syncNow}
              className="p-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white transition active:rotate-180"
              title="Sync now"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Notification Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifs > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                {unreadNotifs}
              </span>
            )}
          </button>

          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(language === 'am' ? 'en' : 'am')}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-amber-300 border border-slate-700 transition"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{language === 'am' ? 'English' : 'አማርኛ'}</span>
          </button>

          {/* Quick Theme Toggle (Day / Night) */}
          <button
            onClick={toggleDarkMode}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition active:scale-95"
            title={
              isDarkMode
                ? (language === 'am' ? 'ወደ ቀን ገጽታ ቀይር (Light Mode)' : 'Switch to Light Mode')
                : (language === 'am' ? 'ወደ ለሊት ገጽታ ቀይር (Dark Mode)' : 'Switch to Dark Mode')
            }
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <Sun className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-blue-300" />
            )}
            <span className="hidden sm:inline text-[11px]">
              {isDarkMode ? (language === 'am' ? 'ለሊት' : 'Dark') : (language === 'am' ? 'ቀን' : 'Light')}
            </span>
          </button>

          {/* User & Role Switcher (RBAC testable live) */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs text-slate-200"
            >
              <div className="w-5 h-5 rounded-full bg-blue-600 text-[10px] font-bold flex items-center justify-center text-white">
                {currentUser.name.charAt(0)}
              </div>
              <span className="hidden lg:inline max-w-[100px] truncate font-medium">
                {currentUser.name.split(' ')[0]}
              </span>
              <span className="text-[10px] px-1 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/40">
                {currentUser.role}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-1 w-56 rounded-lg bg-slate-800 border border-slate-700 shadow-xl py-1 z-50 text-xs">
                <div className="px-3 py-2 border-b border-slate-700">
                  <p className="font-semibold text-white">{currentUser.name}</p>
                  <p className="text-[11px] text-slate-400">
                    {currentUser.email || currentUser.phone}
                  </p>
                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Role: {currentUser.role}
                  </span>
                </div>
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {language === 'am' ? 'ተጠቃሚ ቀይር (የፍቃድ ሙከራ)' : 'Switch User (Test RBAC)'}
                </div>
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setCurrentUser(u);
                      setShowUserMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-700 flex items-center justify-between ${
                      currentUser.id === u.id ? 'bg-slate-700 text-amber-400 font-semibold' : 'text-slate-300'
                    }`}
                  >
                    <span>{u.name}</span>
                    <span className="text-[10px] text-slate-400">{u.role}</span>
                  </button>
                ))}

                <div className="pt-1.5 mt-1 border-t border-slate-700">
                  <button
                    type="button"
                    onClick={async () => {
                      setShowUserMenu(false);
                      await logout();
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-red-500/10 text-red-400 flex items-center gap-2 font-medium transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{language === 'am' ? 'ከመለያ ውጣ (Logout)' : 'Sign Out'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showSyncModal && (
        <SyncStatusModal onClose={() => setShowSyncModal(false)} />
      )}

      {showRegisterModal && (
        <CashRegisterModal onClose={() => setShowRegisterModal(false)} />
      )}
    </header>
  );
};
