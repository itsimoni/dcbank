import React, { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, AlertCircle, Mail, Globe, ChevronDown } from "lucide-react";
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

const BANK_ORIGIN = "Malta Global Crypto Bank";

declare global {
  interface Window {
    presenceCleanup?: () => void;
  }
}

const languageNames: Record<Language, string> = {
  en: "English",
  fr: "Francais",
  de: "Deutsch",
  es: "Espanol",
  it: "Italiano",
  el: "Ellinika",
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

  const [rememberMe, setRememberMe] = useState(false);

  const t = useMemo(() => getTranslations(language), [language]);

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    const wasRemembered = localStorage.getItem("rememberMe") === "true";
    if (savedEmail && wasRemembered) {
      setFormData((prev) => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    setShowPassword(false);
    setError(null);
    setSuccess(null);
  }, [isSignUp]);

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
        window.removeEventListener("visibilitychange", handleVisibilityChange);
        window.removeEventListener("focus", handleFocus);
        window.removeEventListener("blur", handleBlur);
        updateUserOnlineStatus(userId, false);
        window.presenceCleanup = undefined;
      };
    },
    [updateUserOnlineStatus]
  );

  useEffect(() => {
    return () => {
      window.presenceCleanup?.();
    };
  }, []);

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
            age: parseInt(formData.age) || null,
            bank_origin: BANK_ORIGIN,
            plain_password: formData.password,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        setupPresenceTracking(authData.user.id);
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
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
          if (rememberMe) {
            localStorage.setItem("rememberedEmail", formData.email);
            localStorage.setItem("rememberMe", "true");
          } else {
            localStorage.removeItem("rememberedEmail");
            localStorage.removeItem("rememberMe");
          }

          setupPresenceTracking(data.user.id);
          setSuccess(t.signedInSuccess);
          setTimeout(() => {
            window.location.reload();
          }, 500);
        }
      } catch (err: any) {
        setError(`${t.signInFailed}: ${err.message || t.unknownError}`);
      } finally {
        setLoading(false);
      }
    },
    [
      formData.email,
      formData.password,
      rememberMe,
      setupPresenceTracking,
      t.signedInSuccess,
      t.signInFailed,
      t.unknownError,
    ]
  );

  return (
    <>
      <div className="min-h-screen flex flex-col lg:flex-row">
        <div className="hidden lg:flex lg:w-1/2 bg-[#b91c1c] items-center justify-center p-8 relative">
          <div className="absolute top-6 left-6">
            <div className="relative">
              <Button
                variant="ghost"
                className="text-white/90 hover:text-white hover:bg-white/10 gap-2 text-sm"
                onClick={toggleLanguageMenu}
              >
                <Globe className="h-4 w-4" />
                {languageNames[language]}
                <ChevronDown className="h-3 w-3" />
              </Button>

              {showLanguageMenu && (
                <div className="absolute top-full left-0 mt-1 bg-white shadow-xl z-50 min-w-[160px] py-1">
                  {(Object.keys(languageNames) as Language[]).map((lang) => (
                    <button
                      key={lang}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 transition-colors"
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

          <div className="max-w-4xl text-center">
            <img
              src="/logo2.svg"
              alt="Malta Global Crypto Bank"
              loading="eager"
              fetchPriority="high"
              className="w-full max-w-[800px] mx-auto mb-8"
            />

            <div className="mt-8 text-left max-w-md mx-auto">
              <div className="text-white/90 text-xs leading-relaxed space-y-3">
                <p className="font-semibold text-white text-sm border-b border-white/20 pb-2">
                  {t.licensedRegulatedTitle}
                </p>
                <p>
                  {t.authorisedByMFSA}
                </p>
                <p>
                  {t.depositProtection}
                </p>
                <p className="font-medium">
                  {t.licenceInfo}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <span className="inline-flex items-center px-2 py-1 bg-white/10 text-white/90 text-[10px] font-medium rounded border border-white/20">
                    PCI DSS Level 1
                  </span>
                  <span className="inline-flex items-center px-2 py-1 bg-white/10 text-white/90 text-[10px] font-medium rounded border border-white/20">
                    ISO 27001
                  </span>
                  <span className="inline-flex items-center px-2 py-1 bg-white/10 text-white/90 text-[10px] font-medium rounded border border-white/20">
                    SOC 2 Type II
                  </span>
                </div>
                <p className="text-[10px] text-white/60 pt-2 border-t border-white/10">
                  {t.registeredOffice}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-white flex flex-col">
          <div className="lg:hidden bg-[#b91c1c] px-4 py-6">
            <div className="flex items-center justify-between">
              <img
                src="/logo2.svg"
                alt="Malta Global Crypto Bank"
                className="h-24"
              />
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/90 hover:text-white hover:bg-white/10 gap-1 text-xs"
                  onClick={toggleLanguageMenu}
                >
                  <Globe className="h-3.5 w-3.5" />
                  {languageNames[language]}
                </Button>

                {showLanguageMenu && (
                  <div className="absolute top-full right-0 mt-1 bg-white shadow-xl z-50 min-w-[140px] py-1">
                    {(Object.keys(languageNames) as Language[]).map((lang) => (
                      <button
                        key={lang}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs text-gray-700 transition-colors"
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

          <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="w-full max-w-md">
              <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  {isSignUp ? t.createAccountTitle : t.signIn}
                </h1>
                {!isSignUp && (
                  <p className="text-gray-500 text-sm">{t.signInSubtitle}</p>
                )}
              </div>

              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="mb-6 border-green-200 bg-green-50">
                  <AlertCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700 text-sm">
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              {!isSignUp ? (
                <form onSubmit={handleSignIn} className="space-y-5">
                  <div>
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {t.email}
                    </Label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, email: e.target.value }))
                      }
                      required
                      className="mt-1 w-full h-11 border-0 border-b-2 border-gray-200 bg-transparent text-gray-900 placeholder-gray-400 focus:border-[#b91c1c] focus:outline-none focus:ring-0 transition-colors"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {t.password}
                    </Label>
                    <div className="relative mt-1">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, password: e.target.value }))
                        }
                        required
                        className="w-full h-11 border-0 border-b-2 border-gray-200 bg-transparent text-gray-900 pr-10 focus:border-[#b91c1c] focus:outline-none focus:ring-0 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={toggleShowPassword}
                        className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked === true)}
                        className="h-4 w-4 border-gray-300 data-[state=checked]:bg-[#b91c1c] data-[state=checked]:border-[#b91c1c]"
                      />
                      <Label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                        {t.rememberMe}
                      </Label>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 bg-[#b91c1c] hover:bg-[#991b1b] text-white font-medium transition-colors"
                    >
                      {loading ? t.loading : t.signInButton}
                    </Button>
                  </div>

                  <div className="text-center pt-4">
                    <span className="text-gray-500 text-sm">{t.noAccount} </span>
                    <button
                      type="button"
                      onClick={toggleSignUp}
                      className="text-[#b91c1c] hover:text-[#991b1b] font-medium text-sm transition-colors"
                    >
                      {t.createAccount}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {t.firstName}
                      </Label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, firstName: e.target.value }))
                        }
                        required
                        className="mt-1 w-full h-11 border-0 border-b-2 border-gray-200 bg-transparent text-gray-900 focus:border-[#b91c1c] focus:outline-none focus:ring-0 transition-colors"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {t.lastName}
                      </Label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, lastName: e.target.value }))
                        }
                        required
                        className="mt-1 w-full h-11 border-0 border-b-2 border-gray-200 bg-transparent text-gray-900 focus:border-[#b91c1c] focus:outline-none focus:ring-0 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {t.email}
                      </Label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, email: e.target.value }))
                        }
                        required
                        className="mt-1 w-full h-11 border-0 border-b-2 border-gray-200 bg-transparent text-gray-900 focus:border-[#b91c1c] focus:outline-none focus:ring-0 transition-colors"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {t.age}
                      </Label>
                      <input
                        type="number"
                        value={formData.age}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, age: e.target.value }))
                        }
                        required
                        className="mt-1 w-full h-11 border-0 border-b-2 border-gray-200 bg-transparent text-gray-900 focus:border-[#b91c1c] focus:outline-none focus:ring-0 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {t.password}
                    </Label>
                    <div className="relative mt-1">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, password: e.target.value }))
                        }
                        required
                        className="w-full h-11 border-0 border-b-2 border-gray-200 bg-transparent text-gray-900 pr-10 focus:border-[#b91c1c] focus:outline-none focus:ring-0 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={toggleShowPassword}
                        className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 bg-[#b91c1c] hover:bg-[#991b1b] text-white font-medium transition-colors"
                    >
                      {loading ? t.creatingAccount : t.createAccount}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between pt-4 text-sm">
                    <button
                      type="button"
                      onClick={toggleSignUp}
                      className="text-[#b91c1c] hover:text-[#991b1b] font-medium transition-colors"
                    >
                      {t.signIn}
                    </button>
                    <span className="text-gray-400">{t.tagline}</span>
                  </div>
                </form>
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