"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type VerificationStatus = "loading" | "success" | "already_verified" | "expired" | "invalid" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<VerificationStatus>("loading");
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("invalid");
        return;
      }

      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const response = await fetch(`${supabaseUrl}/functions/v1/verify-email-token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setEmail(data.email || "");
          if (data.alreadyVerified) {
            setStatus("already_verified");
          } else {
            setStatus("success");
          }
        } else {
          if (data.code === "TOKEN_EXPIRED") {
            setStatus("expired");
          } else if (data.code === "INVALID_TOKEN") {
            setStatus("invalid");
          } else {
            setStatus("error");
          }
        }
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("error");
      }
    };

    verifyEmail();
  }, [token]);

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-[#b91c1c] animate-spin" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying Your Email</h1>
              <p className="text-gray-600">Please wait while we verify your email address...</p>
            </div>
          </div>
        );

      case "success":
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verified Successfully</h1>
              <p className="text-gray-600">
                Your email address <span className="font-semibold text-gray-900">{email}</span> has been verified.
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 p-6 text-left">
              <h3 className="font-semibold text-green-800 mb-3">What's Next?</h3>
              <p className="text-green-700 text-sm mb-4">
                You can now sign in to your account and complete the KYC (Know Your Customer) verification process to fully activate your Malta Global Crypto Bank account.
              </p>
              <ul className="text-sm text-green-700 space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Access to secure banking services</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Cryptocurrency trading and management</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>International transfers and payments</span>
                </li>
              </ul>
            </div>
            <Button
              onClick={() => router.push("/")}
              className="w-full h-12 bg-[#b91c1c] hover:bg-[#991b1b] text-white font-medium"
            >
              Continue to Sign In
            </Button>
          </div>
        );

      case "already_verified":
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Already Verified</h1>
              <p className="text-gray-600">
                Your email address has already been verified. You can proceed to sign in.
              </p>
            </div>
            <Button
              onClick={() => router.push("/")}
              className="w-full h-12 bg-[#b91c1c] hover:bg-[#991b1b] text-white font-medium"
            >
              Go to Sign In
            </Button>
          </div>
        );

      case "expired":
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-yellow-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Link Expired</h1>
              <p className="text-gray-600">
                This verification link has expired. Please register again to receive a new verification email.
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-800">
              Verification links are valid for 24 hours for security purposes.
            </div>
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="w-full h-12 border-[#b91c1c] text-[#b91c1c] hover:bg-[#b91c1c] hover:text-white"
            >
              Return to Registration
            </Button>
          </div>
        );

      case "invalid":
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Verification Link</h1>
              <p className="text-gray-600">
                This verification link is invalid or has already been used. Please check the link in your email or register again.
              </p>
            </div>
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="w-full h-12 border-[#b91c1c] text-[#b91c1c] hover:bg-[#b91c1c] hover:text-white"
            >
              Return to Home
            </Button>
          </div>
        );

      case "error":
      default:
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
              <p className="text-gray-600">
                An error occurred while verifying your email. Please try again later or contact support.
              </p>
            </div>
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="w-full h-12 border-[#b91c1c] text-[#b91c1c] hover:bg-[#b91c1c] hover:text-white"
            >
              Return to Home
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="hidden lg:flex lg:w-1/2 bg-[#b91c1c] items-center justify-center p-8">
        <div className="max-w-md text-center">
          <img
            src="/logo2.svg"
            alt="Malta Global Crypto Bank"
            className="w-full max-w-[400px] mx-auto mb-8"
          />
          <div className="text-white/90 text-sm leading-relaxed space-y-3">
            <p className="font-semibold text-white text-base border-b border-white/20 pb-3">
              Licensed & Regulated Banking
            </p>
            <p>
              Authorised and regulated by the Malta Financial Services Authority (MFSA)
            </p>
            <p className="text-xs text-white/70">
              Member of the Depositor Compensation Scheme under the laws of Malta
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white flex flex-col">
        <div className="lg:hidden bg-[#b91c1c] px-4 py-6 text-center">
          <img
            src="/logo2.svg"
            alt="Malta Global Crypto Bank"
            className="h-16 mx-auto"
          />
        </div>

        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
          <div className="w-full max-w-md">
            {renderContent()}
          </div>
        </div>

        <div className="px-4 py-6 text-center text-xs text-gray-500 border-t border-gray-200">
          <p>Malta Global Crypto Bank - Licensed by MFSA</p>
          <p className="mt-1">171 Old Bakery Street, Valletta VLT 1455, Malta</p>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#b91c1c] animate-spin" />
        </div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
