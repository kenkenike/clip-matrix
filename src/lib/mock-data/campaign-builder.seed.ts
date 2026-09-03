import type { Campaign } from "@/lib/services/types";
import type { CampaignSeedInput } from "@/lib/mock-data/campaign-types.seed";
import { campaignSeedsA } from "@/lib/mock-data/campaign-list-a.seed";
import { campaignSeedsB } from "@/lib/mock-data/campaign-list-b.seed";

const DEFAULT_REQUIREMENTS = [
  "Use the official campaign assets provided in your dashboard",
  "Vertical format between 21 and 90 seconds",
  "Post from a public account and keep the clip live for at least 30 days",
];

function slugTag(name: string): string {
  return `#${name.replace(/[^a-zA-Z0-9]/g, "")}`;
}

function brandMention(brandName: string): string {
  return `@${brandName.toLowerCase().replace(/[^a-z]/g, "")}`;
}

export function buildCampaign(seed: CampaignSeedInput): Campaign {
  const minViews = 10_000;
  const spentMinor = Math.round(seed.budgetMinor * seed.spentPct);
  return {
    id: seed.id,
    brandId: seed.brandId,
    brandName: seed.brandName,
    brandInitial: seed.brandName[0]?.toUpperCase() ?? "?",
    name: seed.name,
    category: seed.category,
    status: seed.status,
    daysRemaining: seed.daysRemaining,
    endsAt: seed.endsAt,
    ratePer100kMinor: seed.ratePer100kMinor,
    budgetMinor: seed.budgetMinor,
    spentMinor,
    maxPayoutMinor: Math.round(seed.budgetMinor * 0.15),
    minViews,
    platforms: seed.platforms,
    creatorCount: seed.creatorCount,
    description: seed.description,
    longDescription: `${seed.description} ${seed.brandName} reviews every submission against the campaign rules and releases payouts on verified views. The better your clips perform, the more of the remaining budget flows your way.`,
    rulesSummary: seed.rulesSummary,
    contentRequirements: DEFAULT_REQUIREMENTS,
    prohibitedContent: [
      "Misleading edits or out-of-context cuts",
      "Profanity in the first three seconds",
      "Third-party music not supplied by the brand",
      "Political, sexual, or violent content of any kind",
    ],
    creatorRequirements: [
      "Public account with at least 1,000 followers",
      "Account in good standing with no active platform strikes",
      `Clips must reach ${minViews / 1000}K+ verified views to qualify`,
    ],
    requiredHashtags: [slugTag(seed.name), "#clipmatrixpartner"],
    requiredMentions: [brandMention(seed.brandName)],
    requiredPhrases: [],
    totalViews: Math.round(spentMinor / 4),
    totalClips: Math.round(seed.creatorCount * 2.7),
    engagementRate: Math.round((6.1 + (seed.ratePer100kMinor % 17) / 10) * 10) / 10,
    cpmMinor: Math.max(20, Math.round(seed.ratePer100kMinor / 90)),
    exampleClips: [
      {
        id: `${seed.id}-ex1`,
        title: `${seed.name} cut one`,
        views: 842_000,
        platform: seed.platforms[0],
      },
      {
        id: `${seed.id}-ex2`,
        title: `${seed.name} cut two`,
        views: 128_400,
        platform: seed.platforms[1] ?? seed.platforms[0],
      },
      {
        id: `${seed.id}-ex3`,
        title: `${seed.name} cut three`,
        views: 2_410_000,
        platform: seed.platforms[0],
      },
    ],
    faqs: [
      {
        question: "When do I get paid for this campaign?",
        answer:
          "Earnings unlock as soon as your clip clears verification and reaches the minimum view threshold. Payouts run weekly once your balance passes fifty dollars.",
      },
      {
        question: "Can I post more than one clip?",
        answer:
          "Yes. Every qualifying clip earns independently, so volume plus quality is rewarded. Each submission is reviewed against the same rules.",
      },
      {
        question: "What happens if my clip goes viral?",
        answer:
          "You keep earning at the campaign rate on every verified view up to the per-clip maximum payout. Viral moments are exactly what brands here pay for.",
      },
    ],
    geoBreakdown: [
      { country: "United States", pct: 38 },
      { country: "United Kingdom", pct: 12 },
      { country: "Germany", pct: 9 },
      { country: "Canada", pct: 7 },
      { country: "Australia", pct: 5 },
    ],
    spendHistory: [
      { month: "May", amountMinor: Math.round(spentMinor * 0.12) },
      { month: "Jun", amountMinor: Math.round(spentMinor * 0.24) },
      { month: "Jul", amountMinor: Math.round(spentMinor * 0.33) },
      { month: "Aug", amountMinor: Math.round(spentMinor * 0.31) },
    ],
    performanceSeries: [
      { label: "W1", value: Math.round(spentMinor / 40) },
      { label: "W2", value: Math.round(spentMinor / 26) },
      { label: "W3", value: Math.round(spentMinor / 18) },
      { label: "W4", value: Math.round(spentMinor / 12) },
      { label: "W5", value: Math.round(spentMinor / 9) },
      { label: "W6", value: Math.round(spentMinor / 7) },
    ],
    createdAt: "2026-05-02T09:00:00Z",
  };
}

export const campaignsSeed: Campaign[] = [...campaignSeedsA, ...campaignSeedsB].map(buildCampaign);
