"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import AuthForm from "@/components/auth/auth-form";
import Dashboard from "@/components/dashboard/dashboard";
import KYCVerification from "@/components/auth/kyc-verification";
import type { User } from "@supabase/supabase-js";

// Session cache to prevent unnecessary refetches
const sessionCache = {
  user: null as User | null,
  kycStatus: null as string | null,
  timestamp: 0,
  CACHE_DURATION: 60000, // 1 minute
};

export default function Page() {
  const [user, setUser] = useState<User | null>(() => sessionCache.user);
  const [loading, setLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState<string | null>(() => sessionCache.kycStatus);
  const hasInitialized = useRef(false);
  const isVisible = useRef(true);

  // Track page visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisible.current = !document.hidden;
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Initialize authentication with caching
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initAuth = async () => {
      try {
        // Check if we have fresh cached session
        const isCacheFresh = sessionCache.user &&
          Date.now() - sessionCache.timestamp < sessionCache.CACHE_DURATION;

        if (isCacheFresh && sessionCache.user) {
          setUser(sessionCache.user);
          setKycStatus(sessionCache.kycStatus);
          setLoading(false);
          return;
        }

        // Fetch fresh session
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (!authUser) {
          setLoading(false);
          return;
        }

        setUser(authUser);

        // Check KYC status
        const { data: userData } = await supabase
          .from("users")
          .select("kyc_status")
          .eq("id", authUser.id)
          .maybeSingle();

        const status = userData?.kyc_status || "not_started";

        // Update cache
        sessionCache.user = authUser;
        sessionCache.kycStatus = status;
        sessionCache.timestamp = Date.now();

        setKycStatus(status);
        setLoading(false);
      } catch (error) {
        console.error("Auth initialization error:", error);
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "INITIAL_SESSION") return;

      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        setLoading(true);

        const { data: userData } = await supabase
          .from("users")
          .select("kyc_status")
          .eq("id", session.user.id)
          .maybeSingle();

        const status = userData?.kyc_status || "not_started";

        // Update cache
        sessionCache.user = session.user;
        sessionCache.kycStatus = status;
        sessionCache.timestamp = Date.now();

        setKycStatus(status);
        setLoading(false);
      } else if (event === "SIGNED_OUT") {
        // Clear cache on sign out
        sessionCache.user = null;
        sessionCache.kycStatus = null;
        sessionCache.timestamp = 0;

        setUser(null);
        setKycStatus(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Simple loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#b91c1c]"></div>
        <p className="text-gray-600 text-lg">Loading...</p>
      </div>
    );
  }

  if (!user) return <AuthForm />;

  if (kycStatus === "not_started") {
    return (
      <KYCVerification
        userId={user.id}
        onKYCComplete={() => setKycStatus("approved")}
      />
    );
  }

  if (kycStatus === "pending") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            KYC Under Review
          </h1>
          <p className="text-gray-600 mb-4">
            Your KYC documents are being reviewed. This usually takes 1–3
            business days.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => supabase.auth.signOut()}
              className="block w-full text-[#b91c1c] hover:text-[#991b1b] font-medium py-2"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (kycStatus === "rejected") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            KYC Verification Failed
          </h1>
          <p className="text-gray-600 mb-4">
            Your KYC verification was not approved. Please contact support or
            try again.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => setKycStatus("not_started")}
              className="block w-full bg-[#b91c1c] hover:bg-[#991b1b] text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => supabase.auth.signOut()}
              className="block w-full text-[#b91c1c] hover:text-[#991b1b] font-medium py-2"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}
