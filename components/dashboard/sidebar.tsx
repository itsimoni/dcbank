import type React from "react";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Download,
  CreditCard,
  MessageSquare,
  HelpCircle,
  LogOut,
  Menu,
  X,
  Banknote,
  Globe,
  User,
  ChevronDown,
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
    id: "accounts",
    labelKey: "accounts",
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
    id: "profile",
    labelKey: "profile",
    icon: User,
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
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const [menuItems] = useState<MenuItem[]>(MENU_ITEMS);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isComponentMountedRef = useRef<boolean>(true);

  const t = getTranslations(language);

  useEffect(() => {
    return () => {
      isComponentMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setShowLanguageMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
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

  const handleSignOut = async () => {
    setIsLoggingOut(true);

    try {
      isComponentMountedRef.current = false;

      let user;
      try {
        const userResult = await Promise.race([
          supabase.auth.getUser(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("User fetch timeout")), 2000)
          ),
        ]);
        user = userResult.data?.user;
      } catch (error) {
        console.warn("Could not fetch user for logout:", error);
      }

      if (user) {
        const updatePresence = async () => {
          try {
            await Promise.race([
              supabase.from("user_presence").upsert(
                {
                  user_id: user.id,
                  is_online: false,
                  last_seen: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                { onConflict: "user_id" }
              ),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("Presence timeout")), 1000)
              ),
            ]);
          } catch {
          }
        };
        updatePresence();
      }

      const logoutStrategies = [
        () =>
          Promise.race([
            supabase.auth.signOut(),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("Normal logout timeout")), 3000)
            ),
          ]),
        () => supabase.auth.signOut({ scope: "local" }),
        () => Promise.resolve({ error: null }),
      ];

      let logoutSuccess = false;
      for (const strategy of logoutStrategies) {
        try {
          const result = await strategy();
          if (!result.error) {
            logoutSuccess = true;
            break;
          }
        } catch (error) {
          console.warn("Logout strategy failed:", error);
          continue;
        }
      }

      if (logoutSuccess) {
        console.log("Successfully signed out");
      } else {
        console.warn("All logout strategies failed, but continuing...");
      }
    } catch (error) {
      console.error("Critical error during logout:", error);
    } finally {
      setIsLoggingOut(false);
      try {
        window.location.href = "/";
      } catch {
        window.location.reload();
      }
    }
  };

  const displayName = userProfile?.full_name
    ? userProfile.full_name
        .toLowerCase()
        .split(" ")
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : t.clientName;

  return (
    <>
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 lg:px-6">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <img
                src="/logoblack2.png"
                alt="Digital Chain Bank Logo"
                width={140}
                height={84}
                fetchPriority="high"
                className="w-[160px] h-[84px] object-contain"
              />
            </div>

            <nav className="hidden lg:flex items-center gap-1">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMenuItemClick(item.id, item.isEnabled)}
                    disabled={!item.isEnabled}
                    className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                      activeTab === item.id
                        ? "font-bold text-black"
                        : item.isEnabled
                        ? "font-medium text-gray-700 hover:text-black"
                        : "font-medium text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span className="hidden xl:inline">{t[item.labelKey]}</span>
                    {item.badge && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] h-4 flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <div className="relative" ref={languageMenuRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-600 hover:text-[#b91c1c] hover:bg-gray-100"
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                >
                  <Globe className="h-5 w-5" />
                </Button>
                {showLanguageMenu && (
                  <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[140px]">
                    {(Object.keys(languageNames) as Language[]).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        className={`w-full text-left px-4 py-2 hover:bg-gray-100 text-sm transition-colors ${
                          language === lang ? "bg-gray-50 text-[#b91c1c]" : ""
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
                )}
              </div>

              <div className="relative hidden sm:block" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#b91c1c] text-white hover:bg-[#991b1b] transition-colors"
                >
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm font-medium max-w-[120px] truncate">
                    {displayName}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showUserMenu && (
                  <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[160px]">
                    <button
                      onClick={() => {
                        handleMenuItemClick("profile", true);
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm transition-colors flex items-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      {t.profile}
                    </button>
                    <div className="border-t border-gray-200"></div>
                    <button
                      onClick={handleSignOut}
                      disabled={isLoggingOut}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm transition-colors flex items-center gap-2 text-red-600"
                    >
                      {isLoggingOut ? (
                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <LogOut className="w-4 h-4" />
                      )}
                      {isLoggingOut ? t.loggingOut : t.signOut}
                    </button>
                  </div>
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
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMenuItemClick(item.id, item.isEnabled)}
                    disabled={!item.isEnabled}
                    className={`w-full flex items-center gap-3 px-3 py-3 text-sm transition-colors ${
                      activeTab === item.id
                        ? "font-bold text-black"
                        : item.isEnabled
                        ? "font-medium text-gray-700 hover:text-black"
                        : "font-medium text-gray-400 cursor-not-allowed"
                    }`}
                  >
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

              <div className="pt-3 mt-3 border-t border-gray-200">
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900">
                      {displayName}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    disabled={isLoggingOut}
                    className="text-red-600 hover:bg-red-50"
                  >
                    {isLoggingOut ? (
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <LogOut className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
