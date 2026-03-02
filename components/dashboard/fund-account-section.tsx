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
    address: "bc1qn7qsslxz2ngn3x2uyrmyy3sdgv0eq6pcutazmt",
    name: "Bitcoin",
    icon: "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/btc.svg",
    color: "#F7931A",
    network: "Bitcoin Network",
  },
  ETH: {
    address: "0xcd1d69695884c60d2784c17c8d435a1341a7fbac",
    name: "Ethereum",
    icon: "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/eth.svg",
    color: "#627EEA",
    network: "Ethereum Mainnet",
  },
  USDT: {
    address: "TUKJShLza5hCjeWcNLae3zLe4eWTPFELqT",
    name: "Tether (TRC20)",
    icon: "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/usdt.svg",
    color: "#26A17B",
    network: "Tron Network (TRC20)",
  },
  USDC: {
    address: "0xcd1d69695884c60d2784c17c8d435a1341a7fbac",
    name: "USD Coin",
    icon: "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/usdc.svg",
    color: "#2775CA",
    network: "Ethereum Mainnet (ERC20)",
  },
  SOL: {
    address: "7i3WnWp1ovKFsKzrpMRqtnjB2aSUiNKEGkAmVG1qDXZY",
    name: "Solana",
    icon: "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/sol.svg",
    color: "#9945FF",
    network: "Solana Network",
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
  const [selectedCrypto, setSelectedCrypto] = useState<"BTC" | "ETH" | "USDT" | "USDC" | "SOL">("BTC");
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
        <h1 className="text-2xl font-bold text-gray-900">{t.fundAccount}</h1>
        <p className="text-gray-600 mt-1">
          {t.fundAccountSubtitle}
        </p>
      </div>

      <Tabs value={activeMethod} onValueChange={(v) => setActiveMethod(v as "crypto" | "bank")}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="crypto" className="flex items-center gap-2">
            <Bitcoin className="w-4 h-4" />
            {t.cryptoDepositTab}
          </TabsTrigger>
          <TabsTrigger value="bank" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            {t.bankTransferTab}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="crypto">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  {t.selectCryptocurrency}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2 mb-6">
                  {(Object.keys(CRYPTO_WALLETS) as Array<keyof typeof CRYPTO_WALLETS>).map((crypto) => (
                    <button
                      key={crypto}
                      onClick={() => setSelectedCrypto(crypto)}
                      className={`p-3 border-2 transition-all rounded-none ${
                        selectedCrypto === crypto
                          ? "border-[#b91c1c] bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <img
                        src={CRYPTO_WALLETS[crypto].icon}
                        alt={crypto}
                        className="w-7 h-7 mx-auto mb-1"
                      />
                      <p className="text-xs font-medium text-center">{crypto}</p>
                    </button>
                  ))}
                </div>

                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600 mb-3">
                    {t.sendCryptoToAddress.replace("{crypto}", CRYPTO_WALLETS[selectedCrypto].name)}
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
                    {t.cryptoSendWarning.replace("{crypto}", selectedCrypto)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t.confirmYourDeposit}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCryptoSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="crypto-amount">{t.amountSent} ({selectedCrypto})</Label>
                    <Input
                      id="crypto-amount"
                      type="number"
                      step="any"
                      placeholder={t.enterCryptoAmount.replace("{crypto}", selectedCrypto)}
                      value={cryptoForm.amount}
                      onChange={(e) => setCryptoForm({ ...cryptoForm, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="tx-hash">{t.transactionHashOptional}</Label>
                    <Input
                      id="tx-hash"
                      type="text"
                      placeholder={t.enterTxHashPlaceholder}
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
                      {t.depositRequestSuccess}
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
                        {t.submittingText}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        {t.submitDepositRequest}
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
                  {t.bankTransferDetails}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  {t.bankTransferInstructions}
                </p>
                <div className="space-y-4">
                  {[
                    { label: t.bankName, value: BANK_DETAILS.bankName, key: "bankName" },
                    { label: t.accountName, value: BANK_DETAILS.accountName, key: "accountName" },
                    { label: t.accountNumber, value: BANK_DETAILS.accountNumber, key: "accountNumber" },
                    { label: t.routingNumberABA, value: BANK_DETAILS.routingNumber, key: "routingNumber" },
                    { label: t.swiftCode, value: BANK_DETAILS.swiftCode, key: "swiftCode" },
                    { label: t.bankAddressLabel, value: BANK_DETAILS.address, key: "address" },
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
                    {t.bankTransferImportant}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t.yourBankDetails}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBankSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="bank-amount">{t.transferAmountUSD}</Label>
                    <Input
                      id="bank-amount"
                      type="number"
                      step="0.01"
                      placeholder={t.enterAmountPlaceholder}
                      value={bankForm.amount}
                      onChange={(e) => setBankForm({ ...bankForm, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="client-bank">{t.yourBankName}</Label>
                    <Input
                      id="client-bank"
                      type="text"
                      placeholder={t.enterYourBankName}
                      value={bankForm.bankName}
                      onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="client-account">{t.yourAccountNumber}</Label>
                    <Input
                      id="client-account"
                      type="text"
                      placeholder={t.enterYourAccountNumber}
                      value={bankForm.accountNumber}
                      onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="client-routing">{t.routingNumber}</Label>
                    <Input
                      id="client-routing"
                      type="text"
                      placeholder={t.enterRoutingNumber}
                      value={bankForm.routingNumber}
                      onChange={(e) => setBankForm({ ...bankForm, routingNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="client-holder">{t.accountHolderName}</Label>
                    <Input
                      id="client-holder"
                      type="text"
                      placeholder={t.enterAccountHolderName}
                      value={bankForm.accountHolder}
                      onChange={(e) => setBankForm({ ...bankForm, accountHolder: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="client-reference">{t.transferReference}</Label>
                    <Input
                      id="client-reference"
                      type="text"
                      placeholder={t.referenceUsedInTransfer}
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
                      {t.bankTransferSuccess}
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
                        {t.submittingText}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        {t.submitTransferRequest}
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
            {t.recentFundRequests}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingRequests ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b91c1c] mx-auto"></div>
            </div>
          ) : fundRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {t.noFundRequestsYet}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 text-sm font-medium text-gray-500">{t.dateColumn}</th>
                    <th className="pb-3 text-sm font-medium text-gray-500">{t.typeColumn}</th>
                    <th className="pb-3 text-sm font-medium text-gray-500">{t.amountColumn}</th>
                    <th className="pb-3 text-sm font-medium text-gray-500">{t.statusColumn}</th>
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
                            t.bankType
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
