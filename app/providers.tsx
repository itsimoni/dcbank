"use client";

import type React from "react";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'white',
              border: '1px solid #e5e7eb',
              borderLeft: '4px solid #b91c1c',
            },
            className: 'toast-custom',
          }}
        />
        {children}
      </LanguageProvider>
    </AuthProvider>
  );
}
