import { ArrowLeft, Copy, Building2, Clock, AlertCircle, Globe } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase, FundAccount } from '../../lib/supabase';
import { useLanguage } from '../../contexts/LanguageContext';
import { Language, getTranslations } from '../../lib/translations';

interface BankTransferFormProps {
  onBack: () => void;
}

const languageNames: Record<Language, string> = {
  en: "English",
  fr: "Français",
  de: "Deutsch",
  es: "Español",
  it: "Italiano",
};

export default function BankTransferForm({ onBack }: BankTransferFormProps) {
  const { language, setLanguage } = useLanguage();
  const t = getTranslations(language);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [currentStep, setCurrentStep] = useState(2);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    amount: '',
    termsAccepted: false,
    bankTransferAware: false,
  });
  const [bankDetails, setBankDetails] = useState({
    beneficiary: '',
    iban: '',
    bic: '',
    bank: '',
    reference: 'REF-' + Math.random().toString(36).substring(2, 10).toUpperCase()
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState<FundAccount[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(true);

  useEffect(() => {
    const fetchUserBankDetails = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: bankData, error: bankError } = await supabase
            .from('user_bank_details')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (bankData) {
            setBankDetails(prev => ({
              ...prev,
              beneficiary: bankData.beneficiary,
              iban: bankData.iban,
              bic: bankData.bic,
              bank: bankData.bank_name,
            }));
          }
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserBankDetails();
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      setIsLoadingPending(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setIsLoadingPending(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('fund_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('funding_method', 'bank')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (!fetchError && data) {
        setPendingRequests(data);
      }
    } catch (err) {
      console.error('Error fetching pending requests:', err);
    } finally {
      setIsLoadingPending(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.email || !formData.amount) {
      setError(t.fillAllFieldsError);
      return;
    }

    if (!formData.termsAccepted || !formData.bankTransferAware) {
      setError(t.acceptTermsError);
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError(t.mustBeLoggedInError);
        setIsSubmitting(false);
        return;
      }

      const { error: insertError } = await supabase
        .from('fund_accounts')
        .insert({
          user_id: user.id,
          funding_method: 'bank',
          status: 'pending',
          amount: parseFloat(formData.amount) || 0,
          currency: 'EUR',
          user_name: formData.name,
          user_email: formData.email,
          bank_beneficiary: bankDetails.beneficiary,
          bank_iban: bankDetails.iban,
          bank_bic: bankDetails.bic,
          bank_name: bankDetails.bank,
          reference_number: bankDetails.reference,
        });

      if (insertError) {
        setError(t.fundingRequestFailedError.replace('{{message}}', insertError.message));
        setIsSubmitting(false);
        return;
      }

      setCurrentStep(3);
    } catch (err) {
      setError(t.unexpectedError);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            {t.fundAccountTitle}
          </h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Globe className="w-5 h-5" />
                {languageNames[language]}
              </button>
              {showLanguageMenu && (
                <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[140px]">
                  {(Object.keys(languageNames) as Language[]).map((lang) => (
                    <button
                      key={lang}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg"
                      onClick={() => {
                        setLanguage(lang);
                        setShowLanguageMenu(false);
                      }}
                    >
                      {languageNames[lang]}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-6 py-3 bg-[#F26623] text-white rounded-lg hover:bg-[#D94F0F] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              {t.bankTransferBackButton}
            </button>
          </div>
        </div>

        {!isLoadingPending && pendingRequests.length > 0 && currentStep !== 3 && (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-6 mb-8 rounded-r-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-amber-900 mb-2">
                  {pendingRequests.length === 1
                    ? t.pendingRequestsAlert.replace('{{count}}', String(pendingRequests.length))
                    : t.pendingRequestsAlertPlural.replace('{{count}}', String(pendingRequests.length))
                  }
                </h3>
                <div className="space-y-3">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="bg-white rounded-lg p-4 border border-amber-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-600" />
                          <span className="text-sm font-medium text-gray-900">
                            {request.amount} {request.currency}
                          </span>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          {t.pendingStatus}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 mb-1">
                        {t.referenceLabel} <span className="font-mono font-semibold">{request.reference_number}</span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {t.submittedOnLabel} {new Date(request.created_at).toLocaleDateString()} {t.atLabel} {new Date(request.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-amber-800 mt-3">
                  {t.previousRequestsProcessing}
                </p>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl p-12 text-center">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {t.transferPendingTitle}
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                {t.transferPendingMessage}
              </p>
              <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
                <h3 className="font-semibold text-gray-900 mb-3">{t.whatHappensNextTitle}</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-[#F26623] mt-1">•</span>
                    <span>{t.whatHappensStep1}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F26623] mt-1">•</span>
                    <span>{t.whatHappensStep2}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F26623] mt-1">•</span>
                    <span>{t.whatHappensStep3}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F26623] mt-1">•</span>
                    <span>{t.whatHappensStep4}</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={onBack}
                className="px-8 py-3 bg-[#F26623] text-white rounded-lg hover:bg-[#D94F0F] transition-colors font-medium"
              >
                {t.returnToDashboard}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-gray-100 rounded-2xl p-8 md:p-12">
                <h2 className="text-2xl font-semibold text-gray-900 mb-8">
                  {t.fillFieldsBelow}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      {t.yourNameLabel}
                    </label>
                    <input
                      type="text"
                      id="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#F26623] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      {t.emailAddressLabel}
                    </label>
                    <input
                      type="email"
                      id="email"
                      placeholder="john@mail.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#F26623] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                      {t.bankTransferAmountLabel}
                    </label>
                    <input
                      type="text"
                      id="amount"
                      placeholder="EUR"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#F26623] focus:border-transparent"
                    />
                  </div>

                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={formData.termsAccepted}
                      onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
                      className="mt-1 w-4 h-4 rounded border-gray-300 text-[#F26623] focus:ring-[#F26623]"
                    />
                    <label htmlFor="terms" className="text-sm text-gray-700">
                      {t.termsCheckbox}{' '}
                      <a href="#" className="text-[#F26623] hover:underline">
                        {t.termsAndConditions}
                      </a>
                      .
                    </label>
                  </div>

                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="bankTransfer"
                      checked={formData.bankTransferAware}
                      onChange={(e) => setFormData({ ...formData, bankTransferAware: e.target.checked })}
                      className="mt-1 w-4 h-4 rounded border-gray-300 text-[#F26623] focus:ring-[#F26623]"
                    />
                    <label htmlFor="bankTransfer" className="text-sm text-gray-700">
                      {t.bankTransferCheckbox}
                    </label>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || isLoading}
                    className="w-full md:w-auto px-8 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? t.processingButton : isLoading ? t.loadingButton : t.continueButton}
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-2xl p-8 md:p-12">
                <div className="w-full max-w-md mx-auto">
                  <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                      <Building2 className="w-10 h-10 text-gray-600" />
                    </div>
                  </div>

                  <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
                    {t.bankTransferDetailsTitle}
                  </h3>

                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        {t.beneficiaryLabel}
                      </label>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-gray-900 font-medium">{bankDetails.beneficiary}</span>
                        <button
                          onClick={() => handleCopy(bankDetails.beneficiary)}
                          className="p-2 hover:bg-gray-200 rounded transition-colors"
                          title={t.copyBeneficiary}
                        >
                          <Copy className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        {t.ibanLabel}
                      </label>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-gray-900 font-medium font-mono text-sm">{bankDetails.iban}</span>
                        <button
                          onClick={() => handleCopy(bankDetails.iban.replace(/\s/g, ''))}
                          className="p-2 hover:bg-gray-200 rounded transition-colors"
                          title={t.copyIban}
                        >
                          <Copy className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        {t.bicSwiftLabel}
                      </label>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-gray-900 font-medium font-mono">{bankDetails.bic}</span>
                        <button
                          onClick={() => handleCopy(bankDetails.bic)}
                          className="p-2 hover:bg-gray-200 rounded transition-colors"
                          title={t.copyBic}
                        >
                          <Copy className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        {t.bankNameLabel}
                      </label>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-gray-900 font-medium">{bankDetails.bank}</span>
                        <button
                          onClick={() => handleCopy(bankDetails.bank)}
                          className="p-2 hover:bg-gray-200 rounded transition-colors"
                          title={t.copyBankName}
                        >
                          <Copy className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-center gap-2">
                    <button className="px-4 py-2 bg-[#F26623] text-white rounded-lg text-sm font-medium">
                      {t.amountButtonLabel}
                    </button>
                    <span className="text-lg font-semibold">
                      {formData.amount || '0'} EUR
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#F26623] rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  1
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${currentStep >= 2 ? 'bg-[#F26623]' : 'bg-gray-300'}`}>
                  2
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${currentStep >= 3 ? 'bg-[#F26623]' : 'bg-gray-300'}`}>
                  3
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
