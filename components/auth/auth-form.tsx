import React, { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, AlertCircle, Mail, Globe, ChevronDown, CheckCircle2, Loader2 } from "lucide-react";
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
    PasswordCredential?: new (data: {
      id: string;
      password: string;
      name?: string;
    }) => Credential;
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

interface AuthFormProps {
  onLoginSuccess?: () => void;
}

export default function AuthForm({ onLoginSuccess }: AuthFormProps = {}) {
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
  const [pendingVerification, setPendingVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    firstName: "",
    lastName: "",
    age: "",
  });

  const [rememberMe, setRememberMe] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

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
        const now = new Date().toISOString();
        const { error } = await supabase
          .from("user_presence")
          .upsert(
            {
              user_id: userId,
              is_online: isOnline,
              last_seen: now,
              updated_at: now,
              created_at: now,
            },
            { onConflict: "user_id" }
          );

        if (error) {
          console.error("Error updating user presence:", error);
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
        await supabase.auth.signOut();

        setPendingEmail(formData.email);
        setPendingVerification(true);

        if (window.PasswordCredential) {
          try {
            const cred = new window.PasswordCredential({
              id: formData.email,
              password: formData.password,
              name: `${formData.firstName} ${formData.lastName}`,
            });
            await navigator.credentials.store(cred);
          } catch {}
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        fetch(`${supabaseUrl}/functions/v1/send-verification-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            userId: authData.user.id,
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            baseUrl: window.location.origin,
          }),
        }).catch((err) => {
          console.error("Failed to send verification email:", err);
        });
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

          if (window.PasswordCredential) {
            try {
              const cred = new window.PasswordCredential({
                id: formData.email,
                password: formData.password,
                name: formData.email,
              });
              await navigator.credentials.store(cred);
            } catch {}
          }

          setSuccess(t.signedInSuccess);
          if (onLoginSuccess) {
            onLoginSuccess();
          } else {
            window.location.reload();
          }
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
      onLoginSuccess,
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
              {pendingVerification ? (
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 mx-auto bg-[#b91c1c]/10 rounded-full flex items-center justify-center">
                    <Mail className="w-10 h-10 text-[#b91c1c]" />
                  </div>

                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                      Verify Your Email
                    </h1>
                    <p className="text-gray-600 leading-relaxed">
                      We have sent a verification email to:
                    </p>
                    <p className="text-[#b91c1c] font-semibold mt-2 text-lg">
                      {pendingEmail}
                    </p>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 p-6 text-left space-y-4">
                    <h3 className="font-semibold text-gray-900">Next Steps:</h3>
                    <ol className="space-y-3 text-sm text-gray-700">
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-[#b91c1c] text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                        <span>Check your email inbox (and spam folder) for the verification email from Malta Global Crypto Bank</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-[#b91c1c] text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                        <span>Click the verification link in the email to confirm your email address</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-[#b91c1c] text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                        <span>After verification, you will be redirected to complete your KYC (Know Your Customer) verification</span>
                      </li>
                    </ol>
                  </div>

                  <div className="pt-4 space-y-3">
                    <p className="text-xs text-gray-500">
                      The verification link will expire in 24 hours. If you don't receive the email, please check your spam folder or contact support.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPendingVerification(false);
                        setIsSignUp(false);
                        setFormData(prev => ({ ...prev, email: pendingEmail, password: "" }));
                      }}
                      className="border-[#b91c1c] text-[#b91c1c] hover:bg-[#b91c1c] hover:text-white"
                    >
                      Back to Sign In
                    </Button>
                  </div>
                </div>
              ) : (
              <>
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
                <form onSubmit={handleSignIn} className="space-y-5" autoComplete="on">
                  <div>
                    <Label htmlFor="login-email" className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {t.email}
                    </Label>
                    <input
                      id="login-email"
                      name="email"
                      type="email"
                      autoComplete="username"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, email: e.target.value }))
                      }
                      required
                      className="mt-1 w-full h-11 border-0 border-b-2 border-gray-200 bg-transparent text-gray-900 placeholder-gray-400 focus:border-[#b91c1c] focus:outline-none focus:ring-0 transition-colors"
                    />
                  </div>

                  <div>
                    <Label htmlFor="login-password" className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {t.password}
                    </Label>
                    <div className="relative mt-1">
                      <input
                        id="login-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
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
                <form onSubmit={handleSignUp} className="space-y-4" autoComplete="on">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="signup-firstname" className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {t.firstName}
                      </Label>
                      <input
                        id="signup-firstname"
                        name="firstname"
                        type="text"
                        autoComplete="given-name"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, firstName: e.target.value }))
                        }
                        required
                        className="mt-1 w-full h-11 border-0 border-b-2 border-gray-200 bg-transparent text-gray-900 focus:border-[#b91c1c] focus:outline-none focus:ring-0 transition-colors"
                      />
                    </div>
                    <div>
                      <Label htmlFor="signup-lastname" className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {t.lastName}
                      </Label>
                      <input
                        id="signup-lastname"
                        name="lastname"
                        type="text"
                        autoComplete="family-name"
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
                      <Label htmlFor="signup-email" className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {t.email}
                      </Label>
                      <input
                        id="signup-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, email: e.target.value }))
                        }
                        required
                        className="mt-1 w-full h-11 border-0 border-b-2 border-gray-200 bg-transparent text-gray-900 focus:border-[#b91c1c] focus:outline-none focus:ring-0 transition-colors"
                      />
                    </div>
                    <div>
                      <Label htmlFor="signup-age" className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {t.age}
                      </Label>
                      <input
                        id="signup-age"
                        name="age"
                        type="number"
                        autoComplete="off"
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
                    <Label htmlFor="signup-password" className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {t.password}
                    </Label>
                    <div className="relative mt-1">
                      <input
                        id="signup-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
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

                  <div className="flex items-start gap-3 pt-4">
                    <Checkbox
                      id="terms-accept"
                      checked={termsAccepted}
                      onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                      className="mt-0.5 h-4 w-4 border-gray-300 data-[state=checked]:bg-[#b91c1c] data-[state=checked]:border-[#b91c1c]"
                    />
                    <label htmlFor="terms-accept" className="text-sm text-gray-600 cursor-pointer leading-relaxed">
                      By creating an account, I agree to Malta Global Crypto Bank's{" "}
                      <a
                        href="/terms-and-conditions"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="font-bold text-[#b91c1c] hover:text-[#991b1b] hover:underline"
                      >
                        Terms & Conditions
                      </a>
                    </label>
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={loading || !termsAccepted}
                      className="w-full h-12 bg-[#b91c1c] hover:bg-[#991b1b] text-white font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
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
              </>
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