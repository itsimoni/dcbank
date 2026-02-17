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
  Bitcoin,
  LogOut,
  Menu,
  X,
  Banknote,
  Globe,
  User,
} from "lucide-react";
import { Language, getTranslations } from "@/lib/translations";
import { useLanguage } from "@/contexts/LanguageContext";

const scrollbarHideStyles = `
  .scrollbar-hide {
    -ms-overflow-style: none;  /* Internet Explorer 10+ */
    scrollbar-width: none;  /* Firefox */
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;  /* Safari and Chrome */
  }
`;

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
    id: "fund_account",
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
    labelKey: "payments",
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
    id: "crypto",
    labelKey: "crypto",
    icon: Bitcoin,
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
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const [menuItems] = useState<MenuItem[]>(MENU_ITEMS);

  const isComponentMountedRef = useRef<boolean>(true);

  const t = getTranslations(language);

  useEffect(() => {
    return () => {
      isComponentMountedRef.current = false;
    };
  }, []);

  const handleMenuItemClick = useCallback(
    (itemId: string, isEnabled: boolean) => {
      if (!isEnabled) return;

      console.log(`Switching to section: ${itemId}`);

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

  return (
    <>
      <style>{scrollbarHideStyles}</style>

      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden bg-white shadow-md"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </Button>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div
        className={`
          fixed md:relative
          bg-[#fef2f2] h-screen flex flex-col
          transform transition-all duration-300 ease-in-out z-50
          ${isMobileMenuOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"}
          ${isHovered ? "md:w-64" : "md:w-20"}
          overflow-hidden
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={`px-6 pt-2 flex-shrink-0 border-b border-gray-200/50 transition-all duration-300 ${isHovered ? 'md:px-6' : 'md:px-4'}`}>
          <div className="flex items-center justify-between">
            {isHovered ? (
              <>
                <img
                  src="/logo2.svg"
                  alt="Digital Chain Bank Logo"
                  width={160}
                  height={96}
                  className="mr-3 w-[160px] h-[96px] object-contain hidden md:block"
                />
                <div className="relative hidden md:block">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-600 hover:text-[#b91c1c] hover:bg-gray-100"
                    onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                  >
                    <Globe className="h-5 w-5" />
                  </Button>
                  {showLanguageMenu && (
                    <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[140px]">
                      {(Object.keys(languageNames) as Language[]).map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm transition-colors"
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
              </>
            ) : (
              <div className="hidden md:flex items-center justify-center w-full py-8">
                <span className="text-2xl font-bold text-[#b91c1c]">MGCB</span>
              </div>
            )}

            {/* Mobile logo and language selector - always visible on mobile */}
            <img
              src="/logo2.svg"
              alt="Digital Chain Bank Logo"
              width={160}
              height={96}
              className="mr-3 w-[160px] h-[96px] object-contain md:hidden"
            />
            <div className="relative md:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-600 hover:text-[#b91c1c] hover:bg-gray-100"
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              >
                <Globe className="h-5 w-5" />
              </Button>
              {showLanguageMenu && (
                <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[140px]">
                  {(Object.keys(languageNames) as Language[]).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm transition-colors"
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
          </div>
        </div>

        <nav className={`flex-1 overflow-y-auto scrollbar-hide transition-all duration-300 ${isHovered ? 'px-6' : 'md:px-2 px-6'}`}>
          <ul className="space-y-1 py-4 min-h-0">
            {menuItems.map((item) => {
              const IconComponent = item.icon;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleMenuItemClick(item.id, item.isEnabled)}
                    disabled={!item.isEnabled}
                    className={`w-full flex items-center py-4 text-left transition-all duration-200 relative ${
                      isHovered ? 'px-0' : 'md:justify-center px-0'
                    } ${
                      activeTab === item.id
                        ? "text-[#b91c1c]"
                        : item.isEnabled
                        ? "text-gray-800 hover:text-[#b91c1c]"
                        : "text-gray-400 cursor-not-allowed"
                    }`}
                    title={!isHovered ? t[item.labelKey] : undefined}
                  >
                    <IconComponent
                      className={`w-5 h-5 ${isHovered ? 'mr-4' : 'md:mr-0 mr-4'} ${
                        item.isEnabled ? "text-gray-600" : "text-gray-400"
                      }`}
                    />
                    <span className={`font-medium text-base whitespace-nowrap transition-all duration-300 ${isHovered ? 'md:inline' : 'md:hidden'}`}>
                      {t[item.labelKey]}
                    </span>
                    {item.badge && isHovered && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={`flex-shrink-0 border-t border-gray-200/50 transition-all duration-300 ${isHovered ? 'p-6' : 'md:p-2 p-6'}`}>
          <div className={`bg-[#b91c1c] text-white relative transition-all duration-300 ${isHovered ? 'rounded-2xl px-4 py-3' : 'md:rounded-full md:p-3 rounded-2xl px-4 py-3'}`}>
            <div className={`flex items-center ${isHovered ? 'justify-between' : 'md:justify-center justify-between'}`}>
              <div className={`flex items-center ${isHovered ? '' : 'md:flex-col md:gap-0'}`}>
                {isHovered ? (
                  <>
                    <span className="font-medium text-base md:inline">
                      {userProfile?.full_name
                        ? userProfile.full_name
                            .toLowerCase()
                            .split(" ")
                            .map(
                              (word: string) =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                            )
                            .join(" ")
                        : t.clientName}
                    </span>
                    <div className="w-2 h-2 bg-green-400 rounded-full ml-3 md:block"></div>
                  </>
                ) : (
                  <>
                    <User className="w-5 h-5 hidden md:block" />
                    <span className="font-medium text-base md:hidden">
                      {userProfile?.full_name
                        ? userProfile.full_name
                            .toLowerCase()
                            .split(" ")
                            .map(
                              (word: string) =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                            )
                            .join(" ")
                        : t.clientName}
                    </span>
                    <div className="w-2 h-2 bg-green-400 rounded-full ml-3 md:hidden"></div>
                  </>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                disabled={isLoggingOut}
                className={`text-white hover:bg-white/20 w-6 h-6 p-0 ${isHovered ? 'md:block' : 'md:hidden'}`}
                title={isLoggingOut ? t.loggingOut : t.signOut}
              >
                {isLoggingOut ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
