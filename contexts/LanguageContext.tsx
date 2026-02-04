"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Language } from "@/lib/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // default first (safe on server/client)
  const [language, setLanguageState] = useState<Language>("en");

  // load from localStorage only on client after mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("app_language") as Language | null;
      if (saved) setLanguageState(saved);
    } catch {
      // ignore if storage unavailable
    }
  }, []);

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    try {
      localStorage.setItem("app_language", newLanguage);
    } catch {
      // ignore
    }
  };

  // optional: keep in sync if language changes elsewhere
  useEffect(() => {
    try {
      localStorage.setItem("app_language", language);
    } catch {
      // ignore
    }
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within a LanguageProvider");
  return context;
}
