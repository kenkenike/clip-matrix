import type { ReactNode } from "react";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { ClientProviders } from "@/components/auth/client-providers";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <ClientProviders>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </ClientProviders>
  );
}
