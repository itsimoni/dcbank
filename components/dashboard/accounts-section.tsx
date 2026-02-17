"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { getTranslations, Language } from "@/lib/translations";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Languages,
  ChevronDown,
  Edit2,
  Star,
  Building2,
  CreditCard,
  AlertTriangle,
  Info,
  Globe,
  Landmark
} from "lucide-react";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  client_id: string;
  full_name: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

interface ExternalAccount {
  id: string;
  user_id: string;
  account_name: string;
  bank_name: string;
  account_number?: string;
  routing_number?: string;
  account_type?: string;
  currency: string;
  is_verified: boolean;
  created_at: string;
  account_holder_name?: string;
  country?: string;
  bank_country?: string;
  payment_rail: string;
  iban?: string;
  swift_bic?: string;
  routing_type?: string;
  last4?: string;
  masked_account?: string;
  verification_status: string;
  verification_method?: string;
  verified_at?: string;
  verification_attempts: number;
  failure_reason?: string;
  is_default: boolean;
  is_active: boolean;
  last_used_at?: string;
  deleted_at?: string;
  updated_at: string;
  provider?: string;
  provider_account_id?: string;
  provider_item_id?: string;
  provider_status?: string;
  last_sync_at?: string;
}

interface AccountsSectionProps {
  userProfile: UserProfile;
}

type PaymentRail = "ACH" | "SEPA" | "SWIFT" | "WIRE" | "FPS" | "OTHER";

const COUNTRY_RAILS: Record<string, PaymentRail[]> = {
  US: ["ACH", "SWIFT", "WIRE"],
  CA: ["ACH", "SWIFT"],
  GB: ["FPS", "SWIFT"],
  FR: ["SEPA", "SWIFT"],
  DE: ["SEPA", "SWIFT"],
  IT: ["SEPA", "SWIFT"],
  ES: ["SEPA", "SWIFT"],
  NL: ["SEPA", "SWIFT"],
  BE: ["SEPA", "SWIFT"],
  AT: ["SEPA", "SWIFT"],
  PT: ["SEPA", "SWIFT"],
  GR: ["SEPA", "SWIFT"],
  CH: ["SEPA", "SWIFT"],
};

const COUNTRY_FLAGS: Record<string, string> = {
  US: "🇺🇸", CA: "🇨🇦", GB: "🇬🇧", FR: "🇫🇷", DE: "🇩🇪", IT: "🇮🇹",
  ES: "🇪🇸", NL: "🇳🇱", BE: "🇧🇪", AT: "🇦🇹", PT: "🇵🇹", GR: "🇬🇷", CH: "🇨🇭"
};

const RAIL_COLORS: Record<PaymentRail, string> = {
  ACH: "bg-blue-100 text-blue-700 border-blue-300",
  SEPA: "bg-purple-100 text-purple-700 border-purple-300",
  SWIFT: "bg-green-100 text-green-700 border-green-300",
  WIRE: "bg-orange-100 text-orange-700 border-orange-300",
  FPS: "bg-pink-100 text-pink-700 border-pink-300",
  OTHER: "bg-gray-100 text-gray-700 border-gray-300",
};

const STATUS_CONFIG = {
  verified: { color: "bg-green-100 text-green-700 border-green-300", icon: CheckCircle, label: "Verified" },
  pending: { color: "bg-yellow-100 text-yellow-700 border-yellow-300", icon: AlertCircle, label: "Pending" },
  requires_action: { color: "bg-orange-100 text-orange-700 border-orange-300", icon: AlertTriangle, label: "Requires Action" },
  failed: { color: "bg-red-100 text-red-700 border-red-300", icon: XCircle, label: "Failed" },
  rejected: { color: "bg-red-100 text-red-700 border-red-300", icon: XCircle, label: "Rejected" },
};

