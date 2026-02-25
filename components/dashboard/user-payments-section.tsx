"use client";

import PaymentCard from "@/components/payment-card";

interface UserPaymentsSectionProps {
  userProfile: {
    id: string;
    client_id: string;
    full_name: string | null;
    email: string | null;
  };
  setActiveTab: (tab: string) => void;
}

export default function UserPaymentsSection({
  userProfile,
  setActiveTab,
}: UserPaymentsSectionProps) {
  return (
    <div className="p-6">
      <PaymentCard userProfile={userProfile} setActiveTab={setActiveTab} />
    </div>
  );
}
