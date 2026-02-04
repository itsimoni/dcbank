"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { Alert, AlertDescription } from "../ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  DollarSign,
  FileText,
  User,
  Briefcase,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Info,
  FileSignature,
  Languages,
  Check,
  ChevronDown,
} from "lucide-react";
import { Language, getTranslations } from "../../lib/translations";
import { useLanguage } from "../../contexts/LanguageContext";

type LoansSectionProps = {};

interface LoanFormData {
  loanType: string;
  loanAmount: string;
  loanPurpose: string;
  employmentStatus: string;
  monthlyIncome: string;
  employerName: string;
  employmentDuration: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  dateOfBirth: string;
  ssn: string;
  creditScore: string;
  existingDebts: string;
  collateral: string;
  additionalInfo: string;
}

const initialFormData: LoanFormData = {
  loanType: "",
  loanAmount: "",
  loanPurpose: "",
  employmentStatus: "",
  monthlyIncome: "",
  employerName: "",
  employmentDuration: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  country: "",
  postalCode: "",
  dateOfBirth: "",
  ssn: "",
  creditScore: "",
  existingDebts: "",
  collateral: "",
  additionalInfo: "",
};

export default function LoansSection({}: LoansSectionProps) {
  const [formData, setFormData] = useState<LoanFormData>(initialFormData);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRestrictionDialog, setShowRestrictionDialog] = useState(false);
  const [errors, setErrors] = useState<Partial<LoanFormData>>({});
  const { language, setLanguage } = useLanguage();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const t = getTranslations(language);
  const totalSteps = 4;

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'es', label: 'Español' },
    { code: 'it', label: 'Italiano' },
    { code: 'el', label: 'Ελληνικά' },
  ];

  const loanTypes = [
    { value: "personal", label: t.personalLoan },
    { value: "business", label: t.businessLoan },
    { value: "mortgage", label: t.mortgageLoan },
    { value: "auto", label: t.autoLoan },
    { value: "student", label: t.studentLoan },
    { value: "home-equity", label: t.homeEquityLoan },
  ];

  const employmentStatuses = [
    { value: "employed", label: t.employedFullTime },
    { value: "part-time", label: t.employedPartTime },
    { value: "self-employed", label: t.selfEmployed },
    { value: "unemployed", label: t.unemployed },
    { value: "retired", label: t.retired },
    { value: "student", label: t.student },
  ];

  const countries = [
    { value: "us", label: t.unitedStates },
    { value: "ca", label: t.canada },
    { value: "uk", label: t.unitedKingdom },
    { value: "de", label: t.germany },
    { value: "fr", label: t.france },
    { value: "au", label: t.australia },
    { value: "jp", label: t.japan },
    { value: "other", label: t.other },
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

  const handleInputChange = useCallback(
    (field: keyof LoanFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  const validateStep = useCallback(
    (step: number): boolean => {
      const newErrors: Partial<LoanFormData> = {};

      switch (step) {
        case 1:
          if (!formData.loanType)
            newErrors.loanType = t.loanTypeRequired;
          if (!formData.loanAmount)
            newErrors.loanAmount = t.loanAmountRequired;
          if (!formData.loanPurpose)
            newErrors.loanPurpose = t.purposeOfLoanRequired;
          break;
        case 2:
          if (!formData.employmentStatus)
            newErrors.employmentStatus = t.employmentStatusRequired;
          if (!formData.monthlyIncome)
            newErrors.monthlyIncome = t.monthlyIncomeRequired;
          if (
            formData.employmentStatus === "employed" ||
            formData.employmentStatus === "part-time"
          ) {
            if (!formData.employerName)
              newErrors.employerName = t.employerNameRequired;
            if (!formData.employmentDuration)
              newErrors.employmentDuration = t.employmentDurationRequired;
          }
          break;
        case 3:
          if (!formData.firstName)
            newErrors.firstName = t.firstNameRequired;
          if (!formData.lastName) newErrors.lastName = t.lastNameRequired;
          if (!formData.email) newErrors.email = t.emailRequired;
          if (!formData.phone) newErrors.phone = t.phoneRequired;
          if (!formData.address) newErrors.address = t.addressRequired;
          if (!formData.city) newErrors.city = t.cityRequired;
          if (!formData.country) newErrors.country = t.countryRequired;
          if (!formData.dateOfBirth)
            newErrors.dateOfBirth = t.dateOfBirthRequired;
          break;
        case 4:
          if (!formData.ssn) newErrors.ssn = t.ssnTaxIdRequired;
          break;
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [formData, t]
  );

  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  }, [currentStep, validateStep]);

  const handlePrevious = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    setShowRestrictionDialog(true);
  }, [currentStep, validateStep]);

  const getCountryLabel = useCallback((countryCode: string) => {
    const country = countries.find((c) => c.value === countryCode);
    return country?.label || countryCode;
  }, [countries]);

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <FileSignature className="h-12 w-12 text-[#F26623] mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900">{t.loanDetails}</h3>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="loanType">{t.loanType} *</Label>
          <Select
            value={formData.loanType}
            onValueChange={(value) => handleInputChange("loanType", value)}
          >
            <SelectTrigger className={errors.loanType ? "border-red-500" : ""}>
              <SelectValue placeholder={t.selectLoanType} />
            </SelectTrigger>
            <SelectContent>
              {loanTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.loanType && (
            <p className="text-red-500 text-sm mt-1">{errors.loanType}</p>
          )}
        </div>

        <div>
          <Label htmlFor="loanAmount">{t.loanAmount} *</Label>
          <Input
            id="loanAmount"
            type="number"
            placeholder={t.loanAmountPlaceholder}
            value={formData.loanAmount}
            onChange={(e) => handleInputChange("loanAmount", e.target.value)}
            className={errors.loanAmount ? "border-red-500" : ""}
          />
          {errors.loanAmount && (
            <p className="text-red-500 text-sm mt-1">{errors.loanAmount}</p>
          )}
        </div>

        <div>
          <Label htmlFor="loanPurpose">{t.purposeOfLoan} *</Label>
          <Textarea
            id="loanPurpose"
            placeholder={t.purposeOfLoanPlaceholder}
            value={formData.loanPurpose}
            onChange={(e) => handleInputChange("loanPurpose", e.target.value)}
            className={errors.loanPurpose ? "border-red-500" : ""}
            rows={4}
          />
          {errors.loanPurpose && (
            <p className="text-red-500 text-sm mt-1">{errors.loanPurpose}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Briefcase className="h-12 w-12 text-[#F26623] mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900">
          {t.employmentInformation}
        </h3>
        <p className="text-gray-600 mt-2">
          {t.employmentInformationSubtitle}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="employmentStatus">{t.employmentStatus} *</Label>
          <Select
            value={formData.employmentStatus}
            onValueChange={(value) =>
              handleInputChange("employmentStatus", value)
            }
          >
            <SelectTrigger
              className={errors.employmentStatus ? "border-red-500" : ""}
            >
              <SelectValue placeholder={t.selectEmploymentStatus} />
            </SelectTrigger>
            <SelectContent>
              {employmentStatuses.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.employmentStatus && (
            <p className="text-red-500 text-sm mt-1">
              {errors.employmentStatus}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="monthlyIncome">{t.monthlyIncome} *</Label>
          <Input
            id="monthlyIncome"
            type="number"
            placeholder={t.monthlyIncomePlaceholder}
            value={formData.monthlyIncome}
            onChange={(e) => handleInputChange("monthlyIncome", e.target.value)}
            className={errors.monthlyIncome ? "border-red-500" : ""}
          />
          {errors.monthlyIncome && (
            <p className="text-red-500 text-sm mt-1">{errors.monthlyIncome}</p>
          )}
        </div>

        {(formData.employmentStatus === "employed" ||
          formData.employmentStatus === "part-time") && (
          <>
            <div>
              <Label htmlFor="employerName">{t.employerName} *</Label>
              <Input
                id="employerName"
                placeholder={t.employerNamePlaceholder}
                value={formData.employerName}
                onChange={(e) =>
                  handleInputChange("employerName", e.target.value)
                }
                className={errors.employerName ? "border-red-500" : ""}
              />
              {errors.employerName && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.employerName}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="employmentDuration">{t.employmentDuration} *</Label>
              <Input
                id="employmentDuration"
                placeholder={t.employmentDurationPlaceholder}
                value={formData.employmentDuration}
                onChange={(e) =>
                  handleInputChange("employmentDuration", e.target.value)
                }
                className={errors.employmentDuration ? "border-red-500" : ""}
              />
              {errors.employmentDuration && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.employmentDuration}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <User className="h-12 w-12 text-[#F26623] mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900">
          {t.personalInformation}
        </h3>
        <p className="text-gray-600 mt-2">
          {t.personalInformationSubtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">{t.firstName} *</Label>
          <Input
            id="firstName"
            placeholder={t.firstNamePlaceholder}
            value={formData.firstName}
            onChange={(e) => handleInputChange("firstName", e.target.value)}
            className={errors.firstName ? "border-red-500" : ""}
          />
          {errors.firstName && (
            <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
          )}
        </div>

        <div>
          <Label htmlFor="lastName">{t.lastName} *</Label>
          <Input
            id="lastName"
            placeholder={t.lastNamePlaceholder}
            value={formData.lastName}
            onChange={(e) => handleInputChange("lastName", e.target.value)}
            className={errors.lastName ? "border-red-500" : ""}
          />
          {errors.lastName && (
            <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email">{t.emailAddress} *</Label>
          <Input
            id="email"
            type="email"
            placeholder={t.emailPlaceholder}
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">{t.phoneNumber} *</Label>
          <Input
            id="phone"
            placeholder={t.phonePlaceholder}
            value={formData.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            className={errors.phone ? "border-red-500" : ""}
          />
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="address">{t.address} *</Label>
          <Input
            id="address"
            placeholder={t.addressPlaceholder}
            value={formData.address}
            onChange={(e) => handleInputChange("address", e.target.value)}
            className={errors.address ? "border-red-500" : ""}
          />
          {errors.address && (
            <p className="text-red-500 text-sm mt-1">{errors.address}</p>
          )}
        </div>

        <div>
          <Label htmlFor="city">{t.city} *</Label>
          <Input
            id="city"
            placeholder={t.cityPlaceholder}
            value={formData.city}
            onChange={(e) => handleInputChange("city", e.target.value)}
            className={errors.city ? "border-red-500" : ""}
          />
          {errors.city && (
            <p className="text-red-500 text-sm mt-1">{errors.city}</p>
          )}
        </div>

        <div>
          <Label htmlFor="country">{t.country} *</Label>
          <Select
            value={formData.country}
            onValueChange={(value) => handleInputChange("country", value)}
          >
            <SelectTrigger className={errors.country ? "border-red-500" : ""}>
              <SelectValue placeholder={t.selectCountry} />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.value} value={country.value}>
                  {country.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.country && (
            <p className="text-red-500 text-sm mt-1">{errors.country}</p>
          )}
        </div>

        <div>
          <Label htmlFor="postalCode">{t.postalCode}</Label>
          <Input
            id="postalCode"
            placeholder={t.postalCodePlaceholder}
            value={formData.postalCode}
            onChange={(e) => handleInputChange("postalCode", e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="dateOfBirth">{t.dateOfBirth} *</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
            className={errors.dateOfBirth ? "border-red-500" : ""}
          />
          {errors.dateOfBirth && (
            <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <FileText className="h-12 w-12 text-[#F26623] mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900">
          {t.financialInformation}
        </h3>
        <p className="text-gray-600 mt-2">
          {t.financialInformationSubtitle}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="ssn">{t.ssnTaxId} *</Label>
          <Input
            id="ssn"
            placeholder={t.ssnTaxIdPlaceholder}
            value={formData.ssn}
            onChange={(e) => handleInputChange("ssn", e.target.value)}
            className={errors.ssn ? "border-red-500" : ""}
          />
          {errors.ssn && (
            <p className="text-red-500 text-sm mt-1">{errors.ssn}</p>
          )}
        </div>

        <div>
          <Label htmlFor="creditScore">{t.creditScore}</Label>
          <Input
            id="creditScore"
            type="number"
            placeholder={t.creditScorePlaceholder}
            value={formData.creditScore}
            onChange={(e) => handleInputChange("creditScore", e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="existingDebts">{t.existingDebts}</Label>
          <Input
            id="existingDebts"
            type="number"
            placeholder={t.existingDebtsPlaceholder}
            value={formData.existingDebts}
            onChange={(e) => handleInputChange("existingDebts", e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="collateral">{t.collateral}</Label>
          <Textarea
            id="collateral"
            placeholder={t.collateralPlaceholder}
            value={formData.collateral}
            onChange={(e) => handleInputChange("collateral", e.target.value)}
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="additionalInfo">{t.additionalInformation}</Label>
          <Textarea
            id="additionalInfo"
            placeholder={t.additionalInformationPlaceholder}
            value={formData.additionalInfo}
            onChange={(e) =>
              handleInputChange("additionalInfo", e.target.value)
            }
            rows={3}
          />
        </div>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return renderStep1();
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-gray-50 overflow-auto pt-xs-16">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 sm:mb-8 flex justify-between items-start gap-4">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
              {t.loanApplication}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {t.loanApplicationSubtitle}
            </p>
          </div>

          <div ref={dropdownRef} className="relative inline-block flex-shrink-0">
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

        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                    step <= currentStep
                      ? "bg-[#F26623] text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step < currentStep ? (
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                  ) : (
                    step
                  )}
                </div>
                {step < totalSteps && (
                  <div
                    className={`w-8 sm:w-16 h-1 mx-1 sm:mx-2 ${
                      step < currentStep ? "bg-[#F26623]" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <span className="text-xs sm:text-sm text-gray-600">
              {t.stepXOfY.replace('{{current}}', currentStep.toString()).replace('{{total}}', totalSteps.toString())}
            </span>
          </div>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="bg-[#F5F0F0] border-b p-6">
            <CardTitle className="flex items-center text-lg">
              {t.digitalChainBankLoanApplication}
              <Badge className="ml-2 bg-[#F26623] text-white">{t.secure}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {renderStepContent()}

            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="bg-transparent order-2 sm:order-1"
              >
                {t.previous}
              </Button>

              {currentStep < totalSteps ? (
                <Button
                  onClick={handleNext}
                  className="bg-[#F26623] hover:bg-[#E55A1F] text-white order-1 sm:order-2"
                >
                  {t.nextStep}
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-[#F26623] hover:bg-[#E55A1F] text-white order-1 sm:order-2"
                >
                  {isSubmitting ? t.processing : t.submitApplication}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8">
          <Card>
            <CardContent className="p-4 sm:p-6 text-center">
              <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-[#F26623] mx-auto mb-3 sm:mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">
                {t.quickApproval}
              </h3>
              <p className="text-sm text-gray-600">
                {t.quickApprovalDesc}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6 text-center">
              <CreditCard className="h-10 w-10 sm:h-12 sm:w-12 text-[#F26623] mx-auto mb-3 sm:mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">
                {t.competitiveRates}
              </h3>
              <p className="text-sm text-gray-600">
                {t.competitiveRatesDesc}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6 text-center">
              <Info className="h-10 w-10 sm:h-12 sm:w-12 text-[#F26623] mx-auto mb-3 sm:mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">
                {t.noHiddenFees}
              </h3>
              <p className="text-sm text-gray-600">
                {t.noHiddenFeesDesc}
              </p>
            </CardContent>
          </Card>
        </div>

        <Dialog
          open={showRestrictionDialog}
          onOpenChange={setShowRestrictionDialog}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <DialogTitle className="text-center text-xl font-semibold text-gray-900">
                {t.applicationNotAvailable}
              </DialogTitle>
              <DialogDescription className="text-center text-gray-600 mt-4">
                {t.applicationNotAvailableMessage}
                <br />
                <br />
                {t.applicationNotAvailableMessage2}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6">
              <Alert className="border-amber-200 bg-amber-50">
                <Info className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  {t.ineligibleDueToResidency}
                </AlertDescription>
              </Alert>
            </div>
            <div className="flex justify-center mt-6">
              <Button
                onClick={() => setShowRestrictionDialog(false)}
                className="bg-[#F26623] hover:bg-[#E55A1F] text-white"
              >
                {t.iUnderstand}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
