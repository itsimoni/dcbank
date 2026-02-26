"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

const KYC_CACHE_KEY = "kyc_status_cache";

function getCachedKycStatus(userId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = localStorage.getItem(KYC_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.userId === userId && parsed.status) {
        return parsed.status;
      }
    }
  } catch {
    // Ignore cache errors
  }
  return null;
}

function setCachedKycStatus(userId: string, status: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KYC_CACHE_KEY, JSON.stringify({ userId, status }));
  } catch {
    // Ignore cache errors
  }
}

export function useKYCStatus(userId: string | null) {
  const cachedStatus = userId ? getCachedKycStatus(userId) : null;
  const canSkipLoading = cachedStatus === "approved" || cachedStatus === "skipped";

  const [kycStatus, setKycStatus] = useState<
    "not_started" | "pending" | "approved" | "rejected" | "skipped" | null
  >(canSkipLoading ? (cachedStatus as "approved" | "skipped") : null);
  const [loading, setLoading] = useState(!canSkipLoading);
  const [error, setError] = useState<string | null>(null);
  const verifiedRef = useRef(false);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const checkKYCStatus = async () => {
      try {
        setError(null);

        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("kyc_status")
          .eq("id", userId)
          .single();

        if (userError) {
          // Handle specific error cases
          if (userError.code === "PGRST116") {
            // User not found - create user record
            
            const { error: insertError } = await supabase.from("users").insert({
              id: userId,
              kyc_status: "not_started",
              created_at: new Date().toISOString(),
            });

            if (insertError) {
              console.error("Error creating user record:", insertError);
              setError("Failed to create user record");
            }

            setCachedKycStatus(userId, "not_started");
            setKycStatus("not_started");
          } else {
            console.error("Database error:", userError);
            setError(`Database error: ${userError.message}`);
            setKycStatus("not_started");
          }
        } else {
          const status = userData?.kyc_status || "not_started";
          setCachedKycStatus(userId, status);
          setKycStatus(status);
          verifiedRef.current = true;
        }
      } catch (error: any) {
        console.error("Error checking KYC status:", error);
        setError(error.message);
        setKycStatus("not_started");
      } finally {
        setLoading(false);
      }
    };

    checkKYCStatus();

    let subscription: ReturnType<typeof supabase.channel> | null = null;
    const subscriptionTimer = setTimeout(() => {
      subscription = supabase
        .channel(`kyc-status-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "users",
            filter: `id=eq.${userId}`,
          },
          (payload) => {
            const newStatus = payload.new.kyc_status;
            setCachedKycStatus(userId, newStatus);
            setKycStatus(newStatus);
          }
        )
        .subscribe();
    }, 2000);

    return () => {
      clearTimeout(subscriptionTimer);
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [userId]);

  // Refresh function for manual updates
  const refreshKYCStatus = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("kyc_status")
        .eq("id", userId)
        .single();

      if (!userError && userData) {
        setCachedKycStatus(userId, userData.kyc_status);
        setKycStatus(userData.kyc_status);
      }
    } catch (error) {
      console.error("Error refreshing KYC status:", error);
    } finally {
      setLoading(false);
    }
  };

  return { kycStatus, loading, error, refreshKYCStatus };
}
