import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Share2, PlusSquare, X, Smartphone, Check } from 'lucide-react';

interface PWAInstallButtonProps {
  language?: 'am' | 'en';
  variant?: 'header' | 'banner' | 'settings';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  language = 'am',
  variant = 'header',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) {
        setInstalledSuccess(true);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  // If not installable and not iOS, don't show floating clutter in header
  if (!isInstallable && !isIOS) {
    return null;
  }

  return (
    <>
      {variant === 'header' && (
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition active:scale-95 border border-emerald-400/40"
          title={language === 'am' ? 'በስልክዎ ላይ መተግበሪያውን ጫን (PWA)' : 'Install App on Phone / Desktop'}
          aria-label="Install Ethiopian Business Helper App"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {language === 'am' ? 'ጫን (App)' : 'Install'}
          </span>
        </button>
      )}

      {variant === 'banner' && (
        <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-900/60 to-blue-900/60 border border-emerald-500/40 text-white flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-xs text-white">
                {language === 'am' ? 'ETHIO HELPER መተግበሪያን በስልክዎ ይጫኑ' : 'Install ETHIO HELPER as Native App'}
              </p>
              <p className="text-[11px] text-slate-300">
                {language === 'am'
                  ? 'ፈጣን የPOS አሰራር፣ ከስክሪን ገጽታ ሳይወጡ በሙሉ ገጽ ይሰራል (Android & iOS)'
                  : 'Fast fullscreen POS terminal, offline resilience, and home screen icon'}
              </p>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-md active:scale-95 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{language === 'am' ? 'አሁን ጫን' : 'Install Now'}</span>
          </button>
        </div>
      )}

      {/* iOS Safari Guided Installation Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-600" />
                <span>{language === 'am' ? 'በ iPhone / iPad ላይ መጫኛ' : 'Install on iPhone / iPad'}</span>
              </h3>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              {language === 'am'
                ? 'በ Safari ብሮውዘር አማካኝነት በቀላሉ የቤት ስክሪን ላይ ለመጫን የሚከተሉትን 2 እርምጃዎች ይከተሉ፡'
                : 'Follow these 2 simple steps in Safari to add the app directly to your home screen:'}
            </p>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-750">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 shrink-0">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {language === 'am' ? '1. የማጋሪያ (Share) ምልክቱን ይጫኑ' : '1. Tap the Share Button'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {language === 'am'
                      ? 'በ Safari የግርጌ ሜኑ ላይ ያለውን የማጋሪያ ምልክት (⎋) ይጫኑ'
                      : 'Located in Safari’s bottom toolbar (the square with an arrow up)'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-750">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 shrink-0">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {language === 'am' ? '2. "Add to Home Screen" ይምረጡ' : '2. Select "Add to Home Screen"'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {language === 'am'
                      ? 'ከዝርዝሩ ውስጥ "Add to Home Screen (ወደ ዋና ስክሪን ጨምር)" የሚለውን ይምረጡ'
                      : 'Scroll down and tap "Add to Home Screen", then tap "Add" in the top right.'}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition"
            >
              {language === 'am' ? 'ተረድቻለሁ (ገባኝ)' : 'Got It!'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
