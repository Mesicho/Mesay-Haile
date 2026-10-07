import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldAlert, Search, Filter, Smartphone, Monitor } from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const { auditLogs, language } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = auditLogs.filter((log) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.userName.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      (log.actionAm && log.actionAm.includes(q)) ||
      (log.newValue && log.newValue.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-slate-900 rounded-2xl p-5 text-white border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {language === 'am' ? 'የእንቅስቃሴና የኦዲት መዝገብ' : 'Immutable Audit Trail'}
            </h2>
            <p className="text-xs text-slate-400">
              {language === 'am'
                ? 'ማን፣ ምን፣ መቼ፣ በየትኛው መሳሪያ እንደሰራ የሚያሳይ የማይደለዝ መዝገብ'
                : 'WHO, WHAT, WHEN, DEVICE, OLD VALUE, NEW VALUE - No record can be silently deleted'}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === 'am'
                ? 'በተጠቃሚ ስም፣ ተግባር ወይም ዝርዝር ፈልግ...'
                : 'Search audit logs by user, action, or value...'
            }
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">{language === 'am' ? 'ሰዓትና ቀን' : 'Timestamp'}</th>
                <th className="py-3 px-3">{language === 'am' ? 'ፈጻሚ (WHO)' : 'User (WHO)'}</th>
                <th className="py-3 px-3">{language === 'am' ? 'የተከናወነ ተግባር (WHAT)' : 'Action (WHAT)'}</th>
                <th className="py-3 px-3">{language === 'am' ? 'የነበረው እሴት (OLD)' : 'Old Value'}</th>
                <th className="py-3 px-3">{language === 'am' ? 'አዲሱ እሴት (NEW)' : 'New Value'}</th>
                <th className="py-3 px-4">{language === 'am' ? 'መሳሪያ (DEVICE)' : 'Device / Where'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-sans font-bold text-slate-900 whitespace-nowrap">
                    {log.userName}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-sans font-semibold text-[10px]">
                      {language === 'am' && log.actionAm ? log.actionAm : log.action}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{log.entityType}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-500 max-w-[140px] truncate">
                    {log.oldValue || '-'}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-900 max-w-[200px] truncate">
                    {log.newValue || '-'}
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-sans text-[11px] whitespace-nowrap flex items-center gap-1.5 mt-2">
                    {log.deviceInfo.includes('Mobile') ? (
                      <Smartphone className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    ) : (
                      <Monitor className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    )}
                    <span>{log.deviceInfo}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
