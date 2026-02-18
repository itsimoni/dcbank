"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
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
  const { language } = useLanguage();

  const t = useMemo(() => getTranslations(language), [language]);

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
        <div className="border-l-4 border-[#b91c1c] pl-4">
          <h2 className="text-2xl font-bold text-gray-900">{t.supportCenterTitle}</h2>
          <p className="text-gray-600 mt-1">{t.supportCenterSubtitle}</p>
        </div>

        {/* Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 shadow-sm text-center hover:shadow-md transition-shadow">
            <div className="p-6">
              <Phone className="w-8 h-8 mx-auto mb-3 text-[#b91c1c]" />
              <h3 className="font-semibold text-gray-900 mb-2">{t.phoneSupportTitle}</h3>
              <p className="text-sm text-gray-600 mb-3">{t.phoneSupportAvailability}</p>
              <p className="font-mono text-sm text-gray-900">+1 (555) 123-4567</p>
              <a href="tel:15551234567" aria-label="Call support">
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 border-[#b91c1c] text-[#b91c1c] hover:bg-[#b91c1c] hover:text-white transition-colors"
                >
                  {t.callNowButton}
                </Button>
              </a>
            </div>
          </div>

          <div className="bg-white border border-gray-200 shadow-sm text-center hover:shadow-md transition-shadow">
            <div className="p-6">
              <Mail className="w-8 h-8 mx-auto mb-3 text-[#b91c1c]" />
              <h3 className="font-semibold text-gray-900 mb-2">{t.emailSupportTitle}</h3>
              <p className="text-sm text-gray-600 mb-3">{t.emailSupportResponse}</p>
              <p className="text-sm text-gray-900">support@digitalchainbank.com</p>
              <a
                href="mailto:support@digitalchainbank.com"
                aria-label="Send an email"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 border-[#b91c1c] text-[#b91c1c] hover:bg-[#b91c1c] hover:text-white transition-colors"
                >
                  {t.sendEmailButton}
                </Button>
              </a>
            </div>
          </div>

          <div className="bg-white border border-gray-200 shadow-sm text-center hover:shadow-md transition-shadow">
            <div className="p-6">
              <MessageCircle className="w-8 h-8 mx-auto mb-3 text-[#b91c1c]" />
              <h3 className="font-semibold text-gray-900 mb-2">{t.liveChatTitle}</h3>
              <p className="text-sm text-gray-600 mb-3">{t.liveChatHours}</p>
              <Button
                size="sm"
                className="bg-[#b91c1c] hover:bg-[#991b1b] text-white mt-3 transition-colors"
                onClick={() => startLiveChat()}
              >
                {t.startChatButton}
              </Button>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white border border-gray-200 shadow-sm">
          <div className="border-b border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <HelpCircle className="w-5 h-5 mr-2 text-[#b91c1c]" />
              {t.faqTitle}
            </h3>
          </div>
          <div className="p-6 space-y-4">
            {faqItems.map((item, index) => (
              <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                <h4 className="font-semibold mb-2 text-gray-900">
                  {item.question}
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <LiveChatClient isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
