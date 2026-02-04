import { Bitcoin, Building2, Languages, ChevronDown, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Language, getTranslations } from '../../lib/translations';
import { useLanguage } from '../../contexts/LanguageContext';
import CryptoFundingForm from './CryptoFundingForm';
import BankTransferForm from './BankTransferForm';

export default function FundAccount() {
  const [selectedMethod, setSelectedMethod] = useState<'crypto' | 'bank' | null>(null);
  const { language, setLanguage } = useLanguage();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const t = getTranslations(language);

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'es', label: 'Español' },
    { code: 'it', label: 'Italiano' },
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (selectedMethod === 'crypto') {
    return <CryptoFundingForm onBack={() => setSelectedMethod(null)} />;
  }

  if (selectedMethod === 'bank') {
    return <BankTransferForm onBack={() => setSelectedMethod(null)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        {/* Language Selector */}
        <div className="flex justify-end mb-6">
          <div ref={dropdownRef} className="relative inline-block">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 bg-white border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:border-[#F26623] focus:outline-none focus:ring-2 focus:ring-[#F26623] focus:border-transparent cursor-pointer transition-all shadow-sm hover:shadow-md min-w-[160px]"
            >
              <Languages className="w-4 h-4 text-gray-600" />
              <span className="flex-1 text-left">
                {languages.find(lang => lang.code === language)?.label}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-full bg-white border-2 border-gray-200 rounded-lg shadow-lg overflow-hidden z-10">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left transition-colors ${
                      language === lang.code
                        ? 'bg-orange-50 text-[#F26623] font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span>{lang.label}</span>
                    {language === lang.code && (
                      <Check className="w-4 h-4 text-[#F26623]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Header */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-12">
          {t.fundAccountTitle}
        </h1>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4">
              {t.fundAccountSubtitle}
            </h2>
            <p className="text-gray-600">
              {t.fundAccountEncryption}{' '}
              <span className="text-gray-400 italic">{t.additionalInformation}</span>
            </p>
          </div>

          {/* Payment Options Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Crypto Option */}
            <button
              onClick={() => setSelectedMethod('crypto')}
              className="group bg-white border-2 border-gray-200 rounded-xl p-8 text-left transition-all hover:border-[#F26623] hover:shadow-md focus:outline-none focus:border-[#F26623] focus:shadow-md"
            >
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-orange-50 transition-colors">
                  <Bitcoin className="w-8 h-8 text-gray-600 group-hover:text-[#F26623] transition-colors" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {t.cryptoOption}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {t.cryptoDescription}
                  </p>
                </div>
              </div>
            </button>

            {/* Bank Transfer Option */}
            <button
              onClick={() => setSelectedMethod('bank')}
              className="group bg-white border-2 border-gray-200 rounded-xl p-8 text-left transition-all hover:border-[#F26623] hover:shadow-md focus:outline-none focus:border-[#F26623] focus:shadow-md"
            >
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-orange-50 transition-colors">
                  <Building2 className="w-8 h-8 text-gray-600 group-hover:text-[#F26623] transition-colors" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {t.bankTransferOption}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {t.bankTransferDescription}
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="mt-8 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#F26623] rounded-full flex items-center justify-center text-white text-sm font-semibold">
            1
          </div>
          <span className="text-gray-400 text-sm">{t.selectFundingMethod}</span>
        </div>
      </div>
    </div>
  );
}
