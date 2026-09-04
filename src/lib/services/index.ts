import { InsforgeCampaignService } from "@/lib/services/insforge/campaigns";
import { InsforgeCreatorService } from "@/lib/services/insforge/creators";
import { InsforgeBrandService } from "@/lib/services/insforge/brands";
import { InsforgeAnalyticsService } from "@/lib/services/insforge/analytics";
import { InsforgePaymentService } from "@/lib/services/insforge/payments";
import { MockSocialPlatformService } from "@/lib/services/insforge/social";
import { InsforgeAdminService } from "@/lib/services/insforge/admin";
import { MockAuthService } from "@/lib/services/auth";
import type {
  AdminService,
  AnalyticsService,
  BrandService,
  CampaignService,
  CreatorService,
  PaymentService,
  SocialPlatformService,
} from "@/lib/services/types";

export const campaignService: CampaignService = new InsforgeCampaignService();
export const creatorService: CreatorService = new InsforgeCreatorService();
export const brandService: BrandService = new InsforgeBrandService();
export const analyticsService: AnalyticsService = new InsforgeAnalyticsService();
export const paymentService: PaymentService = new InsforgePaymentService();
export const socialPlatformService: SocialPlatformService = new MockSocialPlatformService();
export const adminService: AdminService = new InsforgeAdminService();
export const authService = new MockAuthService();
