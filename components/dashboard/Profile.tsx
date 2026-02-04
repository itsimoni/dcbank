import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { getTranslations, Language } from "@/lib/translations";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  User,
  Lock,
  Mail,
  Calendar,
  AlertCircle,
  CheckCircle,
  Languages,
  ChevronDown,
} from "lucide-react";

interface ProfileProps {
  userProfile: any;
}

interface UserData {
  id: string;
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  age: number;
  client_id: string;
  kyc_status: string;
  is_admin: boolean;
  is_manager: boolean;
  is_superiormanager: boolean;
  created_at: string;
}

export default function Profile({ userProfile }: ProfileProps) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
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
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: usersData } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      const { data: profilesData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      setUserData({
        id: user.id,
        email: user.email || profilesData?.email || usersData?.email || "",
        full_name: usersData?.full_name || profilesData?.full_name || "",
        first_name: usersData?.first_name || "",
        last_name: usersData?.last_name || "",
        age: usersData?.age || profilesData?.age || 0,
        client_id: profilesData?.client_id || "",
        kyc_status: usersData?.kyc_status || "not_started",
        is_admin: usersData?.is_admin || false,
        is_manager: usersData?.is_manager || false,
        is_superiormanager: usersData?.is_superiormanager || false,
        created_at: usersData?.created_at || profilesData?.created_at || "",
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError(t.passwordMismatchError);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError(t.passwordLengthError);
      return;
    }

    setIsChangingPassword(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setPasswordError(t.userNotAuthenticatedError);
        setIsChangingPassword(false);
        return;
      }

      const { error: authError } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (authError) {
        setPasswordError(authError.message || t.passwordUpdateError);
        setIsChangingPassword(false);
        return;
      }

      const { error: usersError } = await supabase
        .from("users")
        .update({ password: passwordData.newPassword })
        .eq("id", user.id);

      if (usersError) {
        console.error("Error updating users table:", usersError);
      }

      const { error: profilesError } = await supabase
        .from("profiles")
        .update({
          password: passwordData.newPassword,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profilesError) {
        console.error("Error updating profiles table:", profilesError);
      }

      setPasswordSuccess(t.passwordUpdateSuccess);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      setPasswordError(error.message || t.passwordUpdateError);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getRoleLabel = () => {
    if (userData?.is_superiormanager) return t.superiorManagerRole;
    if (userData?.is_manager) return t.managerRole;
    if (userData?.is_admin) return t.adminRole;
    return t.clientRole;
  };

  const getKycStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-green-600 bg-green-50";
      case "pending":
        return "text-yellow-600 bg-yellow-50";
      case "rejected":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-[#F26623] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">{t.profileTitle}</h1>
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

      <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
        <div className="flex items-center mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">
              {userData?.full_name
                ? userData.full_name
                    .toLowerCase()
                    .split(" ")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")
                : t.userLabel}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center">
            <Mail className="w-5 h-5 text-gray-400 mr-3" />
            <div>
              <p className="text-sm text-gray-500">{t.emailLabel}</p>
              <p className="text-gray-800 font-medium">
                {userData?.email || t.notAvailable}
              </p>
            </div>
          </div>

          <div className="flex items-center">
            <Calendar className="w-5 h-5 text-gray-400 mr-3" />
            <div>
              <p className="text-sm text-gray-500">{t.ageLabel}</p>
              <p className="text-gray-800 font-medium">
                {userData?.age || t.notAvailable}
              </p>
            </div>
          </div>

          {userData?.first_name && (
            <div className="flex items-center">
              <User className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">{t.firstNameLabel}</p>
                <p className="text-gray-800 font-medium">
                  {userData.first_name
                    ? userData.first_name.charAt(0).toUpperCase() +
                      userData.first_name.slice(1).toLowerCase()
                    : ""}
                </p>
              </div>
            </div>
          )}

          {userData?.last_name && (
            <div className="flex items-center">
              <User className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">{t.lastNameLabel}</p>
                <p className="text-gray-800 font-medium">
                  {userData.last_name
                    ? userData.last_name.charAt(0).toUpperCase() +
                      userData.last_name.slice(1).toLowerCase()
                    : ""}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
          <Lock className="w-5 h-5 mr-2" />
          {t.changePasswordTitle}
        </h3>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label
              htmlFor="current-password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {t.currentPasswordLabel}
            </label>
            <input
              id="current-password"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  currentPassword: e.target.value,
                })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F26623] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label
              htmlFor="new-password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {t.newPasswordLabel}
            </label>
            <input
              id="new-password"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  newPassword: e.target.value,
                })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F26623] focus:border-transparent"
              required
              minLength={6}
            />
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {t.confirmNewPasswordLabel}
            </label>
            <input
              id="confirm-password"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  confirmPassword: e.target.value,
                })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F26623] focus:border-transparent"
              required
              minLength={6}
            />
          </div>

          {passwordError && (
            <div className="flex items-center p-4 bg-red-50 text-red-700 rounded-lg">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span>{passwordError}</span>
            </div>
          )}

          {passwordSuccess && (
            <div className="flex items-center p-4 bg-green-50 text-green-700 rounded-lg">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={isChangingPassword}
            className="w-full bg-[#F26623] hover:bg-[#d95a1f] text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {isChangingPassword ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {t.updatingPasswordButton}
              </div>
            ) : (
              t.updatePasswordButton
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
