import React, { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, AlertCircle, Mail, Globe } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Language, getTranslations } from "@/lib/translations";
import { useLanguage } from "@/contexts/LanguageContext";

const BANK_ORIGIN = "Digital Chain Bank";

declare global {
  interface Window {
    presenceCleanup?: () => void;
  }
}

const languageNames: Record<Language, string> = {
  en: "English",
  fr: "Français",
  de: "Deutsch",
  es: "Español",
  it: "Italiano",
  el: "Ελληνικά",
};

export default function AuthForm() {
  const { language, setLanguage } = useLanguage();
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    firstName: "",
    lastName: "",
    age: "",
  });

  const t = useMemo(() => getTranslations(language), [language]);

  useEffect(() => {
    setShowPassword(false);
    setError(null);
    setSuccess(null);
  }, [isSignUp]);

  // ---- Small stable UI handlers (less allocations per render) ----
  const toggleLanguageMenu = useCallback(() => {
    setShowLanguageMenu((v) => !v);
  }, []);

  const toggleSignUp = useCallback(() => {
    setIsSignUp((v) => !v);
  }, []);

  const toggleShowPassword = useCallback(() => {
    setShowPassword((v) => !v);
  }, []);

  const closeForgotPassword = useCallback(() => {
    setShowForgotPassword(false);
  }, []);

  // ---- Presence tracking (kept exactly as you had it, just stabilized) ----
  const updateUserOnlineStatus = useCallback(
    async (userId: string, isOnline: boolean) => {
      try {
        const { data: existingRecord, error: selectError } = await supabase
          .from("user_presence")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (selectError && (selectError as any).code !== "PGRST116") {
          console.error("Error checking user presence:", selectError);
          return;
        }

        const presenceData = {
          is_online: isOnline,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        if (existingRecord) {
          const { error: updateError } = await supabase
            .from("user_presence")
            .update(presenceData)
            .eq("user_id", userId);

          if (updateError) {
            console.error("Error updating user presence:", updateError);
          }
        } else {
          const { error: insertError } = await supabase.from("user_presence").insert({
            user_id: userId,
            ...presenceData,
            created_at: new Date().toISOString(),
          });

          if (insertError) {
            console.error("Error inserting user presence:", insertError);
          }
        }
      } catch (err) {
        console.error("Error in updateUserOnlineStatus:", err);
      }
    },
    []
  );

  const setupPresenceTracking = useCallback(
    (userId: string) => {
      if (window.presenceCleanup) {
        window.presenceCleanup();
      }

      updateUserOnlineStatus(userId, true);

      const heartbeatInterval = setInterval(() => {
        updateUserOnlineStatus(userId, true);
      }, 30000);

      const handleBeforeUnload = () => {
        updateUserOnlineStatus(userId, false);
      };

      const handleVisibilityChange = () => {
        if (document.hidden) {
          updateUserOnlineStatus(userId, false);
        } else {
          updateUserOnlineStatus(userId, true);
        }
      };

      const handleFocus = () => updateUserOnlineStatus(userId, true);
      const handleBlur = () => updateUserOnlineStatus(userId, false);

      window.addEventListener("beforeunload", handleBeforeUnload);
      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("focus", handleFocus);
      window.addEventListener("blur", handleBlur);

      window.presenceCleanup = () => {
        clearInterval(heartbeatInterval);
        window.removeEventListener("beforeunload", handleBeforeUnload);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        window.removeEventListener("focus", handleFocus);
        window.removeEventListener("blur", handleBlur);
        updateUserOnlineStatus(userId, false);
        window.presenceCleanup = undefined;
      };
    },
    [updateUserOnlineStatus]
  );

  // Optional safety: if the component unmounts, cleanup presence if it was set.
  // This does not change user-visible behavior; it prevents orphan listeners/intervals.
  useEffect(() => {
    return () => {
      window.presenceCleanup?.();
    };
  }, []);

  // ---- Handlers (stabilized) ----
  const handleForgotPassword = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setForgotPasswordLoading(true);
      setError(null);
      setSuccess(null);

      try {
        const { error } = await supabase.auth.resetPasswordForEmail(
          forgotPasswordEmail,
          {
            redirectTo: `${window.location.origin}/reset-password`,
          }
        );

        if (error) throw error;

        setSuccess(t.passwordResetSent);
        setShowForgotPassword(false);
        setForgotPasswordEmail("");
      } catch (err: any) {
        setError(`${t.resetEmailFailed}: ${err.message}`);
      } finally {
        setForgotPasswordLoading(false);
      }
    },
    [forgotPasswordEmail, t.passwordResetSent, t.resetEmailFailed]
  );

  const handleSignUp = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);
      setSuccess(null);

      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              first_name: formData.firstName,
              last_name: formData.lastName,
              full_name: `${formData.firstName} ${formData.lastName}`,
              age: formData.age,
              bank_origin: BANK_ORIGIN,
            },
          },
        });

        if (authError) throw authError;

        if (authData.user) {
          const res = await fetch("/api/create-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: authData.user.id,
              email: formData.email,
              firstName: formData.firstName,
              lastName: formData.lastName,
              password: formData.password,
              age: formData.age,
            }),
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Failed to create user profile");
          }

          setupPresenceTracking(authData.user.id);
        }

        setSuccess(t.accountCreatedSuccess);
      } catch (err: any) {
        setError(`${t.signupFailed}: ${err.message || t.unknownError}`);
      } finally {
        setLoading(false);
      }
    },
    [
      formData.email,
      formData.password,
      formData.firstName,
      formData.lastName,
      formData.age,
      setupPresenceTracking,
      t.accountCreatedSuccess,
      t.signupFailed,
      t.unknownError,
    ]
  );

  const handleSignIn = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);
      setSuccess(null);

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        if (data.user) {
          const res = await fetch("/api/update-password-if-empty", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: data.user.id,
              password: formData.password,
            }),
          });

          if (!res.ok) {
            const err = await res.json();
            console.error("Password update error:", err);
          }

          setupPresenceTracking(data.user.id);
        }

        setSuccess(t.signedInSuccess);
      } catch (err: any) {
        setError(`${t.signInFailed}: ${err.message || t.unknownError}`);
      } finally {
        setLoading(false);
      }
    },
    [
      formData.email,
      formData.password,
      setupPresenceTracking,
      t.signedInSuccess,
      t.signInFailed,
      t.unknownError,
    ]
  );

  return (
    <>
      <div className="min-h-screen h-auto bg-[#b91c1c] flex items-center justify-center p-2 sm:p-4 md:p-6 py-4 sm:py-6">
        <div className="bg-white shadow-2xl max-w-5xl w-full min-h-[500px] h-auto sm:min-h-[600px] flex flex-col lg:flex-row rounded-lg sm:rounded-2xl overflow-hidden">
          <div className="relative w-full lg:w-2/5 h-40 sm:h-48 md:h-56 lg:h-auto overflow-hidden rounded-t-lg sm:rounded-t-2xl lg:rounded-l-2xl lg:rounded-tr-none">
            <div
              className="absolute inset-y-0 right-0 w-4 pointer-events-none hidden lg:block"
              style={{
                background:
                  "linear-gradient(to left, rgba(0,0,0,0.3), transparent)",
              }}
            />
            <div className="h-full flex items-center justify-center p-2 sm:p-4 overflow-hidden">
              <div className="w-full h-full flex items-center justify-center">
                <img
                  src="/logo2.svg"
                  alt="Digital Chain Bank ATM"
                  loading="lazy"
                  decoding="async"
                  className="h-full w-auto max-h-[120px] sm:max-h-[180px] md:max-h-[220px] lg:max-h-[500px] xl:max-h-[600px] object-contain scale-110 sm:scale-125 lg:scale-150"
                />
              </div>
            </div>
          </div>

          <div className="w-full lg:w-3/5 flex flex-col rounded-b-lg sm:rounded-b-2xl lg:rounded-r-2xl lg:rounded-bl-none overflow-hidden">
            <div className="flex items-center justify-end px-3 sm:px-4 md:px-6 py-3 sm:py-4 bg-white gap-2">
              <div className="relative">
                <Button
                  variant="outline"
                  className="bg-transparent border-[#b91c1c] text-[#b91c1c] hover:bg-[#b91c1c] hover:text-white px-2 py-1.5 text-xs transition-all duration-300 flex items-center gap-1.5"
                  onClick={toggleLanguageMenu}
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span className="truncate">{languageNames[language]}</span>
                </Button>

                {showLanguageMenu && (
                  <div className="absolute top-full right-0 mt-2 bg-white border-none border-gray-200 shadow-lg z-50 min-w-[140px] overflow-hidden">
                    {(Object.keys(languageNames) as Language[]).map((lang) => (
                      <button
                        key={lang}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-xs sm:text-sm transition-colors"
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

              <Button
                variant="outline"
                className="bg-transparent border-[#b91c1c] text-[#b91c1c] hover:bg-[#b91c1c] hover:text-white px-2 py-1.5 text-xs rounded-md transition-all duration-300 whitespace-nowrap"
                onClick={toggleSignUp}
              >
                {isSignUp ? t.signIn : t.createAccount}
              </Button>
            </div>

            <div className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 flex flex-col justify-center overflow-y-auto">
              {error && (
                <Alert variant="destructive" className="mb-3 sm:mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs sm:text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="mb-3 sm:mb-4 border-green-200 bg-green-50">
                  <AlertCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 text-xs sm:text-sm">
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              {!isSignUp ? (
                <div className="max-w-sm mx-auto w-full">
                  <div className="mb-4 sm:mb-6 md:mb-8">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-1.5 sm:mb-2">
                      {t.signIn}
                    </h2>
                    <p className="text-gray-600 text-xs sm:text-sm">{t.signInSubtitle}</p>
                  </div>

                  <form onSubmit={handleSignIn} className="space-y-4 sm:space-y-5 md:space-y-6">
                    <div>
                      <input
                        type="email"
                        placeholder={t.email}
                        value={formData.email}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        required
                        className="w-full h-9 sm:h-10 border-0 border-b-2 border-gray-300 rounded-none px-0 bg-transparent text-sm sm:text-base outline-none focus:outline-none focus:ring-0 focus:shadow-none focus:border-[#b91c1c] transition-colors"
                      />
                    </div>

                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder={t.password}
                        value={formData.password}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            password: e.target.value,
                          }))
                        }
                        required
                        className="w-full h-9 sm:h-10 border-0 border-b-2 border-gray-300 rounded-none px-0 pr-10 bg-transparent text-sm sm:text-base outline-none focus:outline-none focus:ring-0 focus:shadow-none focus:border-[#b91c1c] transition-colors"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-transparent"
                        onClick={toggleShowPassword}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember"
                        className="w-4 h-4 border-2 border-gray-300 data-[state=checked]:bg-[#b91c1c] data-[state=checked]:border-[#b91c1c]"
                      />
                      <Label
                        htmlFor="remember"
                        className="text-xs sm:text-sm text-gray-600 cursor-pointer"
                      >
                        {t.rememberMe}
                      </Label>
                    </div>

                    <Button
                      type="submit"
                      className="w-full sm:w-28 h-9 sm:h-10 bg-[#b91c1c] hover:bg-[#991b1b] text-white font-medium rounded-md transition-all duration-300 disabled:opacity-50 text-sm"
                      disabled={loading}
                    >
                      {loading ? t.loading : t.signInButton}
                    </Button>
                  </form>
                </div>
              ) : (
                <div className="max-w-md mx-auto w-full">
                  <div className="mb-4 sm:mb-6 md:mb-8">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-1.5 sm:mb-2">
                      {t.createAccountTitle}
                    </h2>
                  </div>

                  <form onSubmit={handleSignUp} className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <input
                          type="text"
                          placeholder={t.firstName}
                          value={formData.firstName}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              firstName: e.target.value,
                            }))
                          }
                          required
                          className="w-full h-9 sm:h-10 border-0 border-b-2 border-gray-300 rounded-none px-0 bg-transparent text-sm sm:text-base outline-none focus:outline-none focus:ring-0 focus:shadow-none focus:border-[#b91c1c] transition-colors"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder={t.lastName}
                          value={formData.lastName}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              lastName: e.target.value,
                            }))
                          }
                          required
                          className="w-full h-9 sm:h-10 border-0 border-b-2 border-gray-300 rounded-none px-0 bg-transparent text-sm sm:text-base outline-none focus:outline-none focus:ring-0 focus:shadow-none focus:border-[#b91c1c] transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <input
                          type="email"
                          placeholder={t.email}
                          value={formData.email}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                          required
                          className="w-full h-9 sm:h-10 border-0 border-b-2 border-gray-300 rounded-none px-0 bg-transparent text-sm sm:text-base outline-none focus:outline-none focus:ring-0 focus:shadow-none focus:border-[#b91c1c] transition-colors"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          placeholder={t.age}
                          value={formData.age}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              age: e.target.value,
                            }))
                          }
                          required
                          className="w-full h-9 sm:h-10 border-0 border-b-2 border-gray-300 rounded-none px-0 bg-transparent text-sm sm:text-base outline-none focus:outline-none focus:ring-0 focus:shadow-none focus:border-[#b91c1c] transition-colors"
                        />
                      </div>
                    </div>

                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder={t.password}
                        value={formData.password}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            password: e.target.value,
                          }))
                        }
                        required
                        className="w-full h-9 sm:h-10 border-0 border-b-2 border-gray-300 rounded-none px-0 pr-10 sm:pr-12 bg-transparent text-sm sm:text-base outline-none focus:outline-none focus:ring-0 focus:shadow-none focus:border-[#b91c1c] transition-colors"
                      />
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-transparent"
                          onClick={toggleShowPassword}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="pt-3 sm:pt-4 md:pt-6">
                      <Button
                        type="submit"
                        className="w-full h-10 sm:h-11 md:h-12 bg-[#b91c1c] hover:bg-[#991b1b] text-white font-medium rounded-md transition-all duration-300 disabled:opacity-50 text-sm sm:text-base"
                        disabled={loading}
                      >
                        {loading ? t.creatingAccount : t.createAccount}
                      </Button>
                    </div>
                  </form>

                  <div className="flex flex-col sm:flex-row justify-between items-center mt-4 sm:mt-6 md:mt-8 text-xs gap-2 sm:gap-0">
                    <button className="text-gray-500 hover:text-[#b91c1c] transition-colors text-center sm:text-left">
                      {t.returnHome}
                    </button>
                    <span className="text-gray-400 text-center sm:text-right">
                      {t.tagline}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-[#b91c1c]" />
              {t.resetPassword}
            </DialogTitle>
            <DialogDescription>{t.resetPasswordDescription}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">{t.emailAddress}</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder={t.enterYourEmail}
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                required
                className="focus:ring-[#b91c1c] focus:border-[#b91c1c]"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={closeForgotPassword}
                className="flex-1"
              >
                {t.cancel}
              </Button>
              <Button
                type="submit"
                disabled={forgotPasswordLoading}
                className="flex-1 bg-[#b91c1c] hover:bg-[#991b1b]"
              >
                {forgotPasswordLoading ? t.sending : t.sendResetLink}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}