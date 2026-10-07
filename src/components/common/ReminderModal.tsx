import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CustomerDebt } from '../../types';
import { Bell, Send, Copy, Check, MessageSquare, PhoneCall, X } from 'lucide-react';

interface ReminderModalProps {
  debt: CustomerDebt;
  onClose: () => void;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({ debt, onClose }) => {
  const { business, language } = useApp();
  const [copied, setCopied] = useState(false);
  const [reminderType, setReminderType] = useState<'UPCOMING' | 'DUE' | 'OVERDUE'>(
    debt.status === 'OVERDUE' ? 'OVERDUE' : 'DUE'
  );

  // Clean phone number (format 2519... for WhatsApp)
  const cleanPhone = debt.customerPhone.replace(/[^0-9]/g, '');
  const internationalPhone = cleanPhone.startsWith('0')
    ? '251' + cleanPhone.substring(1)
    : cleanPhone.startsWith('251')
    ? cleanPhone
    : '251' + cleanPhone;

  // Bilingual Reminder Text Generation
  const generateMessage = () => {
    const bizName = business.amharicName || business.name;
    const formattedDate = new Date(debt.dueDate).toLocaleDateString();

    if (language === 'am') {
      if (reminderType === 'OVERDUE') {
        return `ጤና ይስጥልኝ ${debt.customerName}፣ ከ${bizName} ያለብዎት የ${debt.remainingDebt.toLocaleString()} ብር ዕዳ የመክፈያ ቀን (${formattedDate}) አልፏል። እባክዎ ክፍያዎን በቶሎ እንዲፈጽሙ በትህትና እናሳስባለን። ስልክ: ${business.phone}`;
      } else if (reminderType === 'DUE') {
        return `ጤና ይስጥልኝ ${debt.customerName}፣ ከ${bizName} ያለብዎት የ${debt.remainingDebt.toLocaleString()} ብር ዕዳ የመክፈያ ቀን ዛሬ (${formattedDate}) መሆኑን በትህትና እናስታውሳለን። ስልክ: ${business.phone}`;
      } else {
        return `ጤና ይስጥልኝ ${debt.customerName}፣ ከ${bizName} ያለብዎት ቀሪ ዕዳ ${debt.remainingDebt.toLocaleString()} ብር ሲሆን፣ የመክፈያ ቀን ${formattedDate} ነው። እናመሰግናለን! ስልክ: ${business.phone}`;
      }
    } else {
      if (reminderType === 'OVERDUE') {
        return `Hello ${debt.customerName}, your outstanding balance of ${debt.remainingDebt.toLocaleString()} ETB at ${bizName} was due on ${formattedDate} and is currently overdue. Please settle at your earliest convenience. Tel: ${business.phone}`;
      } else if (reminderType === 'DUE') {
        return `Hello ${debt.customerName}, this is a gentle reminder from ${bizName} that your payment of ${debt.remainingDebt.toLocaleString()} ETB is due today (${formattedDate}). Tel: ${business.phone}`;
      } else {
        return `Hello ${debt.customerName}, your outstanding balance at ${bizName} is ${debt.remainingDebt.toLocaleString()} ETB, due on ${formattedDate}. Thank you! Tel: ${business.phone}`;
      }
    }
  };

  const messageText = generateMessage();

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSMS = () => {
    window.location.href = `sms:${debt.customerPhone}?body=${encodeURIComponent(messageText)}`;
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${internationalPhone}?text=${encodeURIComponent(messageText)}`, '_blank');
  };

  const handleTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(messageText)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm">
                {language === 'am' ? 'የዕዳ ማስታወሻ መላኪያ' : 'Send Debt Reminder'}
              </h3>
              <p className="text-[11px] text-slate-400">{debt.customerName} ({debt.customerPhone})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Reminder Type Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              {language === 'am' ? 'የማስታወሻ አይነት ምረጥ:' : 'Select Reminder Template:'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setReminderType('UPCOMING')}
                className={`py-2 px-2 text-xs font-medium rounded-xl border text-center transition ${
                  reminderType === 'UPCOMING'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {language === 'am' ? 'ቀን የቀረው' : 'Upcoming'}
              </button>
              <button
                type="button"
                onClick={() => setReminderType('DUE')}
                className={`py-2 px-2 text-xs font-medium rounded-xl border text-center transition ${
                  reminderType === 'DUE'
                    ? 'border-amber-600 bg-amber-50 text-amber-800 font-bold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {language === 'am' ? 'ዛሬ የሚከፈል' : 'Due Today'}
              </button>
              <button
                type="button"
                onClick={() => setReminderType('OVERDUE')}
                className={`py-2 px-2 text-xs font-medium rounded-xl border text-center transition ${
                  reminderType === 'OVERDUE'
                    ? 'border-red-600 bg-red-50 text-red-700 font-bold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {language === 'am' ? 'ቀኑ ያለፈበት' : 'Overdue'}
              </button>
            </div>
          </div>

          {/* Generated Message Preview */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-700">
                {language === 'am' ? 'የመልዕክቱ ቅጂ (Preview):' : 'Message Text:'}
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? (language === 'am' ? 'ተቀድቷል!' : 'Copied!') : (language === 'am' ? 'ኮፒ አድርግ' : 'Copy')}</span>
              </button>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans select-all">
              {messageText}
            </div>
          </div>

          {/* Action Channels (SMS, WhatsApp, Telegram) */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2">
              {language === 'am' ? 'በቀጥታ መላኪያ ዘዴዎች:' : 'Send via Channel:'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* SMS Button */}
              <button
                type="button"
                onClick={handleSMS}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition active:scale-95"
              >
                <PhoneCall className="w-4 h-4" />
                <span>SMS</span>
              </button>

              {/* WhatsApp Button */}
              <button
                type="button"
                onClick={handleWhatsApp}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-xs shadow-sm transition active:scale-95"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>

              {/* Telegram Button */}
              <button
                type="button"
                onClick={handleTelegram}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs shadow-sm transition active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>Telegram</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs transition"
          >
            {language === 'am' ? 'ዝጋ' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
