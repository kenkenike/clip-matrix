import type {
  Campaign,
  CampaignCategory,
  CampaignStatus,
  SocialPlatformName,
} from "@/lib/services/types";

export interface CampaignSeedInput {
  id: string;
  brandId: string;
  brandName: string;
  name: string;
  category: CampaignCategory;
  status: CampaignStatus;
  daysRemaining: number;
  endsAt: string;
  ratePer100kMinor: number;
  budgetMinor: number;
  spentPct: number;
  platforms: SocialPlatformName[];
  creatorCount: number;
  description: string;
  rulesSummary: string;
}

export type { Campaign };
