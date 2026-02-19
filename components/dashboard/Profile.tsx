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
  const { language } = useLanguage();

  const t = useMemo(() => getTranslations(language), [language]);

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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="border-l-4 border-[#b91c1c] pl-4">
          <h1 className="text-2xl font-semibold text-gray-900">{t.profileTitle}</h1>
          <p className="text-sm text-gray-600 mt-1">{t.emailLabel}: {userData?.email}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 shadow-sm p-6 mb-4">
        <div className="border-b border-gray-100 pb-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {userData?.full_name
                  ? userData.full_name
                      .toLowerCase()
                      .split(" ")
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(" ")
                  : t.userLabel}
              </h2>
              <p className="text-sm text-gray-600 mt-1">{getRoleLabel()}</p>
            </div>
            <div className={`px-3 py-1 text-xs font-medium ${getKycStatusColor(userData?.kyc_status || 'not_started')}`}>
              {userData?.kyc_status === 'approved' ? t.kycApprovedStatus :
               userData?.kyc_status === 'pending' ? t.kycPendingStatus :
               userData?.kyc_status === 'rejected' ? t.kycRejectedStatus :
               t.kycNotStartedStatus}
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center">
              <Mail className="w-4 h-4 text-gray-400 mr-3" />
              <span className="text-xs text-gray-500 uppercase tracking-wide">{t.emailLabel}</span>
            </div>
            <span className="text-sm text-gray-900 font-medium">{userData?.email || t.notAvailable}</span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 text-gray-400 mr-3" />
              <span className="text-xs text-gray-500 uppercase tracking-wide">{t.ageLabel}</span>
            </div>
            <span className="text-sm text-gray-900 font-medium tabular-nums">{userData?.age || t.notAvailable}</span>
          </div>

          {userData?.first_name && (
            <div className="py-3 flex items-center justify-between">
              <div className="flex items-center">
                <User className="w-4 h-4 text-gray-400 mr-3" />
                <span className="text-xs text-gray-500 uppercase tracking-wide">{t.firstNameLabel}</span>
              </div>
              <span className="text-sm text-gray-900 font-medium">
                {userData.first_name
                  ? userData.first_name.charAt(0).toUpperCase() +
                    userData.first_name.slice(1).toLowerCase()
                  : ""}
              </span>
            </div>
          )}

          {userData?.last_name && (
            <div className="py-3 flex items-center justify-between">
              <div className="flex items-center">
                <User className="w-4 h-4 text-gray-400 mr-3" />
                <span className="text-xs text-gray-500 uppercase tracking-wide">{t.lastNameLabel}</span>
              </div>
              <span className="text-sm text-gray-900 font-medium">
                {userData.last_name
                  ? userData.last_name.charAt(0).toUpperCase() +
                    userData.last_name.slice(1).toLowerCase()
                  : ""}
              </span>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 pt-4 mt-4 flex justify-between text-xs text-gray-500">
          <span className="flex items-center">
            <span className="font-medium text-gray-600">Member since:</span>
            <span className="ml-2 tabular-nums">
              {userData?.created_at ? new Date(userData.created_at).toLocaleDateString() : t.notAvailable}
            </span>
          </span>
          {userData?.client_id && (
            <span className="flex items-center">
              <span className="font-medium text-gray-600">Client ID:</span>
              <span className="ml-2 font-mono">{userData.client_id}</span>
            </span>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 shadow-sm p-6">
        <div className="border-b border-gray-100 pb-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Lock className="w-5 h-5 mr-2 text-gray-600" />
            {t.changePasswordTitle}
          </h3>
          <p className="text-xs text-gray-600 mt-2">
            For your security, use a strong password and never share it with anyone.
          </p>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label
              htmlFor="current-password"
              className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2"
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
              className="w-full h-11 px-4 border border-gray-300 focus:ring-2 focus:ring-[#b91c1c] focus:border-transparent text-sm"
              required
            />
          </div>

          <div>
            <label
              htmlFor="new-password"
              className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2"
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
              className="w-full h-11 px-4 border border-gray-300 focus:ring-2 focus:ring-[#b91c1c] focus:border-transparent text-sm"
              required
              minLength={6}
            />
            <p className="text-xs text-gray-500 mt-1.5">Minimum 6 characters required</p>
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2"
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
              className="w-full h-11 px-4 border border-gray-300 focus:ring-2 focus:ring-[#b91c1c] focus:border-transparent text-sm"
              required
              minLength={6}
            />
          </div>

          {passwordError && (
            <div className="flex items-start p-3 border border-red-200 bg-red-50 text-red-800 text-sm">
              <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          {passwordSuccess && (
            <div className="flex items-start p-3 border border-green-200 bg-green-50 text-green-800 text-sm">
              <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              disabled={isChangingPassword}
              className="w-full bg-[#b91c1c] hover:bg-[#991b1b] text-white font-semibold h-11 transition-colors"
            >
              {isChangingPassword ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin mr-2"></div>
                  {t.updatingPasswordButton}
                </div>
              ) : (
                t.updatePasswordButton
              )}
            </Button>
            <p className="text-xs text-gray-500 text-center mt-2">
              Changes apply immediately and may require re-login.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
