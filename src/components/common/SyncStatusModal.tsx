import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  Clock,
  Smartphone,
  ShieldCheck,
  X,
  AlertCircle,
} from 'lucide-react';

interface SyncStatusModalProps {
  onClose: () => void;
}

export const SyncStatusModal: React.FC<SyncStatusModalProps> = ({ onClose }) => {
  const {
    isOffline,
    toggleOffline,
    syncNow,
    syncQueue,
    lastSyncTime,
    language,
    business,
  } = useApp();

  const pendingEvents = syncQueue.filter((s) => s.status === 'PENDING');

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                isOffline ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              {isOffline ? <WifiOff className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-sm">
                {language === 'am' ? 'የዳታ ማመሳሰያ ሁኔታ (Offline & Sync)' : 'Offline Engine & Sync Queue'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isOffline
                  ? (language === 'am' ? 'ያለ ኢንተርኔት በመስራት ላይ' : 'Operating in Offline Mode')
                  : (language === 'am' ? 'የተገናኘ እና የተመሳሰለ' : 'Connected & Synchronized')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Status Box */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between ${
              isOffline
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            <div>
              <p className="font-bold text-xs">
                {isOffline
                  ? (language === 'am' ? 'ኦፍላይን ሁኔታ: ንቁ' : 'Offline State: Active')
                  : (language === 'am' ? 'ኦንላይን ሁኔታ: ንቁ' : 'Online State: Active')}
              </p>
              <p className="text-[11px] opacity-80 mt-0.5">
                {language === 'am' ? 'የመጨረሻ ማመሳሰል:' : 'Last Synced:'} {lastSyncTime}
              </p>
            </div>

            <button
              onClick={toggleOffline}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 font-semibold text-xs shadow-2xs hover:bg-slate-50 transition"
            >
              {isOffline
                ? (language === 'am' ? 'ኦንላይን ቀይር' : 'Switch Online')
                : (language === 'am' ? 'ኦፍላይን አስመስል' : 'Simulate Offline')}
            </button>
          </div>

          {/* Sync Trigger */}
          <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <p className="font-semibold text-slate-800">
                {language === 'am' ? 'ያልተመሳሰሉ ግብይቶች ብዛት:' : 'Pending Sync Events:'}
              </p>
              <p className="text-slate-500 font-mono text-[11px]">
                {pendingEvents.length} {language === 'am' ? 'እንቅስቃሴዎች ወረፋ ላይ' : 'queued items'}
              </p>
            </div>

            <button
              onClick={syncNow}
              disabled={isOffline || pendingEvents.length === 0}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{language === 'am' ? 'አሁን አመሳስል' : 'Sync Now'}</span>
            </button>
          </div>

          {/* Pending Events List */}
          <div>
            <h4 className="font-bold text-slate-700 mb-2">
              {language === 'am' ? 'የእንቅስቃሴዎች ወረፋ (Transaction Queue):' : 'Queued Sync Transactions:'}
            </h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {syncQueue.length === 0 ? (
                <div className="p-4 text-center text-slate-400 bg-slate-50 rounded-xl">
                  {language === 'am' ? 'ሁሉም መረጃዎች ከዋናው ዳታቤዝ ጋር ተመሳስለዋል ✓' : 'All transactions are synchronized ✓'}
                </div>
              ) : (
                syncQueue.slice(0, 10).map((ev) => (
                  <div
                    key={ev.id}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800">{ev.action}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{ev.entityType}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {new Date(ev.timestamp).toLocaleTimeString()} • ID: {ev.entityId.slice(0, 10)}
                      </p>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ev.status === 'SYNCED'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {ev.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Security & Conflict Note */}
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>{language === 'am' ? 'የግብይት መደጋገም መከላከያ (Idempotency)' : 'Idempotent Conflict Prevention'}</span>
            </div>
            <p className="text-[11px] leading-relaxed text-blue-800">
              {language === 'am'
                ? 'ኦፍላይን የተመዘገቡ ሽያጮችና ክፍያዎች ልዩ መለያ (UUID) ስላላቸው ኢንተርኔት ሲመለስ በስህተት ሁለት ጊዜ አይመዘገቡም።'
                : 'Offline sales and debt collections utilize unique idempotency keys ensuring zero duplicate entries upon network reconnection.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs"
          >
            {language === 'am' ? 'ዝጋ' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
