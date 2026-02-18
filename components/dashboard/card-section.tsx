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
  Shield,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Language, getTranslations } from "../../lib/translations";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { toast } from "sonner";

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
  const [revealedFields, setRevealedFields] = useState<{
    [key: string]: { pin: boolean; cvv: boolean };
  }>({});
  const [showCardSettings, setShowCardSettings] = useState<{
    [key: string]: boolean;
  }>({});
  const [confirmRevealCard, setConfirmRevealCard] = useState<string | null>(
    null
  );
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
    { code: "en", label: "English" },
    { code: "fr", label: "Français" },
    { code: "de", label: "Deutsch" },
    { code: "es", label: "Español" },
    { code: "it", label: "Italiano" },
    { code: "el", label: "Ελληνικά" },
  ];

  useEffect(() => {
    if (userProfile?.id) {
      fetchCards();
    }
  }, [userProfile?.id]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
        card_design: "white",
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
      toast.success("Card Request Submitted", {
        description: "Your card is pending approval. You'll be notified once it's ready.",
        duration: 5000,
      });
    } catch (error: any) {
      toast.error("Failed to Create Card", {
        description: error.message,
        duration: 5000,
      });
    }
  };

  const activateCard = async (cardId: string) => {
    try {
      const { error } = await supabase
        .from("cards")
        .update({
          status: "Active",
          is_activated: true,
          activated_at: new Date().toISOString(),
        })
        .eq("id", cardId);

      if (error) throw error;

      fetchCards();
      toast.success("Card Activated", {
        description: "Your card is now active and ready for payments.",
        duration: 5000,
      });
    } catch (error: any) {
      toast.error("Failed to Activate Card", {
        description: error.message,
        duration: 5000,
      });
    }
  };

  const toggleCardStatus = async (cardId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "Active" ? "Frozen" : "Active";
      const updateData: any = { status: newStatus };

      const { error } = await supabase
        .from("cards")
        .update(updateData)
        .eq("id", cardId);

      if (error) throw error;

      fetchCards();
      if (newStatus === "Active") {
        toast.success("Card Unlocked", {
          description: "Your card has been reactivated and is ready to use.",
          duration: 5000,
        });
      } else {
        toast.success("Card Frozen", {
          description: "Your card has been temporarily blocked for security.",
          duration: 5000,
        });
      }
    } catch (error: any) {
      toast.error("Failed to Update Card Status", {
        description: error.message,
        duration: 5000,
      });
    }
  };

  const handleRevealCardClick = (cardId: string) => {
    setConfirmRevealCard(cardId);
  };

  const confirmReveal = () => {
    if (confirmRevealCard) {
      setShowCardDetails((prev) => ({
        ...prev,
        [confirmRevealCard]: !prev[confirmRevealCard],
      }));
      setConfirmRevealCard(null);
    }
  };

  const toggleFieldVisibility = (cardId: string, field: "pin" | "cvv") => {
    setRevealedFields((prev) => ({
      ...prev,
      [cardId]: {
        ...(prev[cardId] || { pin: false, cvv: false }),
        [field]: !prev[cardId]?.[field],
      },
    }));
  };

  const toggleCardSettings = (cardId: string) => {
    setShowCardSettings((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
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

  const getCardCounts = () => {
    return {
      active: cards.filter((c) => c.status === "Active").length,
      pending: cards.filter((c) => c.status === "Pending").length,
      frozen: cards.filter((c) => c.status === "Frozen").length,
      approved: cards.filter((c) => c.status === "Approved").length,
    };
  };

  const calculateLimitProgress = (used: number, limit: number) => {
    const percentage = (used / limit) * 100;
    return Math.min(percentage, 100);
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">{t.loadingCards}</div>
      </div>
    );
  }

  const cardCounts = getCardCounts();

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 pt-4 pt-xs-16 space-y-6 max-w-4xl min-h-full">
        <div className="flex flex-row items-center justify-between gap-4">
          <h2 className="text-2xl font-bold">{t.myCards}</h2>
          <div className="flex items-center gap-2">
            <div
              ref={dropdownRef}
              className="relative inline-block flex-shrink-0"
            >
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 bg-white border-2 border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:border-[#b91c1c] focus:outline-none focus:ring-2 focus:ring-[#b91c1c] focus:border-transparent cursor-pointer transition-all shadow-sm hover:shadow-md"
              >
                <Languages className="w-4 h-4 text-gray-600" />
                <span className="hidden sm:inline">
                  {languages.find((lang) => lang.code === language)?.label}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-600 transition-transform ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border-2 border-gray-200 shadow-lg overflow-hidden z-10">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors ${
                        language === lang.code
                          ? "bg-red-50 text-[#b91c1c] font-medium"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span>{lang.label}</span>
                      {language === lang.code && (
                        <Check className="w-4 h-4 text-[#b91c1c]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button
              onClick={() => setShowCardForm(true)}
              className="bg-[#b91c1c] hover:bg-[#991b1b]"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t.requestNewCard}
            </Button>
          </div>
        </div>

        {cards.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="bg-white border-l-4 border-l-green-600 border-y-0 border-r-0 rounded-none">
              <CardContent className="p-4">
                <p className="text-sm text-gray-600">Active Cards</p>
                <p className="text-2xl font-bold text-green-600">
                  {cardCounts.active}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white border-l-4 border-l-yellow-600 border-y-0 border-r-0 rounded-none">
              <CardContent className="p-4">
                <p className="text-sm text-gray-600">Pending Requests</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {cardCounts.pending}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white border-l-4 border-l-blue-600 border-y-0 border-r-0 rounded-none">
              <CardContent className="p-4">
                <p className="text-sm text-gray-600">Approved Cards</p>
                <p className="text-2xl font-bold text-blue-600">
                  {cardCounts.approved}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white border-l-4 border-l-red-600 border-y-0 border-r-0 rounded-none">
              <CardContent className="p-4">
                <p className="text-sm text-gray-600">Frozen Cards</p>
                <p className="text-2xl font-bold text-red-600">
                  {cardCounts.frozen}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {showCardForm && (
          <Card className="bg-white border-l-4 border-l-[#b91c1c] border-y-0 border-r-0 rounded-none">
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
                  className="bg-[#b91c1c] hover:bg-[#991b1b]"
                >
                  {t.createCard}
                </Button>
                <Button variant="outline" onClick={() => setShowCardForm(false)}>
                  {t.cancel}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6 pb-6">
          {cards.length === 0 ? (
            <Card className="bg-white border-l-4 border-l-gray-300 border-y-0 border-r-0 rounded-none">
              <CardContent className="p-6 text-center">
                <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">{t.noCardsFound}</p>
              </CardContent>
            </Card>
          ) : (
            cards.map((card) => (
              <div key={card.id} className="space-y-4">
                <div className="flex">
                  <div className="w-full max-w-sm bg-white border-l-8 border-l-[#b91c1c] p-6 shadow-lg pointer-events-none relative">
                    {card.status === "Pending" && (
                      <div className="absolute inset-0 bg-gray-100 bg-opacity-90 flex items-center justify-center">
                        <div className="text-center">
                          <Clock className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                          <p className="text-sm font-medium text-gray-800">
                            Request Submitted
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            Awaiting Bank Review
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          Virtual Visa Debit
                        </p>
                        <p className="text-xs text-gray-600">
                          Issued by Malta Global Crypto Bank
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 font-medium">
                          SECURED
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 font-medium">
                          3D Secure
                        </span>
                      </div>
                    </div>

                    <div className="mb-6">
                      <p className="text-lg font-mono tracking-wider break-all text-gray-900">
                        {formatCardNumber(
                          card.card_number,
                          showCardDetails[card.id],
                          card
                        )}
                      </p>
                    </div>

                    <div className="flex justify-between items-end">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-600">{t.cardHolder}</p>
                        <p className="text-sm font-medium truncate text-gray-900">
                          {card.status === "Pending"
                            ? "******* ******"
                            : card.card_holder_name}
                        </p>
                      </div>
                      <div className="ml-4">
                        <p className="text-xs text-gray-600">{t.expires}</p>
                        <p className="text-sm font-medium text-gray-900">
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

                <Card className="relative bg-white border-l-4 border-l-[#b91c1c] border-y-0 border-r-0 rounded-none">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">
                          {card.card_type === "Virtual"
                            ? t.virtualCard
                            : card.card_type}{" "}
                          {t.cardWord}
                        </p>
                        <div className="space-y-2 mt-2">
                          <div>
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Daily Limit</span>
                              <span>
                                $
                                {(
                                  card.daily_used || 0
                                ).toLocaleString()} / $
                                {Number(card.daily_limit).toLocaleString()}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 h-2">
                              <div
                                className="bg-[#b91c1c] h-2 transition-all"
                                style={{
                                  width: `${calculateLimitProgress(
                                    card.daily_used || 0,
                                    card.daily_limit
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Spending Limit</span>
                              <span>
                                $
                                {(
                                  card.total_spent || 0
                                ).toLocaleString()} / $
                                {Number(card.spending_limit).toLocaleString()}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 h-2">
                              <div
                                className="bg-[#b91c1c] h-2 transition-all"
                                style={{
                                  width: `${calculateLimitProgress(
                                    card.total_spent || 0,
                                    card.spending_limit
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        {card.status === "Active" && (
                          <p className="text-sm font-medium text-green-600 mt-2 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Active • Ready for payments
                          </p>
                        )}
                        {card.status === "Approved" && (
                          <p className="text-sm font-medium text-blue-600 mt-2 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            Approved • Activate to use
                          </p>
                        )}
                        {card.status === "Pending" && (
                          <p className="text-sm font-medium text-yellow-600 mt-2 flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Waiting for approval
                          </p>
                        )}
                        {card.status === "Frozen" && (
                          <p className="text-sm font-medium text-red-600 mt-2 flex items-center gap-1">
                            <Lock className="w-4 h-4" />
                            Card temporarily blocked
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {card.status === "Approved" && (
                          <Button
                            onClick={() => activateCard(card.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Activate Card
                          </Button>
                        )}
                        {card.status === "Active" && (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleRevealCardClick(card.id)}
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
                              onClick={() =>
                                toggleCardStatus(card.id, card.status)
                              }
                              className="text-red-600 hover:text-red-700"
                            >
                              <Lock className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {card.status === "Frozen" && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => toggleCardStatus(card.id, card.status)}
                            className="text-green-600 hover:text-green-700 border-green-600 hover:border-green-700"
                          >
                            <Unlock className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {card.status === "Pending" && (
                      <div className="border-l-4 border-l-yellow-600 bg-yellow-50 p-3 mt-4">
                        <div className="flex items-start">
                          <Clock className="w-4 h-4 text-yellow-700 mr-2 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-yellow-900">
                              Waiting for approval from bank
                            </p>
                            <p className="text-xs text-yellow-700 mt-1">
                              Your card details will be available once approved
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {card.status === "Approved" && (
                      <div className="border-l-4 border-l-blue-600 bg-blue-50 p-3 mt-4">
                        <div className="flex items-start">
                          <CheckCircle className="w-4 h-4 text-blue-700 mr-2 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-blue-900">
                              Approved — Activate your card
                            </p>
                            <p className="text-xs text-blue-700 mt-1">
                              Click the Activate Card button to start using it
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {card.status === "Frozen" && (
                      <div className="border-l-4 border-l-red-600 bg-red-50 p-3 mt-4">
                        <div className="flex items-start">
                          <AlertCircle className="w-4 h-4 text-red-700 mr-2 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-red-900">
                              Card temporarily blocked
                            </p>
                            <p className="text-xs text-red-700 mt-1">
                              Click unlock to reactivate this card
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="border-t pt-4 mt-4">
                      <p className="text-sm font-medium mb-2 text-gray-700">
                        Card Timeline
                      </p>
                      <div className="space-y-1 text-sm text-gray-600">
                        {card.created_at && (
                          <p>
                            <span className="font-medium">Requested:</span>{" "}
                            {new Date(card.created_at).toLocaleDateString(
                              "en-GB",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </p>
                        )}
                        {card.approved_at ? (
                          <p>
                            <span className="font-medium">Approved:</span>{" "}
                            {new Date(card.approved_at).toLocaleDateString(
                              "en-GB",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </p>
                        ) : (
                          card.status !== "Pending" && (
                            <p>
                              <span className="font-medium">Approved:</span> —
                            </p>
                          )
                        )}
                        {card.activated_at ? (
                          <p>
                            <span className="font-medium">Activated:</span>{" "}
                            {new Date(card.activated_at).toLocaleDateString(
                              "en-GB",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </p>
                        ) : (
                          ["Active", "Frozen", "Approved"].includes(
                            card.status
                          ) && (
                            <p>
                              <span className="font-medium">Activated:</span> —
                            </p>
                          )
                        )}
                      </div>
                    </div>

                    {showCardDetails[card.id] && card.status === "Active" && (
                      <div className="border-t pt-4 mt-4 space-y-3">
                        <p className="text-sm font-medium text-gray-700 mb-3">
                          Card Details
                        </p>
                        <p className="text-sm break-all">
                          <span className="font-medium">{t.fullNumber}:</span>{" "}
                          {card.card_number}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">CVV:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {revealedFields[card.id]?.cvv
                                ? card.cvv
                                : "•••"}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                toggleFieldVisibility(card.id, "cvv")
                              }
                              className="h-6 px-2 text-xs"
                            >
                              {revealedFields[card.id]?.cvv ? "Hide" : "Reveal"}
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">PIN:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {revealedFields[card.id]?.pin
                                ? card.pin
                                : "••••"}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                toggleFieldVisibility(card.id, "pin")
                              }
                              className="h-6 px-2 text-xs"
                            >
                              {revealedFields[card.id]?.pin ? "Hide" : "Reveal"}
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm break-all">
                          <span className="font-medium">{t.accountNumber}:</span>{" "}
                          {card.account_number}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">{t.routingNumber}:</span>{" "}
                          {card.routing_number || "—"}
                        </p>
                      </div>
                    )}

                    {showCardSettings[card.id] && (
                      <div className="border-t pt-4 mt-4 space-y-2">
                        <p className="text-sm font-medium mb-2 text-gray-700">
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

      <AlertDialog
        open={confirmRevealCard !== null}
        onOpenChange={() => setConfirmRevealCard(null)}
      >
        <AlertDialogContent className="bg-white border-l-4 border-l-[#b91c1c] border-y-0 border-r-0 rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#b91c1c]" />
              Security Confirmation
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reveal your card details? Make sure no one
              is watching your screen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReveal}
              className="bg-[#b91c1c] hover:bg-[#991b1b]"
            >
              Yes, Reveal Details
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