export default function AccountsSection({ userProfile }: AccountsSectionProps) {
  const [accounts, setAccounts] = useState<ExternalAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ExternalAccount | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    account_name: "",
    bank_name: "",
    account_holder_name: "",
    country: "US",
    payment_rail: "ACH" as PaymentRail,

    // ACH fields
    account_number: "",
    routing_number: "",
    account_type: "Checking",

    // SEPA fields
    iban: "",

    // SWIFT fields
    swift_bic: "",
    bank_country: "",

    currency: "USD",
  });

  const { language, setLanguage } = useLanguage();
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

  const t = useMemo(() => getTranslations(language), [language]);

  const languageNames: Record<Language, string> = {
    en: "English",
    fr: "Français",
    de: "Deutsch",
    es: "Español",
    it: "Italiano",
    el: "Ελληνικά",
  };

  useEffect(() => {
    if (userProfile?.id) {
      fetchAccounts();
    }
  }, [userProfile?.id]);

  // Update payment rail when country changes
  useEffect(() => {
    const availableRails = COUNTRY_RAILS[formData.country] || ["SWIFT"];
    if (!availableRails.includes(formData.payment_rail)) {
      setFormData(prev => ({ ...prev, payment_rail: availableRails[0] }));
    }

    // Update default currency based on country
    if (formData.country === "US" || formData.country === "CA") {
      setFormData(prev => ({ ...prev, currency: formData.country === "US" ? "USD" : "CAD" }));
    } else if (["FR", "DE", "IT", "ES", "NL", "BE", "AT", "PT", "GR"].includes(formData.country)) {
      setFormData(prev => ({ ...prev, currency: "EUR" }));
    } else if (formData.country === "GB") {
      setFormData(prev => ({ ...prev, currency: "GBP" }));
    } else if (formData.country === "CH") {
      setFormData(prev => ({ ...prev, currency: "CHF" }));
    }
  }, [formData.country]);

  const fetchAccounts = async () => {
    if (!userProfile?.id) return;

    try {
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("external_accounts")
        .select("*")
        .eq("user_id", userProfile.id)
        .is("deleted_at", null)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw new Error(`Database error: ${fetchError.message}`);
      }

      setAccounts(data || []);
    } catch (error: any) {
      console.error("Error fetching accounts:", error);
      setError(error.message || "Failed to fetch accounts");
    } finally {
      setLoading(false);
    }
  };

  const maskAccountNumber = (value: string): { masked: string; last4: string } => {
    const cleaned = value.replace(/[^A-Za-z0-9]/g, "");
    const last4 = cleaned.slice(-4);
    const masked = "••••" + last4;
    return { masked, last4 };
  };

  const resetForm = () => {
    setFormData({
      account_name: "",
      bank_name: "",
      account_holder_name: "",
      country: "US",
      payment_rail: "ACH" as PaymentRail,
      account_number: "",
      routing_number: "",
      account_type: "Checking",
      iban: "",
      swift_bic: "",
      bank_country: "",
      currency: "USD",
    });
    setEditingAccount(null);
  };

  const saveAccount = async () => {
    if (!userProfile?.id) return;

    try {
      setError(null);

      // Prepare account data based on payment rail
      const accountData: any = {
        user_id: userProfile.id,
        account_name: formData.account_name,
        bank_name: formData.bank_name,
        account_holder_name: formData.account_holder_name,
        country: formData.country,
        payment_rail: formData.payment_rail,
        currency: formData.currency,
      };

      // Add rail-specific fields
      if (formData.payment_rail === "ACH") {
        accountData.account_number = formData.account_number;
        accountData.routing_number = formData.routing_number;
        accountData.account_type = formData.account_type;

        const { masked, last4 } = maskAccountNumber(formData.account_number);
        accountData.masked_account = masked;
        accountData.last4 = last4;
      } else if (formData.payment_rail === "SEPA") {
        accountData.iban = formData.iban;
        accountData.swift_bic = formData.swift_bic || null;

        const { masked, last4 } = maskAccountNumber(formData.iban);
        accountData.masked_account = masked;
        accountData.last4 = last4;
      } else if (formData.payment_rail === "SWIFT") {
        accountData.swift_bic = formData.swift_bic;
        accountData.bank_country = formData.bank_country;

        if (formData.iban) {
          accountData.iban = formData.iban;
          const { masked, last4 } = maskAccountNumber(formData.iban);
          accountData.masked_account = masked;
          accountData.last4 = last4;
        } else if (formData.account_number) {
          accountData.account_number = formData.account_number;
          const { masked, last4 } = maskAccountNumber(formData.account_number);
          accountData.masked_account = masked;
          accountData.last4 = last4;
        }
      }

      if (editingAccount) {
        const { error } = await supabase
          .from("external_accounts")
          .update(accountData)
          .eq("id", editingAccount.id);

        if (error) throw error;
        toast.success("Account updated successfully");
      } else {
        const { error } = await supabase
          .from("external_accounts")
          .insert(accountData);

        if (error) throw error;
        toast.success("Account added successfully");
      }

      resetForm();
      setShowAddForm(false);
      fetchAccounts();
    } catch (error: any) {
      console.error("Error saving account:", error);
      setError(error.message || "Failed to save account");
      toast.error(error.message || "Failed to save account");
    }
  };

  const editAccount = (account: ExternalAccount) => {
    setEditingAccount(account);
    setFormData({
      account_name: account.account_name,
      bank_name: account.bank_name,
      account_holder_name: account.account_holder_name || "",
      country: account.country || "US",
      payment_rail: account.payment_rail as PaymentRail,
      account_number: account.account_number || "",
      routing_number: account.routing_number || "",
      account_type: account.account_type || "Checking",
      iban: account.iban || "",
      swift_bic: account.swift_bic || "",
      bank_country: account.bank_country || "",
      currency: account.currency,
    });
    setShowAddForm(true);
  };

  const setDefaultAccount = async (id: string) => {
    try {
      // First, unset all defaults for this user
      await supabase
        .from("external_accounts")
        .update({ is_default: false })
        .eq("user_id", userProfile.id);

      // Then set the new default
      const { error } = await supabase
        .from("external_accounts")
        .update({ is_default: true })
        .eq("id", id);

      if (error) throw error;

      toast.success("Default account updated");
      fetchAccounts();
    } catch (error: any) {
      console.error("Error setting default account:", error);
      toast.error(error.message || "Failed to set default account");
    }
  };

  const softDeleteAccount = async () => {
    if (!accountToDelete) return;

    try {
      const accountToRemove = accounts.find(a => a.id === accountToDelete);

      // Prevent deleting default account if it's the only one or no other default is set
      if (accountToRemove?.is_default && accounts.length > 1) {
        toast.error("Please set another account as default before removing this one");
        return;
      }

      const { error } = await supabase
        .from("external_accounts")
        .update({
          deleted_at: new Date().toISOString(),
          is_active: false,
          is_default: false
        })
        .eq("id", accountToDelete);

      if (error) throw error;

      toast.success("Account removed successfully");
      setDeleteDialogOpen(false);
      setAccountToDelete(null);
      fetchAccounts();
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast.error(error.message || "Failed to delete account");
    }
  };

  const verifyAccount = async (id: string) => {
    try {
      const { error } = await supabase
        .from("external_accounts")
        .update({
          verification_status: "verified",
          verified_at: new Date().toISOString(),
          is_verified: true
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Account verified successfully");
      fetchAccounts();
    } catch (error: any) {
      console.error("Error verifying account:", error);
      toast.error(error.message || "Failed to verify account");
    }
  };

  // Summary calculations
  const summary = useMemo(() => {
    const total = accounts.length;
    const verified = accounts.filter(a => a.verification_status === "verified").length;
    const pending = accounts.filter(a =>
      a.verification_status === "pending" || a.verification_status === "requires_action"
    ).length;
    const defaultAccount = accounts.find(a => a.is_default);

    return { total, verified, pending, defaultAccount };
  }, [accounts]);

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b91c1c]"></div>
            <span className="ml-2">{t.loadingAccounts}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header with Language Selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-x-4">
            <Landmark className="h-8 w-8 text-[#b91c1c]" />
            <h2 className="text-3xl font-bold text-gray-900">{t.externalBankAccounts}</h2>
          </div>

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
              className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:border-[#b91c1c] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#b91c1c] focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Languages className="h-4 w-4 text-[#b91c1c]" />
              <span>{languageNames[language]}</span>
              <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isLanguageDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsLanguageDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
                  {Object.entries(languageNames).map(([code, name]) => (
                    <button
                      key={code}
                      onClick={() => {
                        setLanguage(code as Language);
                        setIsLanguageDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm transition-colors duration-150 ${
                        language === code
                          ? 'bg-[#b91c1c] text-white font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{name}</span>
                        {language === code && (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Summary Bar */}
        {accounts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total Accounts</p>
                    <p className="text-2xl font-bold text-blue-900">{summary.total}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-blue-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Verified</p>
                    <p className="text-2xl font-bold text-green-900">{summary.verified}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-600">Pending</p>
                    <p className="text-2xl font-bold text-yellow-900">{summary.pending}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-yellow-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-purple-600 mb-1">Default Account</p>
                  {summary.defaultAccount ? (
                    <>
                      <p className="text-sm font-bold text-purple-900">{summary.defaultAccount.bank_name}</p>
                      <p className="text-xs text-purple-700">{summary.defaultAccount.masked_account || `••••${summary.defaultAccount.last4}`}</p>
                    </>
                  ) : (
                    <p className="text-sm text-purple-700">None set</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add/Edit Account Form */}
        {showAddForm && (
          <Card className="border-2 border-[#b91c1c] shadow-lg">
            <CardHeader className="bg-gradient-to-r from-[#b91c1c] to-[#991b1b] text-white">
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                {editingAccount ? "Edit Bank Account" : "Add New Bank Account"}
              </CardTitle>
              <CardDescription className="text-gray-100">
                {editingAccount ? "Update your bank account details" : "Connect a new external bank account for withdrawals"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Country and Payment Rail Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <Label htmlFor="country" className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-[#b91c1c]" />
                    Country
                  </Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) => setFormData({ ...formData, country: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(COUNTRY_FLAGS).map(([code, flag]) => (
                        <SelectItem key={code} value={code}>
                          {flag} {code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="payment_rail" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-[#b91c1c]" />
                    Payment Rail
                  </Label>
                  <Select
                    value={formData.payment_rail}
                    onValueChange={(value) => setFormData({ ...formData, payment_rail: value as PaymentRail })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(COUNTRY_RAILS[formData.country] || ["SWIFT"]).map((rail) => (
                        <SelectItem key={rail} value={rail}>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${RAIL_COLORS[rail]}`}>
                            {rail}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="account_name">Account Nickname</Label>
                  <Input
                    id="account_name"
                    value={formData.account_name}
                    onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                    placeholder="My Business Account"
                  />
                </div>

                <div>
                  <Label htmlFor="bank_name">Bank Name</Label>
                  <Input
                    id="bank_name"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    placeholder="Bank of America"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="account_holder_name">Account Holder Name</Label>
                  <Input
                    id="account_holder_name"
                    value={formData.account_holder_name}
                    onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
              </div>

              {/* Rail-Specific Fields */}
              {formData.payment_rail === "ACH" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="md:col-span-2">
                    <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      ACH Account Details
                    </h4>
                  </div>

                  <div>
                    <Label htmlFor="account_number">Account Number</Label>
                    <Input
                      id="account_number"
                      value={formData.account_number}
                      onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                      placeholder="123456789"
                    />
                  </div>

                  <div>
                    <Label htmlFor="routing_number">Routing Number</Label>
                    <Input
                      id="routing_number"
                      value={formData.routing_number}
                      onChange={(e) => setFormData({ ...formData, routing_number: e.target.value })}
                      placeholder="021000021"
                    />
                  </div>

                  <div>
                    <Label htmlFor="account_type">Account Type</Label>
                    <Select
                      value={formData.account_type}
                      onValueChange={(value) => setFormData({ ...formData, account_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Checking">Checking</SelectItem>
                        <SelectItem value="Savings">Savings</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Input
                      id="currency"
                      value={formData.currency}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                </div>
              )}

              {formData.payment_rail === "SEPA" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="md:col-span-2">
                    <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      SEPA Account Details
                    </h4>
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="iban">IBAN (Required)</Label>
                    <Input
                      id="iban"
                      value={formData.iban}
                      onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                      placeholder="DE89370400440532013000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="swift_bic">BIC/SWIFT (Optional)</Label>
                    <Input
                      id="swift_bic"
                      value={formData.swift_bic}
                      onChange={(e) => setFormData({ ...formData, swift_bic: e.target.value })}
                      placeholder="COBADEFFXXX"
                    />
                  </div>

                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Input
                      id="currency"
                      value={formData.currency}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                </div>
              )}

              {formData.payment_rail === "SWIFT" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="md:col-span-2">
                    <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      SWIFT Account Details
                    </h4>
                  </div>

                  <div>
                    <Label htmlFor="swift_bic">SWIFT/BIC (Required)</Label>
                    <Input
                      id="swift_bic"
                      value={formData.swift_bic}
                      onChange={(e) => setFormData({ ...formData, swift_bic: e.target.value })}
                      placeholder="CHASUS33XXX"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bank_country">Bank Country</Label>
                    <Select
                      value={formData.bank_country}
                      onValueChange={(value) => setFormData({ ...formData, bank_country: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(COUNTRY_FLAGS).map(([code, flag]) => (
                          <SelectItem key={code} value={code}>
                            {flag} {code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="iban">IBAN (if available)</Label>
                    <Input
                      id="iban"
                      value={formData.iban}
                      onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>

                  <div>
                    <Label htmlFor="account_number">Account Number (if no IBAN)</Label>
                    <Input
                      id="account_number"
                      value={formData.account_number}
                      onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                      placeholder="Required if no IBAN"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => setFormData({ ...formData, currency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="CHF">CHF</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={saveAccount}
                  className="bg-[#b91c1c] hover:bg-[#991b1b] text-white"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {editingAccount ? "Update Account" : "Add Account"}
                </Button>
                <Button
                  onClick={() => {
                    resetForm();
                    setShowAddForm(false);
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Linked Accounts List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Linked Bank Accounts</CardTitle>
                <CardDescription>Manage your external bank accounts</CardDescription>
              </div>
              {!showAddForm && (
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="bg-[#b91c1c] hover:bg-[#991b1b]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Account
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {accounts.length === 0 ? (
              <div className="text-center py-12">
                <Landmark className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No bank accounts yet</h3>
                <p className="text-gray-500 mb-6">Add your first external bank account to enable withdrawals</p>
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="bg-[#b91c1c] hover:bg-[#991b1b]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Account
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {accounts.map((account) => {
                  const statusInfo = STATUS_CONFIG[account.verification_status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
                  const StatusIcon = statusInfo.icon;

                  return (
                    <div
                      key={account.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-[#b91c1c] hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        {/* Left: Bank Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Building2 className="h-5 w-5 text-gray-400" />
                            <div>
                              <h4 className="font-semibold text-gray-900">{account.bank_name}</h4>
                              <p className="text-sm text-gray-600">{account.account_name}</p>
                            </div>
                            {account.is_default && (
                              <Badge className="bg-[#b91c1c] text-white">
                                <Star className="h-3 w-3 mr-1 fill-current" />
                                Default
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Middle: Country, Rail, Identifier */}
                        <div className="flex items-center gap-4 flex-1 justify-center">
                          <Badge variant="outline" className="text-sm">
                            {COUNTRY_FLAGS[account.country || "US"]} {account.country || "US"}
                          </Badge>
                          <Badge className={RAIL_COLORS[account.payment_rail as PaymentRail]}>
                            {account.payment_rail}
                          </Badge>
                          <span className="text-sm font-mono text-gray-600">
                            {account.payment_rail === "SEPA" && `IBAN ${account.masked_account || `••••${account.last4}`}`}
                            {account.payment_rail === "ACH" && `Acct ${account.masked_account || `••••${account.last4}`}`}
                            {account.payment_rail === "SWIFT" && `Acct ${account.masked_account || `••••${account.last4}`}`}
                          </span>
                        </div>

                        {/* Right: Status and Actions */}
                        <div className="flex items-center gap-3 flex-1 justify-end">
                          <Badge className={statusInfo.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusInfo.label}
                          </Badge>

                          <div className="flex gap-2">
                            {(account.verification_status === "pending" || account.verification_status === "requires_action") && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => verifyAccount(account.id)}
                                className="text-blue-600 border-blue-600 hover:bg-blue-50"
                              >
                                Verify
                              </Button>
                            )}

                            {!account.is_default && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setDefaultAccount(account.id)}
                                className="text-purple-600 border-purple-600 hover:bg-purple-50"
                              >
                                <Star className="h-3 w-3" />
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => editAccount(account)}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setAccountToDelete(account.id);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-red-600 border-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Verification Guidance */}
                      {(account.verification_status === "pending" || account.verification_status === "requires_action") && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            <AlertTriangle className="h-4 w-4 inline mr-2" />
                            Verification required to enable withdrawals. Click "Verify" to start the process.
                          </p>
                        </div>
                      )}

                      {(account.verification_status === "failed" || account.verification_status === "rejected") && account.failure_reason && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-800 font-medium mb-1">
                            <XCircle className="h-4 w-4 inline mr-2" />
                            Verification Failed
                          </p>
                          <p className="text-sm text-red-700">{account.failure_reason}</p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => editAccount(account)}
                            className="mt-2 text-red-600 border-red-600"
                          >
                            Fix Details
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Bank Account?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove this bank account? This action can be undone by contacting support.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={softDeleteAccount}
                className="bg-red-600 hover:bg-red-700"
              >
                Remove Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
