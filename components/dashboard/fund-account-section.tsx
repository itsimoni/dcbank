"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTranslations } from "@/lib/translations";
import {
  Bitcoin,
  Wallet,
  Building2,
  Copy,
  Check,
  Clock,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

interface FundAccountSectionProps {
  userProfile: any;
  setActiveTab?: (tab: string) => void;
}

interface FundRequest {
  id: string;
  funding_type: string;
  crypto_currency: string | null;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

const CRYPTO_WALLETS = {
  BTC: {
    address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    name: "Bitcoin",
    icon: "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/btc.svg",
    color: "#F7931A",
  },
  ETH: {
    address: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD87",
    name: "Ethereum",
    icon: "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/eth.svg",
    color: "#627EEA",
  },
  USDT: {
    address: "TYDzsYUEpvnYmQk4zGP9sWWcTEd2MiAtW6",
    name: "Tether (TRC20)",
    icon: "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/usdt.svg",
    color: "#26A17B",
  },
};

const BANK_DETAILS = {
  bankName: "",
  accountName: "",
  accountNumber: "",
  routingNumber: "",
  swiftCode: "",
  address: "",
  country: "",
};

export default function FundAccountSection({
  userProfile,
}: FundAccountSectionProps) {
  const { language } = useLanguage();
  const t = useMemo(() => getTranslations(language), [language]);

  const [activeMethod, setActiveMethod] = useState<"crypto" | "bank">("crypto");
  const [selectedCrypto, setSelectedCrypto] = useState<"BTC" | "ETH" | "USDT">("BTC");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fundRequests, setFundRequests] = useState<FundRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  const [cryptoForm, setCryptoForm] = useState({
    amount: "",
    txHash: "",
  });

  const [bankForm, setBankForm] = useState({
    amount: "",
    bankName: "",
    accountNumber: "",
    routingNumber: "",
    accountHolder: "",
    reference: "",
  });

  useEffect(() => {
    if (userProfile?.id) {
      fetchFundRequests();
    }
  }, [userProfile?.id]);

  const fetchFundRequests = async () => {
    if (!userProfile?.id) return;

    setLoadingRequests(true);
    const { data, error } = await supabase
      .from("fund_requests")
      .select("*")
      .eq("user_id", userProfile.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error && data) {
      setFundRequests(data);
    }
    setLoadingRequests(false);
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleCryptoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.id) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    const { error } = await supabase.from("fund_requests").insert({
      user_id: userProfile.id,
      funding_type: "crypto",
      crypto_currency: selectedCrypto,
      crypto_wallet_address: CRYPTO_WALLETS[selectedCrypto].address,
      crypto_tx_hash: cryptoForm.txHash,
      amount: parseFloat(cryptoForm.amount),
      currency: selectedCrypto,
      status: "pending",
    });

    setIsSubmitting(false);

    if (error) {
      setSubmitError(error.message);
    } else {
      setSubmitSuccess(true);
      setCryptoForm({ amount: "", txHash: "" });
      fetchFundRequests();
      setTimeout(() => setSubmitSuccess(false), 5000);
    }
  };

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.id) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    const { error } = await supabase.from("fund_requests").insert({
      user_id: userProfile.id,
      funding_type: "bank",
      amount: parseFloat(bankForm.amount),
      currency: "USD",
      bank_name: bankForm.bankName,
      bank_account_number: bankForm.accountNumber,
      bank_routing_number: bankForm.routingNumber,
      bank_account_holder: bankForm.accountHolder,
      bank_reference: bankForm.reference,
      status: "pending",
    });

    setIsSubmitting(false);

    if (error) {
      setSubmitError(error.message);
    } else {
      setSubmitSuccess(true);
      setBankForm({
        amount: "",
        bankName: "",
        accountNumber: "",
        routingNumber: "",
        accountHolder: "",
        reference: "",
      });
      fetchFundRequests();
      setTimeout(() => setSubmitSuccess(false), 5000);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fund Account</h1>
        <p className="text-gray-600 mt-1">
          Add funds to your account using cryptocurrency or bank transfer
        </p>
      </div>

      <Tabs value={activeMethod} onValueChange={(v) => setActiveMethod(v as "crypto" | "bank")}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="crypto" className="flex items-center gap-2">
            <Bitcoin className="w-4 h-4" />
            Crypto Deposit
          </TabsTrigger>
          <TabsTrigger value="bank" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Bank Transfer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="crypto">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Select Cryptocurrency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {(Object.keys(CRYPTO_WALLETS) as Array<keyof typeof CRYPTO_WALLETS>).map((crypto) => (
                    <button
                      key={crypto}
                      onClick={() => setSelectedCrypto(crypto)}
                      className={`p-4 border-2 transition-all rounded-none ${
                        selectedCrypto === crypto
                          ? "border-[#b91c1c]"
                          : "border-gray-200"
                      }`}
                    >
                      <img
                        src={CRYPTO_WALLETS[crypto].icon}
                        alt={crypto}
                        className="w-8 h-8 mx-auto mb-2"
                      />
                      <p className="text-sm font-medium text-center">{crypto}</p>
                    </button>
                  ))}
                </div>

                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600 mb-3">
                    Send {CRYPTO_WALLETS[selectedCrypto].name} to this address:
                  </p>
                  <div className="bg-white p-4 rounded-lg border mb-4">
                    <QRCodeSVG
                      value={CRYPTO_WALLETS[selectedCrypto].address}
                      size={180}
                      level="H"
                      includeMargin
                      className="mx-auto"
                    />
                  </div>
                  <div className="flex items-center gap-2 bg-white rounded-lg border p-3">
                    <code className="flex-1 text-xs break-all text-left">
                      {CRYPTO_WALLETS[selectedCrypto].address}
                    </code>
                    <button
                      onClick={() => copyToClipboard(CRYPTO_WALLETS[selectedCrypto].address, "crypto")}
                      className="p-2 hover:bg-gray-100 rounded transition-colors"
                    >
                      {copiedField === "crypto" ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    Only send {selectedCrypto} to this address. Sending other assets may result in permanent loss.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Confirm Your Deposit</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCryptoSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="crypto-amount">Amount Sent ({selectedCrypto})</Label>
                    <Input
                      id="crypto-amount"
                      type="number"
                      step="any"
                      placeholder={`Enter ${selectedCrypto} amount`}
                      value={cryptoForm.amount}
                      onChange={(e) => setCryptoForm({ ...cryptoForm, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="tx-hash">Transaction Hash (Optional)</Label>
                    <Input
                      id="tx-hash"
                      type="text"
                      placeholder="Enter transaction hash for faster verification"
                      value={cryptoForm.txHash}
                      onChange={(e) => setCryptoForm({ ...cryptoForm, txHash: e.target.value })}
                    />
                  </div>

                  {submitError && (
                    <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {submitError}
                    </div>
                  )}

                  {submitSuccess && (
                    <div className="bg-green-50 text-green-700 p-3 rounded-lg flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Deposit request submitted successfully! We will verify and credit your account.
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-[#b91c1c] hover:bg-[#991b1b]"
                    disabled={isSubmitting || !cryptoForm.amount}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Clock className="w-4 h-4 animate-spin" />
                        Submitting...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Submit Deposit Request
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bank">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Bank Transfer Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Transfer funds from your bank to our account using the details below:
                </p>
                <div className="space-y-4">
                  {[
                    { label: "Bank Name", value: BANK_DETAILS.bankName, key: "bankName" },
                    { label: "Account Name", value: BANK_DETAILS.accountName, key: "accountName" },
                    { label: "Account Number", value: BANK_DETAILS.accountNumber, key: "accountNumber" },
                    { label: "Routing Number (ABA)", value: BANK_DETAILS.routingNumber, key: "routingNumber" },
                    { label: "SWIFT Code", value: BANK_DETAILS.swiftCode, key: "swiftCode" },
                    { label: "Bank Address", value: BANK_DETAILS.address, key: "address" },
                  ].map((item) => (
                    <div key={item.key} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">{item.value}</p>
                        <button
                          onClick={() => copyToClipboard(item.value, item.key)}
                          className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                        >
                          {copiedField === item.key ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                  <p className="text-xs text-yellow-800">
                    <strong>Important:</strong> Include your account email or full name as the payment reference to ensure proper allocation of funds.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Bank Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBankSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="bank-amount">Transfer Amount (USD)</Label>
                    <Input
                      id="bank-amount"
                      type="number"
                      step="0.01"
                      placeholder="Enter amount"
                      value={bankForm.amount}
                      onChange={(e) => setBankForm({ ...bankForm, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="client-bank">Your Bank Name</Label>
                    <Input
                      id="client-bank"
                      type="text"
                      placeholder="Enter your bank name"
                      value={bankForm.bankName}
                      onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="client-account">Your Account Number</Label>
                    <Input
                      id="client-account"
                      type="text"
                      placeholder="Enter your account number"
                      value={bankForm.accountNumber}
                      onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="client-routing">Routing Number</Label>
                    <Input
                      id="client-routing"
                      type="text"
                      placeholder="Enter routing number"
                      value={bankForm.routingNumber}
                      onChange={(e) => setBankForm({ ...bankForm, routingNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="client-holder">Account Holder Name</Label>
                    <Input
                      id="client-holder"
                      type="text"
                      placeholder="Enter account holder name"
                      value={bankForm.accountHolder}
                      onChange={(e) => setBankForm({ ...bankForm, accountHolder: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="client-reference">Transfer Reference</Label>
                    <Input
                      id="client-reference"
                      type="text"
                      placeholder="Reference used in transfer"
                      value={bankForm.reference}
                      onChange={(e) => setBankForm({ ...bankForm, reference: e.target.value })}
                    />
                  </div>

                  {submitError && (
                    <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {submitError}
                    </div>
                  )}

                  {submitSuccess && (
                    <div className="bg-green-50 text-green-700 p-3 rounded-lg flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Bank transfer request submitted! We will verify and credit your account.
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-[#b91c1c] hover:bg-[#991b1b]"
                    disabled={isSubmitting || !bankForm.amount || !bankForm.bankName}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Clock className="w-4 h-4 animate-spin" />
                        Submitting...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Submit Transfer Request
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Fund Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingRequests ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b91c1c] mx-auto"></div>
            </div>
          ) : fundRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No fund requests yet. Submit your first deposit above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 text-sm font-medium text-gray-500">Date</th>
                    <th className="pb-3 text-sm font-medium text-gray-500">Type</th>
                    <th className="pb-3 text-sm font-medium text-gray-500">Amount</th>
                    <th className="pb-3 text-sm font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {fundRequests.map((request) => (
                    <tr key={request.id} className="border-b last:border-0">
                      <td className="py-3 text-sm">
                        {new Date(request.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <span className="text-sm">
                          {request.funding_type === "crypto" ? (
                            request.crypto_currency
                          ) : (
                            "Bank"
                          )}
                        </span>
                      </td>
                      <td className="py-3 text-sm font-medium">
                        {request.amount} {request.currency}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(request.status)}`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
