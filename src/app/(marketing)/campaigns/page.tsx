import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/page-hero";
import { Section } from "@/components/marketing/section";
import { CampaignBrowser } from "@/components/marketing/campaign-browser";

export const metadata: Metadata = {
  title: "Campaigns",
  description:
    "Browse live clipping campaigns on Clip Matrix. Transparent rates, clear rules, and weekly payouts on verified views across every major platform.",
};

export default function CampaignsPage() {
  return (
    <>
      <PageHero
        eyebrow="Marketplace"
        title="Live Campaigns."
        copy="Every brief lists its rate, minimum views, allowed platforms, and rules upfront. Join one and start clipping today."
      />
      <Section>
        <CampaignBrowser />
      </Section>
    </>
  );
}
