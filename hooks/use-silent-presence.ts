"use client";
import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface UseSilentPresenceProps {
  userId: string | null;
  enabled?: boolean;
  heartbeatInterval?: number;
}

export function useSilentPresence({
  userId,
  enabled = true,
  heartbeatInterval = 30000,
}: UseSilentPresenceProps) {
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const isOnlineRef = useRef(false);
  const lastActivityRef = useRef(Date.now());
  const lastUpdateRef = useRef(0);

  const updatePresence = useCallback(
    async (isOnline: boolean, force = false) => {
      if (!userId || !enabled) return;

      const now = Date.now();
      if (!force && now - lastUpdateRef.current < 10000) {
        return;
      }

      try {
        const timestamp = new Date().toISOString();

        const { error } = await supabase
          .from("user_presence")
          .upsert(
            {
              user_id: userId,
              is_online: isOnline,
              last_seen: timestamp,
              updated_at: timestamp,
            },
            {
              onConflict: "user_id",
            }
          );

        if (!error) {
          isOnlineRef.current = isOnline;
          lastUpdateRef.current = now;
        }
      } catch {
        // Silent fail
      }
    },
    [userId, enabled]
  );

  const handleActivity = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;

    if (!isOnlineRef.current) {
      updatePresence(true);
    }
  }, [updatePresence]);

  useEffect(() => {
    if (!enabled || !userId) return;

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
      "focus",
    ];

    let throttleTimeout: NodeJS.Timeout | null = null;
    const throttledActivity = () => {
      if (throttleTimeout) return;
      throttleTimeout = setTimeout(() => {
        handleActivity();
        throttleTimeout = null;
      }, 5000);
    };

    events.forEach((event) => {
      document.addEventListener(event, throttledActivity, true);
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, throttledActivity, true);
      });
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
    };
  }, [handleActivity, enabled, userId]);

  useEffect(() => {
    if (!enabled || !userId) return;

    updatePresence(true, true);

    heartbeatRef.current = setInterval(() => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivityRef.current;
      const inactivityThreshold = 120000;

      if (timeSinceActivity > inactivityThreshold) {
        if (isOnlineRef.current) {
          updatePresence(false, true);
        }
      } else {
        updatePresence(true);
      }
    }, heartbeatInterval);

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
    };
  }, [updatePresence, enabled, userId, heartbeatInterval]);

  useEffect(() => {
    if (!enabled || !userId) return;

    let hiddenTimeout: NodeJS.Timeout | null = null;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        hiddenTimeout = setTimeout(() => {
          if (document.hidden) {
            updatePresence(false, true);
          }
        }, 60000);
      } else {
        if (hiddenTimeout) {
          clearTimeout(hiddenTimeout);
          hiddenTimeout = null;
        }
        lastActivityRef.current = Date.now();
        updatePresence(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (hiddenTimeout) {
        clearTimeout(hiddenTimeout);
      }
    };
  }, [updatePresence, enabled, userId]);

  useEffect(() => {
    if (!enabled || !userId) return;

    const handleUnload = () => {
      const data = JSON.stringify({
        user_id: userId,
        is_online: false,
        last_seen: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/presence/offline", data);
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide", handleUnload);
    };
  }, [userId, enabled]);

  return null;
}
