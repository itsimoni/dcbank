"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import {
  Receipt,
  FileText,
  AlertTriangle,
  Building,
  Zap,
  CreditCard,
  ArrowUpDown,
  Languages,
  Check,
  ChevronDown,
} from "lucide-react";
import { Language, getTranslations } from "../../lib/translations";
import { useLanguage } from "../../contexts/LanguageContext";

interface UserProfile {
  id: string;
  client_id: string;
  full_name: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

interface PaymentsSectionProps {
  userProfile: UserProfile;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  recipient: string;
  status: string;
  created_at: string;
  due_date?: string;
  payment_type: string;
  description: string;
}

export default function PaymentsSection({ userProfile }: PaymentsSectionProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [formData, setFormData] = useState({
    payment_type: "",
    amount: "",
    currency: "EUR",
    description: "",
    recipient: "",
    due_date: "",
  });

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
    { code: 'el', label: 'Ελληνικά' },
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

  useEffect(() => {
    if (userProfile?.id) {
      fetchPayments();
    }
  }, [userProfile?.id]);

  const fetchPayments = async () => {
    if (!userProfile?.id) return;

    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", userProfile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const submitPayment = async () => {
    if (!userProfile?.id) return;

    try {
      const { error } = await supabase.from("payments").insert({
        user_id: userProfile.id,
        payment_type: formData.payment_type,
        amount: Number.parseFloat(formData.amount),
        currency: formData.currency,
        description: formData.description,
        recipient: formData.recipient,
        due_date: formData.due_date || null,
        status: "Pending",
      });

      if (error) throw error;

      await supabase.from("transactions").insert({
        user_id: userProfile.id,
        type: "Payment",
        amount: Number.parseFloat(formData.amount),
        currency: formData.currency,
        description: `${formData.payment_type} - ${formData.description}`,
        platform: "Digital Chain Bank",
        status: "Pending",
        recipient_name: formData.recipient,
      });

      setFormData({
        payment_type: "",
        amount: "",
        currency: "EUR",
        description: "",
        recipient: "",
        due_date: "",
      });
      setShowPaymentForm(false);
      fetchPayments();
      alert(t.paymentSubmittedSuccess);
    } catch (error: any) {
      alert(`${t.error} ${error.message}`);
    }
  };

  const paymentTypes = [
    {
      id: "gov",
      name: t.taxesGovernment,
      icon: Building,
      description: t.taxesGovernmentDesc,
    },
    {
      id: "bills",
      name: t.billsInvoices,
      icon: FileText,
      description: t.billsInvoicesDesc,
    },
    {
      id: "fines",
      name: t.finesPenalties,
      icon: AlertTriangle,
      description: t.finesPenaltiesDesc,
    },
    {
      id: "transfers",
      name: t.transfersFees,
      icon: ArrowUpDown,
      description: t.transfersFeesDesc,
    },
  ];

  if (loading) {
    return <div className="p-6">{t.loadingPayments}</div>;
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 pt-4 pt-xs-16 space-y-6">
        <div className="flex justify-between items-center gap-4">
          <h2 className="text-2xl font-bold">{t.payments}</h2>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowPaymentForm(true)}
              className="bg-[#F26623] hover:bg-[#E55A1F]"
            >
              {t.newPayment}
            </Button>

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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paymentTypes.map((type) => (
            <Card
              key={type.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <type.icon className="w-6 h-6 text-[#F26623] mt-1 flex-shrink-0" />
                  <div className="min-w-0">
                    <h3 className="font-medium">{type.name}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {type.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {showPaymentForm && (
          <Card>
            <CardHeader>
              <CardTitle>{t.newPayment}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t.paymentType}</Label>
                  <Select
                    value={formData.payment_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, payment_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t.selectPaymentType} />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentTypes.map((type) => (
                        <SelectItem key={type.id} value={type.name}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t.currency}</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) =>
                      setFormData({ ...formData, currency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">{t.euroCurrency}</SelectItem>
                      <SelectItem value="USD">{t.usdCurrency}</SelectItem>
                      <SelectItem value="CAD">{t.cadCurrency}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t.amount}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>{t.dueDateOptional}</Label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) =>
                      setFormData({ ...formData, due_date: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <Label>{t.recipientPayee}</Label>
                <Input
                  value={formData.recipient}
                  onChange={(e) =>
                    setFormData({ ...formData, recipient: e.target.value })
                  }
                  placeholder={t.enterRecipientName}
                />
              </div>
              <div>
                <Label>{t.description}</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder={t.enterPaymentDescription}
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={submitPayment}
                  className="bg-[#F26623] hover:bg-[#E55A1F]"
                >
                  {t.submitPayment}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowPaymentForm(false)}
                >
                  {t.cancel}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t.paymentHistory}</CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">{t.noPaymentsYet}</p>
            ) : (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex justify-between items-center p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{payment.payment_type}</p>
                      <p className="text-sm text-gray-600">
                        {payment.description}
                      </p>
                      <p className="text-sm text-gray-600">
                        {t.to} {payment.recipient}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(payment.created_at).toLocaleString()}
                      </p>
                      {payment.due_date && (
                        <p className="text-xs text-gray-500">
                          {t.due} {new Date(payment.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {Number(payment.amount).toLocaleString()}{" "}
                        {payment.currency}
                      </p>
                      <p
                        className={`text-sm font-medium ${
                          payment.status === "Success"
                            ? "text-green-600"
                            : payment.status === "Pending"
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {payment.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
