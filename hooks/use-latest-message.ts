"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface LatestMessage {
  id: string;
  title: string;
  content: string;
  message_type: string;
  is_read: boolean;
  created_at: string;
  user_id: string;
}

export function useLatestMessage() {
  const { user, loading: authLoading } = useAuth();
  const initRef = useRef(false);
  const userIdRef = useRef<string | null>(null);

  const [latestMessage, setLatestMessage] = useState<LatestMessage | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLatestMessage = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_messages")
        .select("*")
        .eq("user_id", userId)
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        if (error.message?.includes("aborted") || error.name === "AbortError") {
          return;
        }
        console.error("Error fetching latest message:", error.message || error);
        setError(error.message || "Failed to fetch message");
      } else {
        setLatestMessage(data || null);
      }
    } catch (err: any) {
      if (err.message?.includes("aborted") || err.name === "AbortError") {
        return;
      }
      console.error("Error in fetchLatestMessage:", err.message || err);
      setError(err.message || "Failed to fetch message");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("user_messages")
        .update({ is_read: true })
        .eq("id", messageId);

      if (error) {
        console.error("Error marking message as read:", error.message || error);
        throw error;
      }

      setLatestMessage(null);
    } catch (err: any) {
      console.error("Error in markAsRead:", err.message || err);
      throw err;
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    if (initRef.current) return;
    initRef.current = true;
    userIdRef.current = user.id;

    fetchLatestMessage(user.id);

    const subscription = supabase
      .channel("latest_message_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_messages",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          if (userIdRef.current) {
            fetchLatestMessage(userIdRef.current);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, authLoading]);

  const refetch = () => {
    if (userIdRef.current) {
      fetchLatestMessage(userIdRef.current);
    }
  };

  return {
    latestMessage,
    loading,
    error,
    markAsRead,
    refetch,
  };
}
