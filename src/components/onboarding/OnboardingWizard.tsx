import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BusinessType, Language } from '../../types';
import { Sparkles, ArrowRight, ArrowLeft, CheckCircle2, Store, X } from 'lucide-react';

interface OnboardingWizardProps {
  onClose: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onClose }) => {
  const { updateBusiness, setLanguage, language } = useApp();

  const [step, setStep] = useState(1);

  // Form states
  const [bizName, setBizName] = useState('');
  const [bizAmName, setBizAmName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [businessType, setBusinessType] = useState<BusinessType>('Shop');
  const [region, setRegion] = useState('Addis Ababa');
  const [city, setCity] = useState('Addis Ababa');
  const [subCity, setSubCity] = useState('Bole');
  const [woreda, setWoreda] = useState('Woreda 03');
  const [address, setAddress] = useState('');
  const [prefLang, setPrefLang] = useState<Language>('am');
  const [currency] = useState('ETB');
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxRate, setTaxRate] = useState(15);

  const businessTypes: BusinessType[] = [
    'Shop',
    'Café',
    'Restaurant',
    'Salon',
    'Boutique',
    'Electronics',
    'Phone Shop',
    'Wholesale',
    'Service Business',
    'Freelancer',
    'Other',
  ];

  const handleFinish = () => {
    updateBusiness({
      name: bizName || 'My Ethiopian Store',
      amharicName: bizAmName || bizName,
      ownerName: ownerName || 'Abebe',
      phone: phone || '0911000000',
      email: email || undefined,
      businessType,
      region,
      city,
      subCity,
      woreda,
      address,
      language: prefLang,
      currency: 'ETB',
      taxEnabled,
      taxRatePercent: taxRate,
    });
    setLanguage(prefLang);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs">
              🇪🇹
            </div>
            <div>
              <h3 className="font-bold text-sm">
                {language === 'am' ? 'አዲስ ንግድ ምዝገባ (Onboarding Wizard)' : 'Business Setup Wizard'}
              </h3>
              <p className="text-[10px] text-slate-400">
                {language === 'am' ? `ደረጃ ${step} ከ 6` : `Step ${step} of 6`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-1">
          <div
            className="bg-blue-600 h-1 transition-all duration-300"
            style={{ width: `${(step / 6) * 100}%` }}
          />
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {step === 1 && (
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-slate-900">
                {language === 'am' ? 'የንግድ ድርጅትዎ ስም ማን ይባላል?' : 'What is your Business Name?'}
              </h4>
              <p className="text-slate-500">
                {language === 'am' ? 'በደረሰኞችና በሂሳብ መግለጫዎች ላይ የሚወጣውን ስም ያስገቡ።' : 'Enter the official store name for digital receipts.'}
              </p>
              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  {language === 'am' ? 'የንግድ ስም (እንግሊዝኛ):' : 'Business Name (English):'}
                </label>
                <input
                  type="text"
                  value={bizName}
                  onChange={(e) => setBizName(e.target.value)}
                  placeholder="e.g. Merkato Supermarket"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-sm font-semibold"
                />
              </div>
              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  {language === 'am' ? 'የንግድ ስም (በአማርኛ):' : 'Business Name (Amharic):'}
                </label>
                <input
                  type="text"
                  value={bizAmName}
                  onChange={(e) => setBizAmName(e.target.value)}
                  placeholder="ለምሳሌ: መርካቶ ሱፐርማርኬት"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-sm font-semibold"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-slate-900">
                {language === 'am' ? 'የባለቤቱ ስም እና ስልክ ቁጥር' : 'Owner Name & Contact'}
              </h4>
              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  {language === 'am' ? 'የባለቤት ሙሉ ስም:' : 'Owner Full Name:'}
                </label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. አበበ ከበደ"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  {language === 'am' ? 'ስልክ ቁጥር (የኢትዮጵያ):' : 'Phone Number (+251):'}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0911000000"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-sm font-mono"
                />
              </div>
              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  {language === 'am' ? 'ኢሜይል (አማራጭ):' : 'Email (Optional):'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="store@example.com"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-slate-900">
                {language === 'am' ? 'የንግዱ አይነት ምንድነው?' : 'Select Business Type'}
              </h4>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                {businessTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setBusinessType(type)}
                    className={`p-3 rounded-xl border text-left font-semibold transition ${
                      businessType === type
                        ? 'bg-blue-50 border-blue-600 text-blue-700'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-slate-900">
                {language === 'am' ? 'የንግዱ አድራሻ' : 'Business Location Address'}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-600 font-medium block mb-1">ክልል / Region:</label>
                  <input
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-medium block mb-1">ከተማ / City:</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-600 font-medium block mb-1">ክፍለ ከተማ / Sub-city:</label>
                  <input
                    type="text"
                    value={subCity}
                    onChange={(e) => setSubCity(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-medium block mb-1">ወረዳ / Woreda:</label>
                  <input
                    type="text"
                    value={woreda}
                    onChange={(e) => setWoreda(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-600 font-medium block mb-1">ዝርዝር አድራሻ (መንገድ/ህንጻ):</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="ለምሳሌ: ቦሌ መድኃኔዓለም፣ ኤድና ሞል ጀርባ"
                  className="w-full p-2 rounded-xl border border-slate-300"
                />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-slate-900">
                {language === 'am' ? 'ቋንቋና የግብር ቅንብር' : 'Language & Tax Settings'}
              </h4>
              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  {language === 'am' ? 'የሚመርጡት ቋንቋ:' : 'Preferred Language:'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPrefLang('am')}
                    className={`p-3 rounded-xl border text-center font-bold ${
                      prefLang === 'am' ? 'bg-amber-50 border-amber-600 text-amber-900' : 'border-slate-200'
                    }`}
                  >
                    አማርኛ 🇪🇹
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrefLang('en')}
                    className={`p-3 rounded-xl border text-center font-bold ${
                      prefLang === 'en' ? 'bg-blue-50 border-blue-600 text-blue-900' : 'border-slate-200'
                    }`}
                  >
                    English 🇬🇧
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <label className="text-slate-700 font-semibold block mb-1">
                  {language === 'am' ? 'የገንዘብ አይነት:' : 'Currency:'}
                </label>
                <div className="p-2.5 rounded-xl bg-slate-100 font-bold text-slate-800">
                  ETB / የኢትዮጵያ ብር (Default)
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="taxCheck"
                    checked={taxEnabled}
                    onChange={(e) => setTaxEnabled(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="taxCheck" className="font-semibold text-slate-800">
                    {language === 'am' ? 'የተጨማሪ እሴት ታክስ (VAT 15%) አግብር' : 'Enable 15% VAT on receipts'}
                  </label>
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4 text-center py-2">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-base text-slate-900">
                  {language === 'am' ? 'ምዝገባው ተጠናቋል!' : 'Ready to Launch!'}
                </h4>
                <p className="text-slate-500 mt-1">
                  {bizName || 'ሰላም ሱቅ'} - {ownerName || 'ባለቤት'}
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  {language === 'am'
                    ? 'አስተዳዳሪው ስራ ሲጀምር ነባሪ የክፍያ ዘዴዎች፣ ምድቦች እና ቅርንጫፎች በራስ-ሰር ይዘጋጃሉ።'
                    : 'Your tenant workspace and owner permissions will be configured automatically.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{language === 'am' ? 'ተመለስ' : 'Back'}</span>
            </button>
          ) : (
            <div />
          )}

          {step < 6 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <span>{language === 'am' ? 'ቀጣይ' : 'Next'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <span>{language === 'am' ? 'ስርዓቱን ጀምር' : 'Launch System'}</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
