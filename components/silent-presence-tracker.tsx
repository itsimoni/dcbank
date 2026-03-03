"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useSilentPresence } from "@/hooks/use-silent-presence";

export function SilentPresenceTracker() {
  const { user } = useAuth();

  useSilentPresence({
    userId: user?.id ?? null,
    enabled: !!user?.id,
    heartbeatInterval: 30000,
  });

  return null;
}
