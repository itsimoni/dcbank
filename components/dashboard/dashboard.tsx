"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTranslations } from "@/lib/translations";
import { LogOut, ChevronDown } from "lucide-react";
import Sidebar from "./sidebar";
import DashboardContent from "./dashboard-content";
import AccountsSection from "./accounts-section";
import DepositsSection from "./transaction-history";
import PaymentsSection from "./payments-section";
import CardSection from "./card-section";
import SupportSection from "./support-section";
import TransfersSection from "./transfers-section-fixed";
import MessageSection from "./message-section-database";
import LoansSection from "./loans-section";
import Profile from "./Profile";

const SECTION_COMPONENTS = {
  dashboard: DashboardContent,
  accounts: AccountsSection,
  transfers: TransfersSection,
  deposit: DepositsSection,
  payments: PaymentsSection,
  card: CardSection,
  message: MessageSection,
  support: SupportSection,
  profile: Profile,
  loans: LoansSection,
} as const;

export default function Dashboard() {
  const searchParams = useSearchParams();
  const sectionFromUrl = searchParams.get("section");
  const initialSection = sectionFromUrl && sectionFromUrl in SECTION_COMPONENTS ? sectionFromUrl : "dashboard";
  const [activeTab, setActiveTab] = useState(initialSection);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const isComponentMountedRef = useRef<boolean>(true);
  const { language } = useLanguage();
  const t = getTranslations(language);

  useEffect(() => {
    if (sectionFromUrl && sectionFromUrl in SECTION_COMPONENTS) {
      setActiveTab(sectionFromUrl);
    }
  }, [sectionFromUrl]);

  useEffect(() => {
    return () => {
      isComponentMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { userProfile, balances, cryptoBalances, transactions, loading, error } = useDashboardData();

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      isComponentMountedRef.current = false;
      let user;
      try {
        const userResult = await Promise.race([
          supabase.auth.getUser(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("User fetch timeout")), 2000)
          ),
        ]);
        user = userResult.data?.user;
      } catch (error) {
        console.warn("Could not fetch user for logout:", error);
      }

      if (user) {
        const updatePresence = async () => {
          try {
            await Promise.race([
              supabase.from("user_presence").upsert(
                {
                  user_id: user.id,
                  is_online: false,
                  last_seen: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                { onConflict: "user_id" }
              ),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("Presence timeout")), 1000)
              ),
            ]);
          } catch {}
        };
        updatePresence();
      }

      const logoutStrategies = [
        () =>
          Promise.race([
            supabase.auth.signOut(),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("Normal logout timeout")), 3000)
            ),
          ]),
        () => supabase.auth.signOut({ scope: "local" }),
        () => Promise.resolve({ error: null }),
      ];

      let logoutSuccess = false;
      for (const strategy of logoutStrategies) {
        try {
          const result = await strategy();
          if (!result.error) {
            logoutSuccess = true;
            break;
          }
        } catch (error) {
          console.warn("Logout strategy failed:", error);
          continue;
        }
      }

      if (logoutSuccess) {
        console.log("Successfully signed out");
      } else {
        console.warn("All logout strategies failed, but continuing...");
      }
    } catch (error) {
      console.error("Critical error during logout:", error);
    } finally {
      setIsLoggingOut(false);
      try {
        window.location.href = "/";
      } catch {
        window.location.reload();
      }
    }
  };

  const displayName = userProfile?.full_name
    ? userProfile.full_name
        .toLowerCase()
        .split(" ")
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : t.clientName;

  const handleTabChange = useCallback((newTab: string) => {
    setActiveTab(newTab);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F26623] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 text-red-500">⚠️</div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Connection Error
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#F26623] text-white px-6 py-2 rounded-lg hover:bg-[#d55a1f] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No user profile found</p>
        </div>
      </div>
    );
  }

  // Render the selected section
  const SectionComponent = SECTION_COMPONENTS[activeTab as keyof typeof SECTION_COMPONENTS];

  return (
    <div className="relative min-h-screen bg-gray-100 flex flex-col">
      <div className="sticky top-0 z-50">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          userProfile={userProfile}
        />
      </div>

      <div className="flex-1 overflow-auto">
        <div className="flex justify-end px-4 py-3">
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#b91c1c] text-white hover:bg-[#991b1b] transition-colors"
            >
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm font-medium max-w-[120px] truncate">
                {displayName}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {showUserMenu && (
              <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[160px]">
                <button
                  onClick={handleSignOut}
                  disabled={isLoggingOut}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm transition-colors flex items-center gap-2 text-red-600"
                >
                  {isLoggingOut ? (
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                  {isLoggingOut ? t.loggingOut : t.signOut}
                </button>
              </div>
            )}
          </div>
        </div>
        {SectionComponent && (
          <SectionComponent
            userProfile={userProfile}
            setActiveTab={handleTabChange}
          />
        )}
      </div>
    </div>
  );
}
