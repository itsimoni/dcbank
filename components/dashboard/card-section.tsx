"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  CreditCard,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  Settings,
  Languages,
  ChevronDown,
  Check,
} from "lucide-react";
import { Language, getTranslations } from "../../lib/translations";
import { useLanguage } from "../../contexts/LanguageContext";

interface UserProfile {
  id: string;
  client_id: string;
  full_name: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

interface CardSectionProps {
  userProfile: UserProfile;
}

export default function CardSection({ userProfile }: CardSectionProps) {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCardForm, setShowCardForm] = useState(false);
  const [showCardDetails, setShowCardDetails] = useState<{
    [key: string]: boolean;
  }>({});
  const [showCardSettings, setShowCardSettings] = useState<{
    [key: string]: boolean;
  }>({});
  const [formData, setFormData] = useState({
    spending_limit: "5000",
    daily_limit: "1000",
    international_enabled: false,
  });
  const { language, setLanguage } = useLanguage();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const t = getTranslations(language);

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'es', label: 'Español' },
    { code: 'it', label: 'Italiano' },
  ];

  useEffect(() => {
    if (userProfile?.id) {
      fetchCards();
    }
  }, [userProfile?.id]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCards = async () => {
    if (!userProfile?.id) return;

    try {
      const { data, error } = await supabase
        .from("cards")
        .select("*")
        .eq("user_id", userProfile.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setCards(data || []);
    } catch (error) {
      console.error("Error fetching cards:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateCardNumber = () => {
    return (
      "4532" +
      Math.floor(Math.random() * 1000000000000)
        .toString()
        .padStart(12, "0")
    );
  };

  const generateCVV = () => {
    return Math.floor(Math.random() * 900 + 100).toString();
  };

  const generatePIN = () => {
    return Math.floor(Math.random() * 9000 + 1000).toString();
  };

  const generateAccountNumber = () => {
    return (
      "****" +
      Math.floor(Math.random() * 100000000)
        .toString()
        .padStart(8, "0")
    );
  };

  const createCard = async () => {
    if (!userProfile?.id) return;

    try {
      const cardData = {
        user_id: userProfile.id,
        card_number: generateCardNumber(),
        card_holder_name: userProfile.full_name?.toUpperCase() || "CARD HOLDER",
        expiry_month: 12,
        expiry_year: new Date().getFullYear() + 3,
        cvv: generateCVV(),
        pin: generatePIN(),
        account_number: generateAccountNumber(),
        card_type: "Virtual",
        card_design: "orange-gradient",
        spending_limit: Number.parseFloat(formData.spending_limit),
        daily_limit: Number.parseFloat(formData.daily_limit),
        international_enabled: formData.international_enabled,
        delivery_address: null,
        expected_delivery: null,
        status: "Pending",
        is_activated: false,
      };

      const { error } = await supabase.from("cards").insert(cardData);
      if (error) throw error;

      setFormData({
        spending_limit: "5000",
        daily_limit: "1000",
        international_enabled: false,
      });
      setShowCardForm(false);
      fetchCards();
      alert(t.newCardRequestSubmitted);
    } catch (error: any) {
      alert(t.errorMessage.replace('{{message}}', error.message));
    }
  };

  const toggleCardStatus = async (cardId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "Active" ? "Frozen" : "Active";
      const updateData: any = { status: newStatus };

      if (
        newStatus === "Active" &&
        !cards.find((c) => c.id === cardId)?.is_activated
      ) {
        updateData.is_activated = true;
        updateData.activated_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("cards")
        .update(updateData)
        .eq("id", cardId);

      if (error) throw error;

      fetchCards();
      alert(t.cardStatusSuccess.replace('{{status}}', newStatus.toLowerCase() === 'active' ? t.cardActive : t.frozen));
    } catch (error: any) {
      alert(t.errorMessage.replace('{{message}}', error.message));
    }
  };

  const toggleCardDetails = (cardId: string) => {
    setShowCardDetails((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  const toggleCardSettings = (cardId: string) => {
    setShowCardSettings((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  const getMaskedCardInfo = (card: any, field: string) => {
    if (card.status === "Pending") {
      switch (field) {
        case "cardNumber":
          return "**** **** **** ****";
        case "cvv":
          return "***";
        case "pin":
          return "****";
        case "expiryMonth":
          return "**";
        case "expiryYear":
          return "**";
        case "accountNumber":
          return "************";
        default:
          return "****";
      }
    }
    return null;
  };

  const formatCardNumber = (cardNumber: string, show: boolean, card: any) => {
    if (card.status === "Pending") {
      return "**** **** **** ****";
    }

    if (show) {
      return cardNumber.replace(/(.{4})/g, "$1 ").trim();
    }
    return "**** **** **** " + cardNumber.slice(-4);
  };

  const getCardColor = (cardDesign: string) => {
    switch (cardDesign?.toLowerCase()) {
      case "orange-gradient":
        return "from-[#F26623] to-[#E55A1F]";
      case "blue-gradient":
        return "from-blue-500 to-blue-700";
      case "red-gradient":
        return "from-red-500 to-orange-500";
      case "green-gradient":
        return "from-green-500 to-teal-600";
      case "purple-gradient":
        return "from-purple-500 to-purple-700";
      case "pink-gradient":
        return "from-pink-500 to-rose-500";
      case "black-gradient":
        return "from-gray-800 to-black";
      case "gold-gradient":
        return "from-yellow-400 to-yellow-600";
      default:
        return "from-[#F26623] to-[#E55A1F]";
    }
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">{t.loadingCards}</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 pt-4 pt-xs-16 space-y-6 max-w-4xl min-h-full">
        <div className="flex flex-row items-center justify-between gap-4">
          <h2 className="text-2xl font-bold">{t.myCards}</h2>
          <div className="flex items-center gap-2">
            <div ref={dropdownRef} className="relative inline-block flex-shrink-0">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 bg-white border-2 border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:border-[#F26623] focus:outline-none focus:ring-2 focus:ring-[#F26623] focus:border-transparent cursor-pointer transition-all shadow-sm hover:shadow-md"
              >
                <Languages className="w-4 h-4 text-gray-600" />
                <span className="hidden sm:inline">
                  {languages.find(lang => lang.code === language)?.label}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border-2 border-gray-200 rounded-lg shadow-lg overflow-hidden z-10">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors ${
                        language === lang.code
                          ? 'bg-orange-50 text-[#F26623] font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>{lang.label}</span>
                      {language === lang.code && (
                        <Check className="w-4 h-4 text-[#F26623]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button
              onClick={() => setShowCardForm(true)}
              className="bg-[#F26623] hover:bg-[#E55A1F]"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t.requestNewCard}
            </Button>
          </div>
        </div>

        {showCardForm && (
          <Card>
            <CardHeader>
              <CardTitle>{t.requestNewVirtualCard}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>{t.spendingLimit}</Label>
                  <Input
                    type="number"
                    step="100"
                    value={formData.spending_limit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        spending_limit: e.target.value,
                      })
                    }
                    placeholder="5000"
                  />
                </div>
                <div>
                  <Label>{t.dailyLimit}</Label>
                  <Input
                    type="number"
                    step="50"
                    value={formData.daily_limit}
                    onChange={(e) =>
                      setFormData({ ...formData, daily_limit: e.target.value })
                    }
                    placeholder="1000"
                  />
                </div>
                <div className="flex items-center space-x-2 md:col-span-2">
                  <input
                    type="checkbox"
                    id="international"
                    checked={formData.international_enabled}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        international_enabled: e.target.checked,
                      })
                    }
                    aria-label={t.enableInternationalUsage}
                    title={t.enableInternationalUsage}
                  />
                  <Label htmlFor="international">
                    {t.enableInternationalUsage}
                  </Label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={createCard}
                  className="bg-[#F26623] hover:bg-[#E55A1F]"
                >
                  {t.createCard}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCardForm(false)}
                >
                  {t.cancel}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6 pb-6">
          {cards.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">
                  {t.noCardsFound}
                </p>
              </CardContent>
            </Card>
          ) : (
            cards.map((card) => (
              <div key={card.id} className="space-y-4">
                <div className="flex">
                  <div
                    className={`w-full max-w-sm bg-gradient-to-r ${getCardColor(
                      card.card_design
                    )} rounded-xl p-6 text-white shadow-lg pointer-events-none relative`}
                  >
                    {card.status === "Pending" && (
                      <div className="absolute inset-0 bg-black bg-opacity-30 rounded-xl flex items-center justify-center">
                        <div className="text-center">
                          <Lock className="w-8 h-8 mx-auto mb-2 opacity-80" />
                          <p className="text-sm font-medium opacity-90">
                            {t.pendingApproval}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <p className="text-sm opacity-80">
                          {card.issuer || t.digitalChainBank}
                        </p>
                        <p className="text-xs opacity-60">
                          {card.card_type === "Virtual" ? t.virtualCard : card.card_type} • {card.network || t.visa}
                        </p>
                      </div>
                      <div className="w-8 h-8 bg-white rounded-full opacity-80"></div>
                    </div>

                    <div className="mb-6">
                      <p className="text-lg font-mono tracking-wider break-all">
                        {formatCardNumber(
                          card.card_number,
                          showCardDetails[card.id],
                          card
                        )}
                      </p>
                    </div>

                    <div className="flex justify-between items-end">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs opacity-60">{t.cardHolder}</p>
                        <p className="text-sm font-medium truncate">
                          {card.status === "Pending"
                            ? "******* ******"
                            : card.card_holder_name}
                        </p>
                      </div>
                      <div className="ml-4">
                        <p className="text-xs opacity-60">{t.expires}</p>
                        <p className="text-sm font-medium">
                          {card.status === "Pending"
                            ? "**/**"
                            : `${card.expiry_month
                                .toString()
                                .padStart(2, "0")}/${card.expiry_year
                                .toString()
                                .slice(-2)}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Card className="relative">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{card.card_type === "Virtual" ? t.virtualCard : card.card_type} {t.cardWord}</p>
                        <p className="text-sm text-gray-600 break-words">
                          {t.spending}: $
                          {Number(card.spending_limit).toLocaleString()} •
                          {t.daily}: ${Number(card.daily_limit).toLocaleString()}
                        </p>
                        <p
                          className={`text-sm font-medium ${
                            card.status === "Active"
                              ? "text-green-600"
                              : card.status === "Pending"
                              ? "text-yellow-600"
                              : card.status === "Approved"
                              ? "text-blue-600"
                              : "text-red-600"
                          }`}
                        >
                          {t.status}: {card.status === "Pending" ? t.pending : card.status === "Approved" ? t.approved : card.status === "Active" ? t.Active : t.Frozen}{" "}
                          {card.is_activated
                            ? `• ${t.activated}`
                            : `• ${t.notActivated}`}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => toggleCardDetails(card.id)}
                          disabled={card.status === "Pending"}
                          className={
                            card.status === "Pending"
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }
                        >
                          {showCardDetails[card.id] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => toggleCardSettings(card.id)}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => toggleCardStatus(card.id, card.status)}
                          disabled={card.status === "Pending"}
                          className={
                            card.status === "Pending"
                              ? "text-gray-400 cursor-not-allowed"
                              : card.status === "Active"
                              ? "text-red-600"
                              : "text-green-600"
                          }
                        >
                          {card.status === "Active" ? (
                            <Lock className="w-4 h-4" />
                          ) : card.status === "Pending" ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            <Unlock className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {showCardDetails[card.id] && card.status !== "Pending" && (
                      <div className="border-t pt-4 space-y-2">
                        <p className="text-sm break-all">
                          <span className="font-medium">{t.fullNumber}:</span>{" "}
                          {card.card_number}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">{t.cvv}:</span> {card.cvv}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">{t.pin}:</span> {card.pin}
                        </p>
                        <p className="text-sm break-all">
                          <span className="font-medium">{t.accountNumber}:</span>{" "}
                          {card.account_number}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">{t.routingNumber}:</span>{" "}
                          {card.routing_number}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">{t.created}:</span>{" "}
                          {new Date(card.created_at).toLocaleDateString()}
                        </p>
                        {card.activated_at && (
                          <p className="text-sm">
                            <span className="font-medium">{t.activated}:</span>{" "}
                            {new Date(card.activated_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}

                    {card.status === "Pending" && (
                      <div className="border-t pt-4">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <div className="flex items-center">
                            <Lock className="w-4 h-4 text-yellow-600 mr-2" />
                            <p className="text-sm text-yellow-800">
                              {t.cardDetailsAvailable}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {showCardSettings[card.id] && (
                      <div className="border-t pt-4 space-y-2">
                        <p className="text-sm font-medium mb-2">
                          {t.cardSettings}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">{t.international}:</span>{" "}
                          {card.international_enabled ? t.enabled : t.disabled}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">{t.contactless}:</span>{" "}
                          {card.contactless_enabled ? t.enabled : t.disabled}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">{t.onlinePayments}:</span>{" "}
                          {card.online_enabled ? t.enabled : t.disabled}
                        </p>
                        {card.delivery_address && (
                          <p className="text-sm break-words">
                            <span className="font-medium">
                              {t.deliveryAddress}:
                            </span>{" "}
                            {card.delivery_address}
                          </p>
                        )}
                        {card.expected_delivery && (
                          <p className="text-sm">
                            <span className="font-medium">
                              {t.expectedDelivery}:
                            </span>{" "}
                            {new Date(
                              card.expected_delivery
                            ).toLocaleDateString()}
                          </p>
                        )}
                        {card.last_used_at && (
                          <p className="text-sm">
                            <span className="font-medium">{t.lastUsed}:</span>{" "}
                            {new Date(card.last_used_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
