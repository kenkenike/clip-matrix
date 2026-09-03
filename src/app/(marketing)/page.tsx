import type { Metadata } from "next";
import { Hero } from "@/components/home/hero";
import { LogoStrip } from "@/components/home/logo-strip";
import { MetricsBand } from "@/components/home/metrics-band";
import { HowItWorks } from "@/components/home/how-it-works";
import { LiveCampaigns } from "@/components/home/live-campaigns";
import { EarningsPreview } from "@/components/home/earnings-preview";
import { BrandAnalyticsPreview } from "@/components/home/brand-analytics-preview";
import { Comparison } from "@/components/home/comparison";
import { DualCta } from "@/components/home/dual-cta";
import { FaqSection } from "@/components/home/faq-section";

export const metadata: Metadata = {
  title: {
    absolute: "Clip Matrix - Turn Content Into Distribution",
  },
  description:
    "Clip Matrix connects brands with short-form creators. Launch performance campaigns and pay only for verified views across TikTok, Reels, Shorts, and X.",
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <LogoStrip />
      <MetricsBand />
      <HowItWorks />
      <LiveCampaigns />
      <EarningsPreview />
      <BrandAnalyticsPreview />
      <Comparison />
      <DualCta />
      <FaqSection />
    </>
  );
}
