import React, { useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Sale } from '../../types';
import { Printer, Download, Share2, X, CheckCircle } from 'lucide-react';

interface ReceiptModalProps {
  sale: Sale;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose }) => {
  const { business, language } = useApp();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${business.name} Receipt - ${sale.invoiceNumber}`,
        text: `Receipt for ${sale.total} ETB from ${business.name}. Invoice #${sale.invoiceNumber}`,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(
        `*${business.name}*\nደረሰኝ #${sale.invoiceNumber}\nጠቅላላ: ${sale.total} ETB\nየተከፈለ: ${sale.amountPaid} ETB\nእናመሰግናለን!`
      );
      alert(language === 'am' ? 'የደረሰኙ መረጃ ተቀድቷል (Copied)!' : 'Receipt details copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Actions Header */}
        <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-sm">
              {language === 'am' ? 'ዲጂታል ደረሰኝ (Receipt)' : 'Digital Receipt'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1"
              title="Print"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">{language === 'am' ? 'አትም' : 'Print'}</span>
            </button>
            <button
              onClick={handleShare}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">{language === 'am' ? 'አጋራ' : 'Share'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div ref={printRef} className="p-6 overflow-y-auto font-mono text-slate-800 text-xs space-y-4 bg-slate-50">
          {/* Header */}
          <div className="text-center border-b border-dashed border-slate-300 pb-4">
            <div className="inline-block p-2 rounded-full bg-blue-100 text-blue-800 font-bold text-sm mb-1">
              🇪🇹 {business.amharicName || business.name}
            </div>
            <p className="font-bold text-sm text-slate-900">{business.name}</p>
            <p className="text-[11px] text-slate-600">{business.address || 'Bole, Addis Ababa'}</p>
            <p className="text-[11px] text-slate-600">ስልክ / Tel: {business.phone}</p>
            {business.tinNumber && (
              <p className="text-[10px] text-slate-500">TIN: {business.tinNumber}</p>
            )}
            <div className="mt-2 py-1 bg-slate-200/60 rounded text-[11px] font-semibold text-slate-800">
              INVOICE / የሽያጭ ደረሰኝ #{sale.invoiceNumber}
            </div>
          </div>

          {/* Meta */}
          <div className="flex justify-between text-[11px] text-slate-600">
            <div>
              <p>ቀን: {new Date(sale.createdAt).toLocaleDateString()}</p>
              <p>ሰዓት: {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div className="text-right">
              <p>ገንዘብ ተቀባይ: {sale.cashierName}</p>
              <p>ደንበኛ: {sale.customerName || 'የመንገድ ደንበኛ (Walk-in)'}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="border-t border-b border-dashed border-slate-300 py-2">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] text-slate-500 uppercase border-b border-slate-200 pb-1">
                  <th className="py-1">እቃ (Item)</th>
                  <th className="text-center py-1">ብዛት</th>
                  <th className="text-right py-1">ዋጋ</th>
                  <th className="text-right py-1">ድምር</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {sale.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-1.5 pr-1 font-sans font-medium text-slate-800">
                      {item.productName}
                    </td>
                    <td className="text-center py-1.5 text-slate-600">{item.quantity}</td>
                    <td className="text-right py-1.5 text-slate-600">{item.unitPrice}</td>
                    <td className="text-right py-1.5 font-semibold text-slate-900">{item.subtotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Totals */}
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between text-slate-600">
              <span>ንዑስ ድምር (Subtotal):</span>
              <span>{sale.subtotal.toLocaleString()} ETB</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>ቅናሽ (Discount):</span>
                <span>-{sale.discount.toLocaleString()} ETB</span>
              </div>
            )}
            {sale.tax > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>ግብር/ቫት (Tax {business.taxRatePercent}%):</span>
                <span>+{sale.tax.toLocaleString()} ETB</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
              <span>ጠቅላላ ድምር (TOTAL):</span>
              <span>{sale.total.toLocaleString()} ETB</span>
            </div>
          </div>

          {/* Payment Details */}
          <div className="p-2.5 rounded-lg bg-slate-200/60 text-[11px] space-y-1">
            <div className="flex justify-between font-semibold text-slate-800">
              <span>የክፍያ ዘዴ (Method):</span>
              <span className="uppercase text-blue-700">{sale.paymentMethod}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>የተከፈለ ገንዘብ (Paid):</span>
              <span className="font-bold text-emerald-700">{sale.amountPaid.toLocaleString()} ETB</span>
            </div>
            {sale.creditAmount > 0 && (
              <div className="flex justify-between text-red-700 font-bold pt-1 border-t border-slate-300">
                <span>በብድር የቀረ (Remaining Debt):</span>
                <span>{sale.creditAmount.toLocaleString()} ETB</span>
              </div>
            )}
          </div>

          {/* Footer & QR Simulation */}
          <div className="text-center pt-2 space-y-2">
            <div className="inline-flex flex-col items-center p-2 bg-white rounded border border-slate-200">
              {/* SVG QR Code Simulation */}
              <div className="w-20 h-20 bg-slate-900 p-1 flex items-center justify-center">
                <div className="grid grid-cols-4 gap-0.5 w-full h-full p-1 bg-white">
                  <div className="bg-slate-900"></div>
                  <div className="bg-slate-900"></div>
                  <div></div>
                  <div className="bg-slate-900"></div>
                  <div></div>
                  <div className="bg-slate-900"></div>
                  <div className="bg-slate-900"></div>
                  <div></div>
                  <div className="bg-slate-900"></div>
                  <div></div>
                  <div className="bg-slate-900"></div>
                  <div className="bg-slate-900"></div>
                  <div className="bg-slate-900"></div>
                  <div className="bg-slate-900"></div>
                  <div></div>
                  <div className="bg-slate-900"></div>
                </div>
              </div>
              <span className="text-[9px] text-slate-500 mt-1 font-mono">
                VERIFIED #{sale.invoiceNumber}
              </span>
            </div>
            <p className="font-sans font-semibold text-xs text-slate-800">
              {language === 'am' ? 'ስለጎበኙን እናመሰግናለን! እንደገና ይምጡ!' : 'Thank you for your business! Please come again!'}
            </p>
            <p className="text-[10px] text-slate-400">
              Powered by Ethio Business Helper SaaS
            </p>
          </div>
        </div>

        {/* Bottom Done Button */}
        <div className="p-3 bg-white border-t border-slate-200">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition"
          >
            {language === 'am' ? 'እሺ (ተጠናቋል)' : 'Done / Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
