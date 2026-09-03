import type { Metadata, Viewport } from "next";
import { Inter, EB_Garamond, Geist_Mono } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import { AmbientBackground } from "@/components/ui/ambient-background";
import { brand } from "@/lib/brand";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const garamond = EB_Garamond({
  variable: "--font-garamond",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${brand.name} | ${brand.tagline}`,
    template: `%s | ${brand.name}`,
  },
  description: brand.description,
  metadataBase: new URL(`https://${brand.domain}`),
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${garamond.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background font-body text-fg">
        <AmbientBackground />
        <div className="relative z-10 flex min-h-full flex-1 flex-col">
          <ToastProvider>{children}</ToastProvider>
        </div>
      </body>
    </html>
  );
}
