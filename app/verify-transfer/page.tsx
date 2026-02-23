"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, AlertTriangle, Shield, Loader2 } from "lucide-react";
import Link from "next/link";

type VerificationStatus = "loading" | "success" | "expired" | "invalid" | "already_verified" | "cancelled" | "error";

interface TransferData {
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  fee: number;
}

interface VerificationResult {
  id: string;
  transferType: string;
  transferData: TransferData;
  verifiedAt: string;
}

function VerifyTransferContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<VerificationStatus>("loading");
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      setErrorMessage("No verification token provided.");
      return;
    }

    verifyToken(token);
  }, [token]);

  const verifyToken = async (verificationToken: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/verify-transfer-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ token: verificationToken }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus("success");
        setResult(data.verification);
      } else {
        switch (data.code) {
          case "EXPIRED":
            setStatus("expired");
            break;
          case "INVALID_TOKEN":
            setStatus("invalid");
            break;
          case "ALREADY_VERIFIED":
            setStatus("already_verified");
            break;
          case "CANCELLED":
            setStatus("cancelled");
            break;
          default:
            setStatus("error");
        }
        setErrorMessage(data.message || data.error);
      }
    } catch (error) {
      console.error("Verification error:", error);
      setStatus("error");
      setErrorMessage("An unexpected error occurred. Please try again.");
    }
  };

  const getTransferTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      internal: "Internal Currency Exchange",
      bank_transfer: "International Bank Wire Transfer",
      crypto_internal: "Cryptocurrency Exchange",
      crypto_external: "External Cryptocurrency Withdrawal",
    };
    return labels[type] || "Transfer";
  };

  const formatCurrency = (amount: number, currency: string): string => {
    const cryptoCurrencies = ["BTC", "ETH", "ADA", "DOT", "LINK", "XRP", "SOL", "AVAX", "MATIC", "ATOM"];
    if (cryptoCurrencies.includes(currency?.toUpperCase())) {
      return `${amount.toFixed(8)} ${currency}`;
    }
    return `${amount.toFixed(2)} ${currency}`;
  };

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <div className="text-center py-12">
            <Loader2 className="h-16 w-16 animate-spin text-red-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Verifying Your Transfer</h2>
            <p className="text-slate-600">Please wait while we verify your transfer request...</p>
          </div>
        );

      case "success":
        return (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-700 mb-2">Transfer Verified Successfully</h2>
            <p className="text-slate-600 mb-8">
              Your {result ? getTransferTypeLabel(result.transferType).toLowerCase() : "transfer"} has been verified and will be processed shortly.
            </p>

            {result && (
              <div className="bg-slate-50 border border-slate-200 p-6 text-left mb-8">
                <h3 className="font-semibold text-slate-800 mb-4 text-center">Transfer Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Transfer Type:</span>
                    <span className="font-medium text-slate-800">{getTransferTypeLabel(result.transferType)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Amount:</span>
                    <span className="font-medium text-slate-800">
                      {formatCurrency(result.transferData.fromAmount, result.transferData.fromCurrency)}
                    </span>
                  </div>
                  {result.transferData.toCurrency !== result.transferData.fromCurrency && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">You will receive:</span>
                      <span className="font-medium text-slate-800">
                        {formatCurrency(result.transferData.toAmount, result.transferData.toCurrency)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-600">Fee:</span>
                    <span className="font-medium text-slate-800">
                      {formatCurrency(result.transferData.fee, result.transferData.fromCurrency)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-slate-200">
                    <span className="text-slate-600">Verified at:</span>
                    <span className="font-medium text-slate-800">
                      {new Date(result.verifiedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <Link href="/">
              <Button className="bg-red-600 hover:bg-red-700">
                Return to Dashboard
              </Button>
            </Link>
          </div>
        );

      case "expired":
        return (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="h-12 w-12 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-amber-700 mb-2">Verification Link Expired</h2>
            <p className="text-slate-600 mb-4">{errorMessage}</p>
            <p className="text-slate-500 text-sm mb-8">
              For your security, verification links are only valid for 30 minutes.
              Please log in to your account and initiate a new transfer request.
            </p>
            <Link href="/">
              <Button className="bg-red-600 hover:bg-red-700">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        );

      case "invalid":
        return (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-red-700 mb-2">Invalid Verification Link</h2>
            <p className="text-slate-600 mb-4">{errorMessage}</p>
            <p className="text-slate-500 text-sm mb-8">
              The verification link you used is invalid or has already been used.
              Please check your email for the correct link or initiate a new transfer.
            </p>
            <Link href="/">
              <Button className="bg-red-600 hover:bg-red-700">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        );

      case "already_verified":
        return (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="h-12 w-12 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-blue-700 mb-2">Transfer Already Verified</h2>
            <p className="text-slate-600 mb-4">{errorMessage}</p>
            <p className="text-slate-500 text-sm mb-8">
              This transfer has already been verified. No further action is required.
            </p>
            <Link href="/">
              <Button className="bg-red-600 hover:bg-red-700">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        );

      case "cancelled":
        return (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-12 w-12 text-slate-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-700 mb-2">Transfer Cancelled</h2>
            <p className="text-slate-600 mb-4">{errorMessage}</p>
            <p className="text-slate-500 text-sm mb-8">
              This transfer request was cancelled and cannot be verified.
            </p>
            <Link href="/">
              <Button className="bg-red-600 hover:bg-red-700">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        );

      case "error":
      default:
        return (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-12 w-12 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-red-700 mb-2">Verification Error</h2>
            <p className="text-slate-600 mb-4">{errorMessage || "An error occurred during verification."}</p>
            <p className="text-slate-500 text-sm mb-8">
              Please try again or contact support if the problem persists.
            </p>
            <div className="space-x-4">
              <Button
                variant="outline"
                onClick={() => token && verifyToken(token)}
              >
                Try Again
              </Button>
              <Link href="/">
                <Button className="bg-red-600 hover:bg-red-700">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-red-700 tracking-wide">MALTA GLOBAL CRYPTO BANK</h1>
          <p className="text-slate-600 text-sm mt-1">Transfer Verification</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="bg-slate-800 text-white">
            <CardTitle className="text-center text-lg">
              <Shield className="inline-block w-5 h-5 mr-2 -mt-1" />
              Secure Transfer Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {renderContent()}
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-slate-500 text-xs">
            If you did not request this transfer, please contact our security team immediately at{" "}
            <a href="mailto:security@maltaglobalcryptobank.com" className="text-red-600 hover:underline">
              security@maltaglobalcryptobank.com
            </a>
          </p>
        </div>

        <div className="mt-8 text-center text-xs text-slate-400">
          <p>Malta Global Crypto Bank</p>
          <p>Authorised and regulated by the Malta Financial Services Authority (MFSA)</p>
          <p>Licence Reference: MFSA/CL/2024/0892</p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyTransferPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    }>
      <VerifyTransferContent />
    </Suspense>
  );
}
