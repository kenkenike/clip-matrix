import { MockCampaignService } from "@/lib/services/mock/campaigns.mock";
import { MockCreatorService } from "@/lib/services/mock/creators.mock";
import { MockBrandService } from "@/lib/services/mock/brands.mock";
import { MockAnalyticsService } from "@/lib/services/mock/analytics.mock";
import { MockPaymentService } from "@/lib/services/mock/payments.mock";
import { MockSocialPlatformService } from "@/lib/services/mock/social.mock";
import { MockAdminService } from "@/lib/services/mock/admin.mock";
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

export const campaignService: CampaignService = new MockCampaignService();
export const creatorService: CreatorService = new MockCreatorService();
export const brandService: BrandService = new MockBrandService();
export const analyticsService: AnalyticsService = new MockAnalyticsService();
export const paymentService: PaymentService = new MockPaymentService();
export const socialPlatformService: SocialPlatformService = new MockSocialPlatformService();
export const adminService: AdminService = new MockAdminService();
export const authService = new MockAuthService();
