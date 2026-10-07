import React from 'react';
import { AlertTriangle, X, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ConfirmationModalProps {
  title: string;
  titleAm: string;
  message: string;
  messageAm: string;
  confirmLabel?: string;
  confirmLabelAm?: string;
  cancelLabel?: string;
  cancelLabelAm?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  title,
  titleAm,
  message,
  messageAm,
  confirmLabel = 'Confirm',
  confirmLabelAm = 'አረጋግጥ',
  cancelLabel = 'Cancel',
  cancelLabelAm = 'ሰርዝ',
  isDestructive = false,
  onConfirm,
  onClose,
}) => {
  const { language } = useApp();

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              isDestructive
                ? 'bg-red-100 text-red-600'
                : 'bg-amber-100 text-amber-600'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm text-slate-900">
              {language === 'am' ? titleAm : title}
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {language === 'am' ? messageAm : message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            {language === 'am' ? cancelLabelAm : cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition active:scale-95 flex items-center gap-1.5 ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{language === 'am' ? confirmLabelAm : confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
