"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTranslations, Language } from "@/lib/translations";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Mail,
  AlertTriangle,
  Info,
  CheckCircle,
  RefreshCw,
  Trash2,
  Languages,
  ChevronDown,
} from "lucide-react";

interface UserProfile {
  id: string;
  client_id: string;
  full_name: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

interface MessageSectionProps {
  userProfile: UserProfile;
}

export default function MessageSection({ userProfile }: MessageSectionProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { language, setLanguage } = useLanguage();
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

  const t = useMemo(() => getTranslations(language), [language]);

  const languageNames: Record<Language, string> = {
    en: "English",
    fr: "Français",
    de: "Deutsch",
    es: "Español",
    it: "Italiano",
  };

  useEffect(() => {
    if (userProfile?.id) {
      fetchMessages();
    }
  }, [userProfile?.id]);

  const fetchMessages = async () => {
    if (!userProfile?.id) return;

    try {
      const { data, error } = await supabase
        .from("user_messages")
        .select("*")
        .eq("user_id", userProfile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages(data || []);
      console.log("Fetched messages from database:", data);
    } catch (error) {
      console.error("Error fetching messages:", error);
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

      if (error) throw error;

      fetchMessages();
      console.log("Message marked as read:", messageId);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("user_messages")
        .delete()
        .eq("id", messageId);

      if (error) throw error;

      fetchMessages();
      console.log("Message deleted:", messageId);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case "alert":
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case "info":
        return <Info className="w-5 h-5 text-blue-500" />;
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Mail className="w-5 h-5 text-gray-500" />;
    }
  };

  const getMessageBorderColor = (type: string) => {
    switch (type) {
      case "alert":
        return "border-l-red-500";
      case "info":
        return "border-l-blue-500";
      case "success":
        return "border-l-green-500";
      case "warning":
        return "border-l-yellow-500";
      default:
        return "border-l-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F26623]"></div>
          <span className="ml-2">{t.loadingMessagesText}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-auto">
      <div className="p-6 pt-4 pt-xs-16 space-y-6 max-w-4xl">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">{t.messagesTitle}</h2>
            <p className="text-sm text-gray-600">
              {t.welcomeUser} {userProfile.full_name}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:border-[#F26623] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#F26623] focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <Languages className="h-4 w-4 text-[#F26623]" />
                <span>{languageNames[language]}</span>
                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLanguageDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsLanguageDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
                    {Object.entries(languageNames).map(([code, name]) => (
                      <button
                        key={code}
                        onClick={() => {
                          setLanguage(code as Language);
                          setIsLanguageDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors duration-150 ${
                          language === code
                            ? 'bg-[#F26623] text-white font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{name}</span>
                          {language === code && (
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <span className="text-sm text-gray-600">
              {messages.filter((m) => !m.is_read).length} {t.unreadCount}
            </span>
            <Button variant="outline" size="sm" onClick={fetchMessages}>
              <RefreshCw className="w-4 h-4 mr-2" />
              {t.refreshButton}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {messages.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Mail className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">{t.noMessagesText}</p>
              </CardContent>
            </Card>
          ) : (
            messages.map((message) => (
              <Card
                key={message.id}
                className={`border-l-4 ${getMessageBorderColor(
                  message.message_type
                )}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getMessageIcon(message.message_type)}
                      <div>
                        <CardTitle className="text-lg">
                          {message.title}
                        </CardTitle>
                        <p className="text-sm text-gray-500">
                          {new Date(message.created_at).toLocaleDateString()} {t.atTimeText}{" "}
                          {new Date(message.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!message.is_read && (
                        <div className="w-2 h-2 bg-[#F26623] rounded-full"></div>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMessage(message.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <p className="text-gray-700">{message.content}</p>

                  <div className="flex gap-2 pt-2">
                    {!message.is_read && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAsRead(message.id)}
                      >
                        {t.markAsReadButton}
                      </Button>
                    )}
                    {message.message_type === "alert" && (
                      <Button
                        size="sm"
                        className="bg-[#F26623] hover:bg-[#E55A1F]"
                      >
                        {t.takeActionButton}
                      </Button>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 border-t pt-2">
                    <p>{t.messageIdLabel} {message.id}</p>
                    <p>{t.messageTypeLabel} {message.message_type}</p>
                    <p>{t.messageStatusLabel} {message.is_read ? t.readStatus : t.unreadStatusLabel}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t.quickActionsTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start bg-transparent"
            >
              <Mail className="w-4 h-4 mr-2" />
              {t.contactSupportButton}
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start bg-transparent"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              {t.reportIssueButton}
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start bg-transparent"
            >
              <Info className="w-4 h-4 mr-2" />
              {t.accountInfoButton}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
