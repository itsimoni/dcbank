"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTranslations, Language } from "@/lib/translations";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Phone,
  Mail,
  MessageCircle,
  HelpCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Send,
  Languages,
  ChevronDown,
} from "lucide-react";
import LiveChatClient from "./live-chat-client";

interface UserProfile {
  id: string;
  client_id: string;
  full_name: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

interface SupportSectionProps {
  userProfile: UserProfile;
}

export default function SupportSection({ userProfile }: SupportSectionProps) {
  const [ticketForm, setTicketForm] = useState({
    subject: "",
    category: "",
    priority: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [chatOpen, setChatOpen] = useState(false);
  const { language, setLanguage } = useLanguage();
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

  const t = useMemo(() => getTranslations(language), [language]);

  const languageNames: Record<Language, string> = {
    en: "English",
    fr: "Français",
    de: "Deutsch",
    es: "Español",
    it: "Italiano",
    el: "Ελληνικά",
  };

  useEffect(() => {
    const savedSession = localStorage.getItem("chat_session");
    if (savedSession) {
      setChatOpen(true);
    }
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!ticketForm.subject.trim()) {
      newErrors.subject = "Subject is required";
    }
    if (!ticketForm.category) {
      newErrors.category = "Please select a category";
    }
    if (!ticketForm.priority) {
      newErrors.priority = "Please select a priority";
    }
    if (!ticketForm.description.trim()) {
      newErrors.description = "Description is required";
    } else if (ticketForm.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submitTicket = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setTicketForm({
        subject: "",
        category: "",
        priority: "",
        description: "",
      });
      setErrors({});
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqItems = [
    {
      question: t.faqQuestion1,
      answer: t.faqAnswer1,
    },
    {
      question: t.faqQuestion2,
      answer: t.faqAnswer2,
    },
    {
      question: t.faqQuestion3,
      answer: t.faqAnswer3,
    },
    {
      question: t.faqQuestion4,
      answer: t.faqAnswer4,
    },
  ];

  const systemStatus = [
    { service: t.bankingServicesStatus, status: "operational" },
    { service: t.cardPaymentsStatus, status: "operational" },
    { service: t.cryptoTradingStatus, status: "maintenance" },
    { service: t.mobileAppStatus, status: "operational" },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational":
        return <CheckCircle className="w-4 h-4 mr-1 text-green-600" />;
      case "maintenance":
        return <Clock className="w-4 h-4 mr-1 text-yellow-600" />;
      case "down":
        return <AlertCircle className="w-4 h-4 mr-1 text-red-600" />;
      default:
        return <CheckCircle className="w-4 h-4 mr-1 text-green-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "text-green-600";
      case "maintenance":
        return "text-yellow-600";
      case "down":
        return "text-red-600";
      default:
        return "text-green-600";
    }
  };

  const startLiveChat = () => {
    setChatOpen(true);
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-hide">
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="p-6 pt-4 pt-xs-16 space-y-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">{t.supportCenterTitle}</h2>
            <p className="text-gray-600 mt-1">{t.supportCenterSubtitle}</p>
          </div>
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
        </div>

        {/* Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="text-center hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <Phone className="w-8 h-8 mx-auto mb-3 text-[#F26623]" />
              <h3 className="font-medium mb-2">{t.phoneSupportTitle}</h3>
              <p className="text-sm text-gray-600 mb-3">{t.phoneSupportAvailability}</p>
              <p className="font-mono text-sm">+1 (555) 123-4567</p>
              <a href="tel:15551234567" aria-label="Call support">
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 bg-transparent cursor-pointer"
                >
                  {t.callNowButton}
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <Mail className="w-8 h-8 mx-auto mb-3 text-[#F26623]" />
              <h3 className="font-medium mb-2">{t.emailSupportTitle}</h3>
              <p className="text-sm text-gray-600 mb-3">{t.emailSupportResponse}</p>
              <p className="text-sm">support@digitalchainbank.com</p>
              <a
                href="mailto:support@digitalchainbank.com"
                aria-label="Send an email"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 bg-transparent cursor-pointer"
                >
                  {t.sendEmailButton}
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <MessageCircle className="w-8 h-8 mx-auto mb-3 text-[#F26623]" />
              <h3 className="font-medium mb-2">{t.liveChatTitle}</h3>
              <p className="text-sm text-gray-600 mb-3">{t.liveChatHours}</p>
              <Button
                size="sm"
                className="bg-[#F26623] hover:bg-[#E55A1F] mt-3"
                onClick={() => startLiveChat()}
              >
                {t.startChatButton}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HelpCircle className="w-5 h-5 mr-2" />
              {t.faqTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {faqItems.map((item, index) => (
              <div key={index} className="border-b pb-4 last:border-b-0">
                <h4 className="font-medium mb-2 text-gray-900">
                  {item.question}
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {item.answer}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <LiveChatClient isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
