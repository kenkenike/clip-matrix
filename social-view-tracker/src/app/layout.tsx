import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/toaster";

export const metadata: Metadata = {
  title: {
    default: "Social View Tracker",
    template: "%s · Social View Tracker",
  },
  description:
    "Track and analyze publicly available YouTube and Instagram engagement metrics: views, likes, and comments over time.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-svh antialiased">
        <ThemeProvider>
          <Toaster>{children}</Toaster>
        </ThemeProvider>
      </body>
    </html>
  );
}