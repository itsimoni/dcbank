import type React from "react";
import type { Metadata } from "next";
import "./globals.css";
import LayoutDebugger from "@/components/dev/layout-debugger";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Malta Global Crypto Bank",
  description: "Malta Global Crypto Bank",
  generator: "Malta Global Crypto Bank",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/logo-optimized.png" as="image" fetchPriority="high" />
      </head>
      <body>
        <Providers>
          <LayoutDebugger />
          {children}
        </Providers>
      </body>
    </html>
  );
}
