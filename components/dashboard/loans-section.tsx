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
import { Checkbox } from "../ui/checkbox";
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
  HelpCircle,
  Shield,
  Lock,
  MapPin,
  Download,
  Mail,
} from "lucide-react";
import { Language, getTranslations } from "../../lib/translations";
import { useLanguage } from "../../contexts/LanguageContext";

type LoansSectionProps = {};

interface LoanFormData {
  residencyStatus: string;
  countryOfResidence: string;
  hasMalteseId: string;
  loanType: string;
  loanAmount: string;
  loanTerm: string;
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
  consentAccuracy: boolean;
  consentPrivacy: boolean;
  consentCreditCheck: boolean;
}

const initialFormData: LoanFormData = {
  residencyStatus: "",
  countryOfResidence: "",
  hasMalteseId: "",
  loanType: "",
  loanAmount: "",
  loanTerm: "",
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
  consentAccuracy: false,
  consentPrivacy: false,
  consentCreditCheck: false,
};

export default function LoansSection({}: LoansSectionProps) {
  const [formData, setFormData] = useState<LoanFormData>(initialFormData);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRestrictionDialog, setShowRestrictionDialog] = useState(false);
  const [showReviewStep, setShowReviewStep] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof LoanFormData, string>>>({});
  const { language, setLanguage } = useLanguage();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [expandedHelp, setExpandedHelp] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const t = getTranslations(language);
  const totalSteps = 5;

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

  const loanTerms = [
    { value: "12", label: `12 ${t.months}` },
    { value: "24", label: `24 ${t.months}` },
    { value: "36", label: `36 ${t.months}` },
    { value: "48", label: `48 ${t.months}` },
    { value: "60", label: `60 ${t.months}` },
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
    { value: "mt", label: "Malta" },
    { value: "us", label: t.unitedStates },
    { value: "ca", label: t.canada },
    { value: "uk", label: t.unitedKingdom },
    { value: "de", label: t.germany },
    { value: "fr", label: t.france },
    { value: "it", label: t.italy },
    { value: "es", label: t.spain },
    { value: "nl", label: t.netherlands },
    { value: "be", label: t.belgium },
    { value: "at", label: t.austria },
    { value: "pt", label: t.portugal },
    { value: "gr", label: t.greece },
    { value: "au", label: t.australia },
    { value: "jp", label: t.japan },
    { value: "other", label: t.other },
  ];

  const residencyStatuses = [
    { value: "citizen", label: t.citizenOfMalta },
    { value: "permanent", label: t.permanentResident },
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

  const calculateMonthlyPayment = () => {
    const amount = parseFloat(formData.loanAmount);
    const term = parseFloat(formData.loanTerm);

    if (!amount || !term) return null;

    const apr = 5.9;
    const monthlyRate = apr / 100 / 12;
    const numPayments = term;

    const monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
                          (Math.pow(1 + monthlyRate, numPayments) - 1);

    const totalRepayable = monthlyPayment * numPayments;

    return {
      monthly: monthlyPayment.toFixed(2),
      apr: apr.toFixed(1),
      total: totalRepayable.toFixed(2)
    };
  };

  const handleInputChange = useCallback(
    (field: keyof LoanFormData, value: string | boolean) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  const toggleHelp = (section: string) => {
    setExpandedHelp(expandedHelp === section ? null : section);
  };

  const validateStep = useCallback(
    (step: number): boolean => {
      const newErrors: Partial<Record<keyof LoanFormData, string>> = {};

      switch (step) {
        case 0:
          if (!formData.residencyStatus)
            newErrors.residencyStatus = `${t.residencyStatus} ${t.required}`;
          if (!formData.countryOfResidence)
            newErrors.countryOfResidence = `${t.countryOfResidence} ${t.required}`;
          break;
        case 1:
          if (!formData.loanType)
            newErrors.loanType = t.loanTypeRequired;
          if (!formData.loanAmount)
            newErrors.loanAmount = t.loanAmountRequired;
          if (!formData.loanTerm)
            newErrors.loanTerm = t.loanTermRequired;
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
          if (!formData.consentAccuracy)
            newErrors.consentAccuracy = t.consentAccuracyError;
          if (!formData.consentPrivacy)
            newErrors.consentPrivacy = t.consentPrivacyError;
          if (!formData.consentCreditCheck)
            newErrors.consentCreditCheck = t.consentCreditCheckError;
          break;
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [formData, t]
  );

  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      if (currentStep === 4) {
        setShowReviewStep(true);
      } else {
        setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
      }
    }
  }, [currentStep, validateStep]);

  const handlePrevious = useCallback(() => {
    if (showReviewStep) {
      setShowReviewStep(false);
    } else {
      setCurrentStep((prev) => Math.max(prev - 1, 0));
    }
  }, [showReviewStep]);

  const handleEligibilityCheck = useCallback(() => {
    if (!validateStep(0)) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowRestrictionDialog(true);
    }, 1500);
  }, [validateStep]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    setShowRestrictionDialog(true);
  }, []);

  const getCountryLabel = useCallback((countryCode: string) => {
    const country = countries.find((c) => c.value === countryCode);
    return country?.label || countryCode;
  }, [countries]);

  const renderStep0 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <MapPin className="h-12 w-12 text-[#b91c1c] mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900">{t.residencyEligibility}</h3>
        <p className="text-gray-600 mt-2 text-sm">
          {t.pleaseConfirmResidency}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="residencyStatus">{t.residencyStatus} *</Label>
          <Select
            value={formData.residencyStatus}
            onValueChange={(value) => handleInputChange("residencyStatus", value)}
          >
            <SelectTrigger className={errors.residencyStatus ? "border-red-500 bg-white" : "bg-white"}>
              <SelectValue placeholder={t.selectResidencyStatus} />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {residencyStatuses.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.residencyStatus && (
            <p className="text-red-500 text-sm mt-1">{errors.residencyStatus}</p>
          )}
        </div>

        <div>
          <Label htmlFor="countryOfResidence">{t.countryOfResidence} *</Label>
          <Select
            value={formData.countryOfResidence}
            onValueChange={(value) => handleInputChange("countryOfResidence", value)}
          >
            <SelectTrigger className={errors.countryOfResidence ? "border-red-500 bg-white" : "bg-white"}>
              <SelectValue placeholder={t.selectCountryOfResidence} />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {countries.map((country) => (
                <SelectItem key={country.value} value={country.value}>
                  {country.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.countryOfResidence && (
            <p className="text-red-500 text-sm mt-1">{errors.countryOfResidence}</p>
          )}
        </div>

        <div>
          <Label htmlFor="hasMalteseId">{t.malteseIdQuestion}</Label>
          <Select
            value={formData.hasMalteseId}
            onValueChange={(value) => handleInputChange("hasMalteseId", value)}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder={t.selectOption} />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="yes">{t.yes}</SelectItem>
              <SelectItem value="no">{t.no}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-center mt-8">
        <Button
          onClick={handleEligibilityCheck}
          disabled={isSubmitting}
          className="bg-[#b91c1c] hover:bg-[#991b1b] text-white px-8"
        >
          {isSubmitting ? t.checking : t.checkEligibility}
        </Button>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <FileSignature className="h-12 w-12 text-[#b91c1c] mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900">{t.loanDetailsTitle}</h3>
        <p className="text-sm text-gray-600 mt-1">{t.estimatedTime}</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="loanType">{t.loanType} *</Label>
          <Select
            value={formData.loanType}
            onValueChange={(value) => handleInputChange("loanType", value)}
          >
            <SelectTrigger className={errors.loanType ? "border-red-500 bg-white" : "bg-white"}>
              <SelectValue placeholder={t.selectLoanType} />
            </SelectTrigger>
            <SelectContent className="bg-white">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="loanAmount">{t.loanAmount} *</Label>
            <Input
              id="loanAmount"
              type="number"
              placeholder={t.loanAmountPlaceholder}
              value={formData.loanAmount}
              onChange={(e) => handleInputChange("loanAmount", e.target.value)}
              className={errors.loanAmount ? "border-red-500 bg-white" : "bg-white"}
            />
            {errors.loanAmount && (
              <p className="text-red-500 text-sm mt-1">{errors.loanAmount}</p>
            )}
          </div>

          <div>
            <Label htmlFor="loanTerm">{t.loanTerm} *</Label>
            <Select
              value={formData.loanTerm}
              onValueChange={(value) => handleInputChange("loanTerm", value)}
            >
              <SelectTrigger className={errors.loanTerm ? "border-red-500 bg-white" : "bg-white"}>
                <SelectValue placeholder={t.selectTerm} />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {loanTerms.map((term) => (
                  <SelectItem key={term.value} value={term.value}>
                    {term.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.loanTerm && (
              <p className="text-red-500 text-sm mt-1">{errors.loanTerm}</p>
            )}
          </div>
        </div>

        {formData.loanAmount && formData.loanTerm && (
          <div className="bg-white border-l-4 border-l-[#b91c1c] p-4 space-y-2">
            <h4 className="font-semibold text-gray-900 text-sm">{t.estimatedLoanCalculator}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600">{t.monthlyRepayment}</p>
                <p className="text-lg font-bold text-gray-900">€{calculateMonthlyPayment()?.monthly}</p>
              </div>
              <div>
                <p className="text-gray-600">{t.representativeAPR}</p>
                <p className="text-lg font-bold text-gray-900">{calculateMonthlyPayment()?.apr}%</p>
              </div>
              <div>
                <p className="text-gray-600">{t.totalRepayable}</p>
                <p className="text-lg font-bold text-gray-900">€{calculateMonthlyPayment()?.total}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">{t.exampleCalculationOnly}</p>
          </div>
        )}

        <div>
          <Label htmlFor="loanPurpose">{t.purposeOfLoan} *</Label>
          <Textarea
            id="loanPurpose"
            placeholder={t.purposeOfLoanPlaceholder}
            value={formData.loanPurpose}
            onChange={(e) => handleInputChange("loanPurpose", e.target.value)}
            className={errors.loanPurpose ? "border-red-500 bg-white" : "bg-white"}
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
        <Briefcase className="h-12 w-12 text-[#b91c1c] mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900">
          {t.incomeAndEmployment}
        </h3>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="monthlyIncome">{t.monthlyIncome} *</Label>
            <button
              type="button"
              onClick={() => toggleHelp("income")}
              className="text-[#b91c1c] hover:text-[#991b1b]"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
          {expandedHelp === "income" && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-2 text-sm text-gray-700">
              <p className="font-semibold mb-1">{t.whyWeAskThis}</p>
              <p>{t.incomeVerificationReason}</p>
            </div>
          )}
          <Input
            id="monthlyIncome"
            type="number"
            placeholder={t.monthlyIncomePlaceholder}
            value={formData.monthlyIncome}
            onChange={(e) => handleInputChange("monthlyIncome", e.target.value)}
            className={errors.monthlyIncome ? "border-red-500 bg-white" : "bg-white"}
          />
          {errors.monthlyIncome && (
            <p className="text-red-500 text-sm mt-1">{errors.monthlyIncome}</p>
          )}
        </div>

        <div>
          <Label htmlFor="employmentStatus">{t.employmentStatus} *</Label>
          <Select
            value={formData.employmentStatus}
            onValueChange={(value) =>
              handleInputChange("employmentStatus", value)
            }
          >
            <SelectTrigger
              className={errors.employmentStatus ? "border-red-500 bg-white" : "bg-white"}
            >
              <SelectValue placeholder={t.selectEmploymentStatus} />
            </SelectTrigger>
            <SelectContent className="bg-white">
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
                className={errors.employerName ? "border-red-500 bg-white" : "bg-white"}
              />
              {errors.employerName && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.employerName}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="employmentDuration">{t.employmentDuration} *</Label>
                <button
                  type="button"
                  onClick={() => toggleHelp("employment")}
                  className="text-[#b91c1c] hover:text-[#991b1b]"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
              {expandedHelp === "employment" && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-2 text-sm text-gray-700">
                  <p className="font-semibold mb-1">{t.whyWeAskThis}</p>
                  <p>{t.employmentDurationReason}</p>
                </div>
              )}
              <Input
                id="employmentDuration"
                placeholder={t.employmentDurationPlaceholder}
                value={formData.employmentDuration}
                onChange={(e) =>
                  handleInputChange("employmentDuration", e.target.value)
                }
                className={errors.employmentDuration ? "border-red-500 bg-white" : "bg-white"}
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
        <User className="h-12 w-12 text-[#b91c1c] mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900">
          {t.personalDetails}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">{t.firstName} *</Label>
          <Input
            id="firstName"
            placeholder={t.firstNamePlaceholder}
            value={formData.firstName}
            onChange={(e) => handleInputChange("firstName", e.target.value)}
            className={errors.firstName ? "border-red-500 bg-white" : "bg-white"}
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
            className={errors.lastName ? "border-red-500 bg-white" : "bg-white"}
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
            className={errors.email ? "border-red-500 bg-white" : "bg-white"}
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
            className={errors.phone ? "border-red-500 bg-white" : "bg-white"}
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
            className={errors.address ? "border-red-500 bg-white" : "bg-white"}
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
            className={errors.city ? "border-red-500 bg-white" : "bg-white"}
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
            <SelectTrigger className={errors.country ? "border-red-500 bg-white" : "bg-white"}>
              <SelectValue placeholder={t.selectCountry} />
            </SelectTrigger>
            <SelectContent className="bg-white">
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
            className="bg-white"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="dateOfBirth">{t.dateOfBirth} *</Label>
            <button
              type="button"
              onClick={() => toggleHelp("dob")}
              className="text-[#b91c1c] hover:text-[#991b1b]"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
          {expandedHelp === "dob" && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-2 text-sm text-gray-700">
              <p className="font-semibold mb-1">{t.whyWeAskThis}</p>
              <p>{t.dobVerificationReason}</p>
            </div>
          )}
          <Input
            id="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
            className={errors.dateOfBirth ? "border-red-500 bg-white" : "bg-white"}
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
        <FileText className="h-12 w-12 text-[#b91c1c] mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900">
          {t.financialCommitmentsConsent}
        </h3>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="ssn">{t.ssnTaxId} *</Label>
            <button
              type="button"
              onClick={() => toggleHelp("ssn")}
              className="text-[#b91c1c] hover:text-[#991b1b]"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
          {expandedHelp === "ssn" && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-2 text-sm text-gray-700">
              <p className="font-semibold mb-1">{t.whyWeAskThis}</p>
              <p>{t.ssnVerificationReason}</p>
            </div>
          )}
          <Input
            id="ssn"
            placeholder={t.ssnTaxIdPlaceholder}
            value={formData.ssn}
            onChange={(e) => handleInputChange("ssn", e.target.value)}
            className={errors.ssn ? "border-red-500 bg-white" : "bg-white"}
          />
          <div className="flex items-start gap-2 mt-2 text-xs text-gray-600">
            <Lock className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <p>{t.encryptedSecurely}</p>
          </div>
          <div className="flex items-start gap-2 mt-1 text-xs text-gray-600">
            <Shield className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <p>{t.noCreditCheckWithoutConsent}</p>
          </div>
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
            className="bg-white"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="existingDebts">{t.existingDebts}</Label>
            <button
              type="button"
              onClick={() => toggleHelp("debts")}
              className="text-[#b91c1c] hover:text-[#991b1b]"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
          {expandedHelp === "debts" && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-2 text-sm text-gray-700">
              <p className="font-semibold mb-1">{t.whyWeAskThis}</p>
              <p>{t.debtsVerificationReason}</p>
            </div>
          )}
          <Input
            id="existingDebts"
            type="number"
            placeholder={t.existingDebtsPlaceholder}
            value={formData.existingDebts}
            onChange={(e) => handleInputChange("existingDebts", e.target.value)}
            className="bg-white"
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
            className="bg-white"
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
            className="bg-white"
          />
        </div>

        <div className="border-t pt-6 mt-6 space-y-4">
          <h4 className="font-semibold text-gray-900">{t.requiredConsents}</h4>

          <div className="flex items-start gap-3">
            <Checkbox
              id="consentAccuracy"
              checked={formData.consentAccuracy}
              onCheckedChange={(checked) => handleInputChange("consentAccuracy", !!checked)}
              className={errors.consentAccuracy ? "border-red-500" : ""}
            />
            <label htmlFor="consentAccuracy" className="text-sm text-gray-700 cursor-pointer">
              {t.consentAccuracyLabel}
            </label>
          </div>
          {errors.consentAccuracy && (
            <p className="text-red-500 text-sm ml-8">{errors.consentAccuracy}</p>
          )}

          <div className="flex items-start gap-3">
            <Checkbox
              id="consentPrivacy"
              checked={formData.consentPrivacy}
              onCheckedChange={(checked) => handleInputChange("consentPrivacy", !!checked)}
              className={errors.consentPrivacy ? "border-red-500" : ""}
            />
            <label htmlFor="consentPrivacy" className="text-sm text-gray-700 cursor-pointer">
              {t.consentPrivacyLabel}
            </label>
          </div>
          {errors.consentPrivacy && (
            <p className="text-red-500 text-sm ml-8">{errors.consentPrivacy}</p>
          )}

          <div className="flex items-start gap-3">
            <Checkbox
              id="consentCreditCheck"
              checked={formData.consentCreditCheck}
              onCheckedChange={(checked) => handleInputChange("consentCreditCheck", !!checked)}
              className={errors.consentCreditCheck ? "border-red-500" : ""}
            />
            <label htmlFor="consentCreditCheck" className="text-sm text-gray-700 cursor-pointer">
              {t.consentCreditCheckLabel}
            </label>
          </div>
          {errors.consentCreditCheck && (
            <p className="text-red-500 text-sm ml-8">{errors.consentCreditCheck}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <CheckCircle className="h-12 w-12 text-[#b91c1c] mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900">{t.applicationSummary}</h3>
        <p className="text-sm text-gray-600 mt-1">{t.reviewBeforeSubmitting}</p>
      </div>

      <div className="space-y-4">
        <div className="bg-white border-l-4 border-l-[#b91c1c] p-4">
          <h4 className="font-semibold text-gray-900 mb-3">{t.loanInformation}</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-600">{t.loanType}:</p>
              <p className="font-medium text-gray-900">{loanTypes.find(lt => lt.value === formData.loanType)?.label}</p>
            </div>
            <div>
              <p className="text-gray-600">{t.amount}:</p>
              <p className="font-medium text-gray-900">€{formData.loanAmount}</p>
            </div>
            <div>
              <p className="text-gray-600">{t.term}:</p>
              <p className="font-medium text-gray-900">{formData.loanTerm} {t.months}</p>
            </div>
            <div>
              <p className="text-gray-600">{t.purpose}:</p>
              <p className="font-medium text-gray-900">{formData.loanPurpose.slice(0, 50)}...</p>
            </div>
          </div>
        </div>

        <div className="bg-white border-l-4 border-l-[#b91c1c] p-4">
          <h4 className="font-semibold text-gray-900 mb-3">{t.incomeAndEmployment}</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-600">{t.monthlyIncomeLabel}:</p>
              <p className="font-medium text-gray-900">€{formData.monthlyIncome}</p>
            </div>
            <div>
              <p className="text-gray-600">{t.employment}:</p>
              <p className="font-medium text-gray-900">{employmentStatuses.find(s => s.value === formData.employmentStatus)?.label}</p>
            </div>
            {formData.employerName && (
              <div>
                <p className="text-gray-600">{t.employer}:</p>
                <p className="font-medium text-gray-900">{formData.employerName}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border-l-4 border-l-[#b91c1c] p-4">
          <h4 className="font-semibold text-gray-900 mb-3">{t.personalDetails}</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-600">{t.name}:</p>
              <p className="font-medium text-gray-900">{formData.firstName} {formData.lastName}</p>
            </div>
            <div>
              <p className="text-gray-600">{t.dateOfBirth}:</p>
              <p className="font-medium text-gray-900">{formData.dateOfBirth}</p>
            </div>
            <div>
              <p className="text-gray-600">{t.emailAddress}:</p>
              <p className="font-medium text-gray-900">{formData.email}</p>
            </div>
            <div>
              <p className="text-gray-600">{t.country}:</p>
              <p className="font-medium text-gray-900">{getCountryLabel(formData.country)}</p>
            </div>
          </div>
        </div>

        {formData.existingDebts && (
          <div className="bg-white border-l-4 border-l-[#b91c1c] p-4">
            <h4 className="font-semibold text-gray-900 mb-3">{t.financialCommitments}</h4>
            <div className="text-sm">
              <p className="text-gray-600">{t.existingDebtsLabel}:</p>
              <p className="font-medium text-gray-900">€{formData.existingDebts}</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-gray-700">
        <p className="font-semibold mb-2">{t.pleaseNote}</p>
        <p>{t.submitConfirmation}</p>
      </div>
    </div>
  );

  const renderStepContent = () => {
    if (showReviewStep) {
      return renderReviewStep();
    }

    switch (currentStep) {
      case 0:
        return renderStep0();
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return renderStep0();
    }
  };

  const getStepLabel = (step: number) => {
    switch (step) {
      case 0:
        return t.eligibility;
      case 1:
        return t.loanDetailsTitle;
      case 2:
        return t.incomeAndEmployment;
      case 3:
        return t.personalDetails;
      case 4:
        return t.financialConsent;
      default:
        return "";
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
              {t.completeApplicationSteps}
            </p>
          </div>

          <div ref={dropdownRef} className="relative inline-block flex-shrink-0">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 bg-white border-2 border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:border-[#b91c1c] focus:outline-none focus:ring-2 focus:ring-[#b91c1c] focus:border-transparent cursor-pointer transition-all shadow-sm hover:shadow-md min-w-[160px]"
            >
              <Languages className="w-4 h-4 text-gray-600" />
              <span className="flex-1 text-left">
                {languages.find(lang => lang.code === language)?.label}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-full bg-white border-2 border-gray-200 shadow-lg overflow-hidden z-10">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left transition-colors ${
                      language === lang.code
                        ? 'bg-red-50 text-[#b91c1c] font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span>{lang.label}</span>
                    {language === lang.code && (
                      <Check className="w-4 h-4 text-[#b91c1c]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <Alert className="mb-6 bg-white border-l-4 border-l-[#b91c1c] border-y-0 border-r-0 rounded-none text-gray-900">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <p className="font-semibold mb-2">{t.eligibilityNotice}</p>
            <p className="text-sm mb-2">
              {t.maltaResidentsOnly}
            </p>
            <p className="text-sm mb-2">
              {t.previewApplicationNote}
            </p>
            <p className="text-sm">
              {t.noCreditScoreImpact}
            </p>
          </AlertDescription>
        </Alert>

        {!showReviewStep && (
          <>
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center justify-between mb-4">
                {Array.from({ length: totalSteps }, (_, i) => i).map((step) => (
                  <div key={step} className="flex items-center">
                    <div
                      className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                        step <= currentStep
                          ? "bg-[#b91c1c] text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {step < currentStep ? (
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                      ) : (
                        step + 1
                      )}
                    </div>
                    {step < totalSteps - 1 && (
                      <div
                        className={`w-8 sm:w-16 h-1 mx-1 sm:mx-2 ${
                          step < currentStep ? "bg-[#b91c1c]" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="text-center">
                <span className="text-xs sm:text-sm text-gray-600 font-medium">
                  Step {currentStep + 1} of {totalSteps}: {getStepLabel(currentStep)}
                </span>
              </div>
            </div>
          </>
        )}

        <Card className="shadow-lg border-0 bg-white">
          <CardHeader className="bg-gray-50 border-b-4 border-b-[#b91c1c] p-6">
            <CardTitle className="flex items-center text-lg">
              {t.digitalChainBankLoanApplication}
              <Badge className="ml-2 bg-[#b91c1c] text-white">{t.secure}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-white">
            {renderStepContent()}

            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0 && !showReviewStep}
                className="bg-white order-2 sm:order-1"
              >
                {t.previous}
              </Button>

              {showReviewStep ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-[#b91c1c] hover:bg-[#991b1b] text-white order-1 sm:order-2"
                >
                  {isSubmitting ? t.processing : t.submitApplication}
                </Button>
              ) : currentStep < totalSteps - 1 ? (
                <Button
                  onClick={handleNext}
                  className="bg-[#b91c1c] hover:bg-[#991b1b] text-white order-1 sm:order-2"
                >
                  {currentStep === 0 ? t.continueToApplication : t.nextStep}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  className="bg-[#b91c1c] hover:bg-[#991b1b] text-white order-1 sm:order-2"
                >
                  {t.reviewApplication}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8">
          <Card className="bg-white">
            <CardContent className="p-4 sm:p-6 text-center">
              <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-[#b91c1c] mx-auto mb-3 sm:mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">
                {t.quickApproval}
              </h3>
              <p className="text-sm text-gray-600">
                {t.quickApprovalDesc}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-4 sm:p-6 text-center">
              <CreditCard className="h-10 w-10 sm:h-12 sm:w-12 text-[#b91c1c] mx-auto mb-3 sm:mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">
                {t.competitiveRates}
              </h3>
              <p className="text-sm text-gray-600">
                {t.competitiveRatesDesc}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-4 sm:p-6 text-center">
              <Info className="h-10 w-10 sm:h-12 sm:w-12 text-[#b91c1c] mx-auto mb-3 sm:mb-4" />
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
          <DialogContent className="sm:max-w-md bg-white">
            <DialogHeader>
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
                <AlertTriangle className="h-8 w-8 text-[#b91c1c]" />
              </div>
              <DialogTitle className="text-center text-xl font-semibold text-gray-900">
                {t.decisionNotAvailable}
              </DialogTitle>
              <DialogDescription className="text-center text-gray-600 mt-4 space-y-4">
                <div className="bg-gray-50 border-l-4 border-l-[#b91c1c] p-4 text-left">
                  <p className="font-semibold text-gray-900 mb-2">{t.reason}:</p>
                  <p className="text-sm text-gray-700">
                    {t.maltaResidencyRequirement}
                  </p>
                  <p className="text-sm text-gray-700 mt-3">
                    {t.exclusiveToMaltaResidents}
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded p-4 text-left">
                  <p className="font-semibold text-gray-900 mb-2">{t.nextSteps}:</p>
                  <p className="text-sm text-gray-700">
                    {t.reapplyAfterResidencyChange}
                  </p>
                </div>

                <div className="text-xs text-gray-500 text-left">
                  <p>{t.reference}: {Date.now()}</p>
                  <p>{t.date}: {new Date().toLocaleDateString()}</p>
                </div>
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button
                onClick={() => setShowRestrictionDialog(false)}
                className="flex-1 bg-[#b91c1c] hover:bg-[#991b1b] text-white"
              >
                {t.iUnderstand}
              </Button>
              <Button
                variant="outline"
                className="flex-1 bg-white"
                onClick={() => window.location.href = "mailto:support@digitalchainbank.com"}
              >
                <Mail className="w-4 h-4 mr-2" />
                {t.contactSupport}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
