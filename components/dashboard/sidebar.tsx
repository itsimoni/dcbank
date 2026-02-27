import type React from "react";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Download,
  CreditCard,
  MessageSquare,
  HelpCircle,
  Menu,
  X,
  Banknote,
  Globe,
  ChevronDown,
  Wallet,
} from "lucide-react";
import { Language, getTranslations } from "@/lib/translations";
import { useLanguage } from "@/contexts/LanguageContext";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userProfile: any;
}

interface MenuItem {
  id: string;
  labelKey: keyof ReturnType<typeof getTranslations>;
  icon: React.ComponentType<any>;
  isEnabled: boolean;
  badge?: string | number;
}

const languageNames: Record<Language, string> = {
  en: "English",
  fr: "Français",
  de: "Deutsch",
  es: "Español",
  it: "Italiano",
  el: "Ελληνικά",
};

const MENU_ITEMS: MenuItem[] = [
  {
    id: "dashboard",
    labelKey: "dashboard",
    icon: LayoutDashboard,
    isEnabled: true,
  },
  {
    id: "fund",
    labelKey: "fundAccount",
    icon: Wallet,
    isEnabled: true,
  },
  {
    id: "transfers",
    labelKey: "transfers",
    icon: ArrowLeftRight,
    isEnabled: true,
  },
  {
    id: "deposit",
    labelKey: "transactions",
    icon: Download,
    isEnabled: true,
  },
  {
    id: "payments",
    labelKey: "taxes",
    icon: CreditCard,
    isEnabled: true,
  },
  {
    id: "loans",
    labelKey: "loans",
    icon: Banknote,
    isEnabled: true,
  },
  {
    id: "card",
    labelKey: "card",
    icon: CreditCard,
    isEnabled: true,
  },
  {
    id: "message",
    labelKey: "message",
    icon: MessageSquare,
    isEnabled: true,
  },
  {
    id: "support",
    labelKey: "support",
    icon: HelpCircle,
    isEnabled: true,
  },
];

export default function Sidebar({
  activeTab,
  setActiveTab,
  userProfile,
}: SidebarProps) {
  const { language, setLanguage } = useLanguage();
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const [menuItems] = useState<MenuItem[]>(MENU_ITEMS);
  const languageMenuRef = useRef<HTMLDivElement>(null);

  const t = getTranslations(language);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setShowLanguageMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMenuItemClick = useCallback(
    (itemId: string, isEnabled: boolean) => {
      if (!isEnabled) return;
      setActiveTab(itemId);
      setIsMobileMenuOpen(false);
    },
    [setActiveTab]
  );


  return (
    <>
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 lg:px-6">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <img
                src="/logoblack.svg"
                alt="Digital Chain Bank Logo"
                width={160}
                height={84}
                fetchPriority="high"
                className="w-[160px] h-[84px] object-contain"
              />
            </div>

            <nav className="hidden lg:flex items-center gap-1">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMenuItemClick(item.id, item.isEnabled)}
                    disabled={!item.isEnabled}
                    className={`relative flex flex-col items-center px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? "font-bold text-black"
                        : item.isEnabled
                        ? "font-medium text-gray-700 hover:text-black"
                        : "font-medium text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <IconComponent className="w-4 h-4" />
                      <span className="hidden xl:inline">{t[item.labelKey]}</span>
                      {item.badge && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] h-4 flex items-center justify-center">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    {isActive && (
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                        <svg
                          width="12"
                          height="8"
                          viewBox="0 0 12 8"
                          fill="none"
                          className="text-[#b91c1c]"
                        >
                          <path
                            d="M6 8L0 0H12L6 8Z"
                            fill="currentColor"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <div className="relative" ref={languageMenuRef}>
                <button
                  type="button"
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:border-[#b91c1c] hover:bg-gray-50 transition-all shadow-sm"
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                >
                  <Globe className="h-4 w-4 text-[#b91c1c]" />
                  <span>{languageNames[language]}</span>
                  <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showLanguageMenu ? 'rotate-180' : ''}`} />
                </button>
                {showLanguageMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowLanguageMenu(false)}
                    />
                    <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[160px] overflow-hidden">
                      {(Object.keys(languageNames) as Language[]).map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                            language === lang
                              ? "bg-[#b91c1c] text-white font-medium"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                          onClick={() => {
                            setLanguage(lang);
                            setShowLanguageMenu(false);
                          }}
                        >
                          {languageNames[lang]}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-gray-600"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-3 space-y-1">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMenuItemClick(item.id, item.isEnabled)}
                    disabled={!item.isEnabled}
                    className={`w-full flex items-center gap-3 px-3 py-3 text-sm transition-colors ${
                      isActive
                        ? "font-bold text-black"
                        : item.isEnabled
                        ? "font-medium text-gray-700 hover:text-black"
                        : "font-medium text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {isActive && (
                      <svg
                        width="8"
                        height="12"
                        viewBox="0 0 8 12"
                        fill="none"
                        className="text-[#b91c1c] -ml-1"
                      >
                        <path
                          d="M8 6L0 12V0L8 6Z"
                          fill="currentColor"
                        />
                      </svg>
                    )}
                    <IconComponent className="w-5 h-5" />
                    <span>{t[item.labelKey]}</span>
                    {item.badge && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}

            </div>
          </div>
        )}
      </header>
    </>
  );
}
