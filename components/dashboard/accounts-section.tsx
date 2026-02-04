"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { getTranslations, Language } from "@/lib/translations";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, CheckCircle, XCircle, AlertCircle, Languages, ChevronDown } from "lucide-react";

interface UserProfile {
  id: string;
  client_id: string;
  full_name: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

interface AccountsSectionProps {
  userProfile: UserProfile;
}

export default function AccountsSection({ userProfile }: AccountsSectionProps) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    account_name: "",
    bank_name: "",
    account_number: "",
    routing_number: "",
    account_type: "Checking",
    currency: "USD",
  });
  // Add language state
  const { language, setLanguage } = useLanguage();
  // Add language dropdown state
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

  // Get translations
  const t = useMemo(() => getTranslations(language), [language]);

  // Language names for the dropdown
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
      console.log("Fetching accounts for user:", userProfile.id);

      const { data, error: fetchError } = await supabase
        .from("external_accounts")
        .select("*")
        .eq("user_id", userProfile.id)
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Supabase error:", fetchError);
        throw new Error(`Database error: ${fetchError.message}`);
      }

      console.log("Fetched accounts:", data);
      setAccounts(data || []);
    } catch (error: any) {
      console.error("Error fetching accounts:", error);
      setError(error.message || "Failed to fetch accounts");
    } finally {
      setLoading(false);
    }
  };

  const addAccount = async () => {
    if (!userProfile?.id) return;

    try {
      setError(null);

      const { error } = await supabase.from("external_accounts").insert({
        user_id: userProfile.id,
        ...formData,
      });

      if (error) throw error;

      setFormData({
        account_name: "",
        bank_name: "",
        account_number: "",
        routing_number: "",
        account_type: "Checking",
        currency: "USD",
      });
      setShowAddForm(false);
      fetchAccounts();
      alert(t.accountAddedSuccess);
    } catch (error: any) {
      console.error("Error adding account:", error);
      setError(error.message || "Failed to add account");
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      setError(null);
      const { error } = await supabase
        .from("external_accounts")
        .delete()
        .eq("id", id);

      if (error) throw error;
      fetchAccounts();
      alert(t.accountDeletedSuccess);
    } catch (error: any) {
      console.error("Error deleting account:", error);
      setError(error.message || "Failed to delete account");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F26623]"></div>
            <span className="ml-2">{t.loadingAccounts}</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <div>
                  <h3 className="font-medium text-red-800">
                    {t.errorLoadingAccounts}
                  </h3>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                  <Button
                    onClick={fetchAccounts}
                    variant="outline"
                    size="sm"
                    className="mt-3 border-red-300 text-red-700 hover:bg-red-100 bg-transparent"
                  >
                    {t.tryAgain}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-x-4">
            <h2 className="text-2xl font-bold">{t.externalBankAccounts}</h2>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-[#F26623] hover:bg-[#E55A1F]"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t.addAccount}
            </Button>
          </div>

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
              className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:border-[#F26623] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#F26623] focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Languages className="h-4 w-4 text-[#F26623]" />
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
                          ? 'bg-[#F26623] text-white font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{name}</span>
                        {language === code && (
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>{t.addNewBankAccount}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="account_name">{t.accountName}</Label>
                  <Input
                    id="account_name"
                    value={formData.account_name}
                    onChange={(e) =>
                      setFormData({ ...formData, account_name: e.target.value })
                    }
                    placeholder={t.myCheckingAccount}
                  />
                </div>
                <div>
                  <Label htmlFor="bank_name">{t.bankName}</Label>
                  <Input
                    id="bank_name"
                    value={formData.bank_name}
                    onChange={(e) =>
                      setFormData({ ...formData, bank_name: e.target.value })
                    }
                    placeholder={t.chaseBankPlaceholder}
                  />
                </div>
                <div>
                  <Label htmlFor="account_number">{t.accountNumber}</Label>
                  <Input
                    id="account_number"
                    value={formData.account_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        account_number: e.target.value,
                      })
                    }
                    placeholder="1234567890"
                  />
                </div>
                <div>
                  <Label htmlFor="routing_number">{t.routingNumber}</Label>
                  <Input
                    id="routing_number"
                    value={formData.routing_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        routing_number: e.target.value,
                      })
                    }
                    placeholder="021000021"
                  />
                </div>
                <div>
                  <Label htmlFor="account_type">{t.accountType}</Label>
                  <Select
                    value={formData.account_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, account_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Checking">{t.checking}</SelectItem>
                      <SelectItem value="Savings">{t.savings}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="currency">{t.currency}</Label>
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
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={addAccount}
                  className="bg-[#F26623] hover:bg-[#E55A1F]"
                >
                  {t.addAccount}
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  {t.cancel}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {accounts.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">{t.noExternalAccounts}</p>
              </CardContent>
            </Card>
          ) : (
            accounts.map((account) => (
              <Card key={account.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {account.account_name}
                      </h3>
                      <p className="text-gray-600">{account.bank_name}</p>
                      <p className="text-sm text-gray-500">
                        {account.account_type === "Checking" ? t.checking : t.savings} • {account.currency}
                      </p>
                      <p className="text-sm text-gray-500">
                        ****{account.account_number.slice(-4)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {account.is_verified ? (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          {t.verified}
                        </div>
                      ) : (
                        <div className="flex items-center text-yellow-600">
                          <XCircle className="w-4 h-4 mr-1" />
                          {t.pending}
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteAccount(account.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
