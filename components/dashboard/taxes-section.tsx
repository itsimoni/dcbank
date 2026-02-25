"use client";

import TaxCard from "@/components/tax-card";

interface TaxesSectionProps {
  userProfile: {
    id: string;
    client_id: string;
    full_name: string | null;
    email: string | null;
  };
  setActiveTab: (tab: string) => void;
}

export default function TaxesSection({
  userProfile,
  setActiveTab,
}: TaxesSectionProps) {
  return (
    <div className="p-6">
      <TaxCard userProfile={userProfile} setActiveTab={setActiveTab} />
    </div>
  );
}
