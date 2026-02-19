"use client";

import React, { useState, useCallback } from "react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import Sidebar from "./sidebar";
import DashboardContent from "./dashboard-content";
import AccountsSection from "./accounts-section";
import DepositsSection from "./transaction-history";
import PaymentsSection from "./payments-section";
import CardSection from "./card-section";
import SupportSection from "./support-section";
import TransfersSection from "./transfers-section-fixed";
import CryptoSection from "./crypto-section-fixed";
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
  crypto: CryptoSection,
  message: MessageSection,
  support: SupportSection,
  profile: Profile,
  loans: LoansSection,
} as const;

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { userProfile, balances, cryptoBalances, transactions, loading, error } = useDashboardData();

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
    <div className="relative h-screen bg-gray-100">
      <div className="flex h-full">
        <div className="md:w-64 md:h-full md:fixed md:left-0 md:top-0 md:z-20">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            userProfile={userProfile}
          />
        </div>

        <div className="flex-1 md:ml-64 overflow-auto">
          {SectionComponent && (
            <SectionComponent
              userProfile={userProfile}
              setActiveTab={handleTabChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}
