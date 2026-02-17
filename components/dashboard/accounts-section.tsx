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
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Languages,
  ChevronDown,
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
  ACH: "bg-[#b91c1c] text-white border-[#b91c1c]",
  SEPA: "bg-[#b91c1c] text-white border-[#b91c1c]",
  SWIFT: "bg-[#b91c1c] text-white border-[#b91c1c]",
  WIRE: "bg-[#b91c1c] text-white border-[#b91c1c]",
  FPS: "bg-[#b91c1c] text-white border-[#b91c1c]",
  OTHER: "bg-[#b91c1c] text-white border-[#b91c1c]",
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
  const [editingAccount, setEditingAccount] = useState<ExternalAccount | null>(null);

  const [formData, setFormData] = useState({
    account_name: "",
    bank_name: "",
    account_holder_name: "",
    country: "",
    payment_rail: "SWIFT" as PaymentRail,

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
      country: "",
      payment_rail: "SWIFT" as PaymentRail,
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
      fetchAccounts();
    } catch (error: any) {
      console.error("Error saving account:", error);
      setError(error.message || "Failed to save account");
      toast.error(error.message || "Failed to save account");
    }
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
              className="flex items-center space-x-2 bg-white border border-gray-300  px-4 py-2.5 text-sm font-medium text-gray-700 hover:border-[#b91c1c] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#b91c1c] focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
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
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200  shadow-lg z-20 overflow-hidden">
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

        {/* Add/Edit Account Form */}
        <Card className="border-2 border-[#b91c1c] shadow-lg bg-white">
          <CardHeader className="bg-white border-b border-gray-200">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Plus className="h-5 w-5 text-[#b91c1c]" />
              {editingAccount ? "Edit Bank Account" : "Add New Bank Account"}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {editingAccount ? "Update your bank account details" : "Connect a new external bank account for withdrawals"}
            </CardDescription>
          </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Country and Payment Rail Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white  border border-gray-200">
                <div className="pb-4">
                  <Label htmlFor="country" className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-[#b91c1c]" />
                    Country
                  </Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="United States"
                  />
                </div>

                <div className="pb-4">
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
                      {(["ACH", "SEPA", "SWIFT", "WIRE", "FPS", "OTHER"] as PaymentRail[]).map((rail) => (
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white  border border-gray-200">
                  <div className="md:col-span-2">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white  border border-gray-200">
                  <div className="md:col-span-2">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white  border border-gray-200">
                  <div className="md:col-span-2">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
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
                    <Input
                      id="bank_country"
                      value={formData.bank_country}
                      onChange={(e) => setFormData({ ...formData, bank_country: e.target.value })}
                      placeholder="United States"
                    />
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
                {editingAccount && (
                  <Button
                    onClick={resetForm}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
        </Card>

        {/* Linked Accounts List */}
        <Card className="bg-white">
          <CardHeader className="bg-white border-b border-gray-200">
            <div>
              <CardTitle className="text-gray-900">Linked Bank Accounts</CardTitle>
              <CardDescription className="text-gray-600">Manage your external bank accounts</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {accounts.length === 0 ? (
              <div className="text-center py-12">
                <Landmark className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No bank accounts yet</h3>
                <p className="text-gray-500">Use the form above to add your first external bank account and enable withdrawals</p>
              </div>
            ) : (
              <div className="space-y-4">
                {accounts.map((account) => {
                  const statusInfo = STATUS_CONFIG[account.verification_status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
                  const StatusIcon = statusInfo.icon;

                  return (
                    <div
                      key={account.id}
                      className="border border-gray-200  p-4 hover:border-[#b91c1c] hover:shadow-md transition-all duration-200"
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
                            <Globe className="h-3 w-3 mr-1" />
                            {account.country || "N/A"}
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
                            {!account.is_default && account.verification_status === "verified" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setDefaultAccount(account.id)}
                                className="text-purple-600 border-purple-600 hover:bg-purple-50"
                              >
                                <Star className="h-3 w-3 mr-1" />
                                Set Default
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Verification Guidance */}
                      {(account.verification_status === "pending" || account.verification_status === "requires_action") && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 ">
                          <p className="text-sm text-yellow-800">
                            <AlertTriangle className="h-4 w-4 inline mr-2" />
                            Your account is pending verification. Our team will review and verify your bank account details shortly.
                          </p>
                        </div>
                      )}

                      {(account.verification_status === "failed" || account.verification_status === "rejected") && account.failure_reason && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 ">
                          <p className="text-sm text-red-800 font-medium mb-1">
                            <XCircle className="h-4 w-4 inline mr-2" />
                            Verification Failed
                          </p>
                          <p className="text-sm text-red-700">{account.failure_reason}</p>
                          <p className="text-sm text-red-600 mt-2">Please contact support to update your account details.</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Rail Information Guide */}
        <Card className="border-t-4 border-t-[#b91c1c] bg-white">
          <CardHeader className="bg-white border-b border-gray-200">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Info className="h-5 w-5 text-[#b91c1c]" />
              Understanding Payment Rails
            </CardTitle>
            <CardDescription className="text-gray-600">
              Choose the right payment method for your international transfers and withdrawals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* ACH */}
            <div className="p-4 border-l-4 border-l-[#b91c1c] bg-gray-50">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={RAIL_COLORS.ACH}>ACH</Badge>
                <h4 className="font-semibold text-gray-900">Automated Clearing House</h4>
              </div>
              <p className="text-sm text-gray-700 mb-2">
                The primary electronic payment system for domestic transfers in the United States and Canada.
                ACH is ideal for routine, scheduled payments and direct deposits.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Regions</p>
                  <p className="text-sm text-gray-800">United States, Canada</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Processing Time</p>
                  <p className="text-sm text-gray-800">1-3 business days</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Best For</p>
                  <p className="text-sm text-gray-800">Payroll, bill payments, recurring transfers</p>
                </div>
              </div>
            </div>

            {/* SEPA */}
            <div className="p-4 border-l-4 border-l-[#b91c1c] bg-gray-50">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={RAIL_COLORS.SEPA}>SEPA</Badge>
                <h4 className="font-semibold text-gray-900">Single Euro Payments Area</h4>
              </div>
              <p className="text-sm text-gray-700 mb-2">
                The standardized payment system for euro-denominated transfers across 36 European countries.
                SEPA enables seamless, low-cost transfers throughout the Eurozone with the same ease as domestic payments.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Regions</p>
                  <p className="text-sm text-gray-800">EU member states, EEA countries, Switzerland</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Processing Time</p>
                  <p className="text-sm text-gray-800">1 business day</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Best For</p>
                  <p className="text-sm text-gray-800">Euro transfers within Europe, low fees</p>
                </div>
              </div>
            </div>

            {/* SWIFT */}
            <div className="p-4 border-l-4 border-l-[#b91c1c] bg-gray-50">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={RAIL_COLORS.SWIFT}>SWIFT</Badge>
                <h4 className="font-semibold text-gray-900">Society for Worldwide Interbank Financial Telecommunication</h4>
              </div>
              <p className="text-sm text-gray-700 mb-2">
                The global standard for international money and security transfers between banks worldwide.
                SWIFT connects over 11,000 financial institutions across 200+ countries, making it the most widely used
                network for cross-border transactions.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Regions</p>
                  <p className="text-sm text-gray-800">Worldwide (200+ countries)</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Processing Time</p>
                  <p className="text-sm text-gray-800">1-5 business days</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Best For</p>
                  <p className="text-sm text-gray-800">International transfers, multiple currencies</p>
                </div>
              </div>
            </div>

            {/* WIRE */}
            <div className="p-4 border-l-4 border-l-[#b91c1c] bg-gray-50">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={RAIL_COLORS.WIRE}>WIRE</Badge>
                <h4 className="font-semibold text-gray-900">Wire Transfer</h4>
              </div>
              <p className="text-sm text-gray-700 mb-2">
                A fast, direct bank-to-bank electronic transfer method that ensures immediate, irrevocable fund movement.
                Wire transfers are processed individually and guaranteed, making them ideal for urgent or large-value transactions.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Regions</p>
                  <p className="text-sm text-gray-800">Domestic and International</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Processing Time</p>
                  <p className="text-sm text-gray-800">Same day to 1 business day</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Best For</p>
                  <p className="text-sm text-gray-800">Urgent transfers, large amounts, real estate</p>
                </div>
              </div>
            </div>

            {/* FPS */}
            <div className="p-4 border-l-4 border-l-[#b91c1c] bg-gray-50">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={RAIL_COLORS.FPS}>FPS</Badge>
                <h4 className="font-semibold text-gray-900">Faster Payments Service</h4>
              </div>
              <p className="text-sm text-gray-700 mb-2">
                The United Kingdom's innovative payment system enabling near-instantaneous transfers between UK bank accounts.
                FPS operates 24/7/365, allowing payments to be processed and received within seconds.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Regions</p>
                  <p className="text-sm text-gray-800">United Kingdom</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Processing Time</p>
                  <p className="text-sm text-gray-800">Real-time (seconds)</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Best For</p>
                  <p className="text-sm text-gray-800">Immediate UK transfers, 24/7 availability</p>
                </div>
              </div>
            </div>

            {/* OTHER */}
            <div className="p-4 border-l-4 border-l-[#b91c1c] bg-gray-50">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={RAIL_COLORS.OTHER}>OTHER</Badge>
                <h4 className="font-semibold text-gray-900">Alternative Payment Methods</h4>
              </div>
              <p className="text-sm text-gray-700 mb-2">
                Regional or specialized payment networks that may include local clearing systems, real-time payment platforms,
                or emerging payment technologies specific to certain countries or regions.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Regions</p>
                  <p className="text-sm text-gray-800">Varies by system</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Processing Time</p>
                  <p className="text-sm text-gray-800">Varies by system</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Best For</p>
                  <p className="text-sm text-gray-800">Region-specific needs</p>
                </div>
              </div>
            </div>

            {/* Important Notes */}
            <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[#b91c1c]" />
                Important Considerations
              </h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-[#b91c1c] font-bold">•</span>
                  <span><strong>Processing times</strong> are estimates and may vary based on bank policies, holidays, and cut-off times.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b91c1c] font-bold">•</span>
                  <span><strong>Transaction fees</strong> differ by payment rail and may include intermediary bank charges for international transfers.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b91c1c] font-bold">•</span>
                  <span><strong>Currency conversion</strong> rates apply when sending or receiving funds in different currencies.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b91c1c] font-bold">•</span>
                  <span><strong>Account verification</strong> is required before initiating withdrawals to ensure security and compliance.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#b91c1c] font-bold">•</span>
                  <span><strong>Daily and monthly limits</strong> may apply based on your account verification level and regulatory requirements.</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
