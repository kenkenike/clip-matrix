export type Role = "creator" | "brand" | "admin" | "moderator";

export type SocialPlatformName = "tiktok" | "instagram" | "youtube" | "x";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface CreatorProfile {
  id: string;
  userId: string;
  displayName: string;
  handle: string;
  totalViews: number;
  followers: number;
  lifetimeEarningsMinor: number;
  clipsCount: number;
  engagementRate: number;
  joinedAt: string;
}

export interface BrandProfile {
  id: string;
  userId: string;
  name: string;
  industry: string;
  website: string;
  description: string;
  verified: boolean;
}

export type SocialAccountStatus =
  | "not_connected"
  | "connecting"
  | "verified"
  | "disconnected";

export interface SocialAccount {
  id: string;
  platform: SocialPlatformName;
  username: string | null;
  followers: number;
  connectedAt: string | null;
  status: SocialAccountStatus;
}

export type CampaignStatus = "ACTIVE" | "ENDING_SOON" | "DRAFT" | "PAUSED" | "COMPLETED";

export interface Campaign {
  id: string;
  brandId: string;
  brandName: string;
  brandInitial: string;
  name: string;
  category: CampaignCategory;
  status: CampaignStatus;
  daysRemaining: number;
  endsAt: string;
  ratePer100kMinor: number;
  budgetMinor: number;
  spentMinor: number;
  maxPayoutMinor: number;
  minViews: number;
  platforms: SocialPlatformName[];
  creatorCount: number;
  description: string;
  longDescription: string;
  rulesSummary: string;
  contentRequirements: string[];
  prohibitedContent: string[];
  creatorRequirements: string[];
  requiredHashtags: string[];
  requiredMentions: string[];
  requiredPhrases: string[];
  totalViews: number;
  totalClips: number;
  engagementRate: number;
  cpmMinor: number;
  exampleClips: ExampleClip[];
  faqs: { question: string; answer: string }[];
  geoBreakdown: GeoEntry[];
  spendHistory: SpendEntry[];
  performanceSeries: TimeSeriesPoint[];
  createdAt: string;
  coverUrl?: string;
}

export type CampaignCategory =
  | "Podcast"
  | "Gaming"
  | "Music"
  | "SaaS"
  | "Ecommerce"
  | "Finance"
  | "Education"
  | "Entertainment";

export interface ExampleClip {
  id: string;
  title: string;
  views: number;
  platform: SocialPlatformName;
}

export interface CampaignRules {
  campaignId: string;
  allowedPlatforms: SocialPlatformName[];
  requiredPhrases: string[];
  requiredHashtags: string[];
  requiredMentions: string[];
  minCreatorFollowers: number;
  minViews: number;
  forbiddenContent: string[];
  submissionWindowDays: number;
}

export type ClipStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "rejected"
  | "flagged"
  | "paid";

export interface Clip {
  id: string;
  title?: string;
  campaignId: string;
  campaignName: string;
  brandName: string;
  creatorId: string;
  creatorName: string;
  creatorHandle: string;
  platform: SocialPlatformName;
  url: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  postedAt: string;
  submittedAt: string;
  status: ClipStatus;
  earnedMinor: number;
  rejectionReason?: string;
  fraudScore?: FraudAssessment;
}

export interface DetectedPostMetrics {
  platform: SocialPlatformName;
  accountHandle: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  postedAt: string;
}

export interface EarningsEntry {
  id: string;
  date: string;
  campaignId: string;
  campaignName: string;
  views: number;
  amountMinor: number;
  status: "Paid" | "Pending" | "Processing" | "Rejected";
  method: PayoutMethodKind;
}

export interface Balances {
  availableMinor: number;
  pendingMinor: number;
  lifetimeMinor: number;
  thisMonthMinor: number;
  nextPayoutDate: string;
  minimumWithdrawalMinor: number;
}

export type PayoutMethodKind = "bank" | "upi";

export interface PayoutMethod {
  id: string;
  kind: PayoutMethodKind;
  label: string;
  maskedIdentifier: string;
  isDefault: boolean;
  addedAt: string;
}

export type TransactionStatus = "paid" | "pending" | "processing" | "rejected" | "flagged";

export interface Transaction {
  id: string;
  date: string;
  description: string;
  kind: "earning" | "payout" | "adjustment";
  amountMinor: number;
  status: TransactionStatus;
  method: PayoutMethodKind;
  reference: string;
}

export type FraudLevel = "LOW" | "MEDIUM" | "HIGH";

export interface FraudAssessment {
  score: number;
  level: FraudLevel;
  signals: FraudSignal[];
  note: string;
}

export type FraudSignal =
  | "view_velocity"
  | "engagement_velocity"
  | "follower_view_ratio"
  | "duplicate_content"
  | "bot_like_engagement"
  | "platform_api_verification";

export interface ModerationReview {
  id: string;
  clipId: string;
  reviewer: string;
  action: "approve" | "reject" | "flag" | "request_changes";
  notes: string;
  reviewedAt: string;
}

export interface PlatformSplitEntry {
  platform: SocialPlatformName;
  pct: number;
}

export interface GeoEntry {
  country: string;
  pct: number;
}

export interface SpendEntry {
  month: string;
  amountMinor: number;
}

export interface TimeSeriesPoint {
  label: string;
  value: number;
  secondary?: number;
}

export type AnalyticsRange = "7D" | "30D" | "90D" | "ALL";

export type BrandChartMetric = "views" | "engagement" | "spend" | "creators";

export interface CreatorOverview {
  displayName: string;
  metrics: {
    totalViews: number;
    totalEarningsMinor: number;
    activeCampaigns: number;
    pendingEarningsMinor: number;
  };
  earningsSeries: Record<AnalyticsRange, TimeSeriesPoint[]>;
  recentClips: Clip[];
  recentEarnings: EarningsEntry[];
}

export interface LeaderboardEntry {
  rank: number;
  creatorId: string;
  displayName: string;
  handle: string;
  views: number;
  engagementRate: number;
  clipsCount: number;
  earnedMinor: number;
}

export interface BrandOverview {
  brandName: string;
  metrics: {
    activeCampaigns: number;
    totalSpendMinor: number;
    totalViews: number;
    creators: number;
    engagementRate: number;
    avgCpmMinor: number;
  };
  campaignPerformance: TimeSeriesPoint[];
  recentSubmissions: Clip[];
  platformSplit: PlatformSplitEntry[];
  topCreators: LeaderboardEntry[];
}

export interface AdminOverview {
  totalUsers: number;
  activeCreators: number;
  brands: number;
  activeCampaigns: number;
  viewsTracked: number;
  gmvMinor: number;
  platformRevenueMinor: number;
  pendingPayoutsMinor: number;
  flaggedSubmissions: number;
}

export interface SubmissionFilter {
  search?: string;
  status?: ClipStatus | "all";
  campaignId?: string;
}

export interface CampaignFilter {
  search?: string;
  category?: CampaignCategory | "all";
  platform?: SocialPlatformName | "all";
  status?: CampaignStatus | "all";
  minRatePer100kMinor?: number;
  minViews?: number;
  sort?: "rate_desc" | "newest" | "ending_soon" | "popular";
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
}

export interface CampaignService {
  listCampaigns(filter?: CampaignFilter): Promise<Campaign[]>;
  getCampaign(id: string): Promise<Campaign | null>;
  getRules(campaignId: string): Promise<CampaignRules | null>;
  joinCampaign(campaignId: string): Promise<void>;
  createCampaign(input: NewCampaignInput): Promise<Campaign>;
  updateCampaign(id: string, input: UpdateCampaignInput): Promise<Campaign>;
  updateStatus(campaignId: string, status: CampaignStatus): Promise<void>;
  deleteCampaign(campaignId: string): Promise<void>;
  increaseBudget(campaignId: string, amountMinor: number): Promise<Campaign>;
}

export interface NewCampaignInput {
  name: string;
  category: CampaignCategory;
  description: string;
  durationDays: number;
  platforms: SocialPlatformName[];
  requiredPhrases: string[];
  requiredHashtags: string[];
  requiredMentions: string[];
  minCreatorFollowers: number;
  forbiddenContent: string;
  budgetMinor: number;
  ratePer1kMinor: number;
  ratePer100kMinor: number;
  maxPayoutMinor: number;
  minViews: number;
}

export interface UpdateCampaignInput {
  name?: string;
  category?: CampaignCategory;
  description?: string;
  longDescription?: string;
  platforms?: SocialPlatformName[];
  requiredPhrases?: string[];
  requiredHashtags?: string[];
  requiredMentions?: string[];
  forbiddenContent?: string;
  budgetMinor?: number;
  ratePer100kMinor?: number;
  maxPayoutMinor?: number;
  minViews?: number;
  coverUrl?: string;
  status?: CampaignStatus;
}

export interface CreatorService {
  getCurrentCreator(): Promise<CreatorProfile>;
  getOverview(): Promise<CreatorOverview>;
  getSocialAccounts(): Promise<SocialAccount[]>;
  setAccountStatus(platform: SocialPlatformName, status: SocialAccountStatus): Promise<SocialAccount>;
  getLeaderboard(campaignId: string): Promise<LeaderboardEntry[]>;
  listMyClips(): Promise<Clip[]>;
  submitClip(input: SubmitClipInput): Promise<Clip>;
  getNotifications(): Promise<NotificationItem[]>;
}

export interface SubmitClipInput {
  campaignId: string;
  platform: SocialPlatformName;
  url: string;
}

export interface BrandService {
  getBrand(): Promise<BrandProfile>;
  getOverview(): Promise<BrandOverview>;
  listBrandCampaigns(): Promise<Campaign[]>;
  getCampaignDetail(id: string): Promise<Campaign | null>;
  listCreators(search?: string): Promise<CreatorProfile[]>;
  launchCampaign(input: NewCampaignInput): Promise<Campaign>;
}

export interface AnalyticsService {
  getNetworkMetrics(): Promise<NetworkMetrics>;
  getCreatorEarningsSeries(range: AnalyticsRange): Promise<TimeSeriesPoint[]>;
  getBrandTimeSeries(metric: BrandChartMetric, range: AnalyticsRange): Promise<TimeSeriesPoint[]>;
  getPlatformSplit(): Promise<PlatformSplitEntry[]>;
  getGeoBreakdown(range?: AnalyticsRange): Promise<GeoEntry[]>;
  getCampaignPerformance(range: AnalyticsRange): Promise<TimeSeriesPoint[]>;
}

export interface NetworkMetrics {
  creatorEarningsMinor: number;
  creators: number;
  campaigns: number;
  viewsTracked: number;
  avgEngagementPct: number;
}

export interface PaymentService {
  getBalances(): Promise<Balances>;
  listTransactions(): Promise<Transaction[]>;
  listPayoutMethods(): Promise<PayoutMethod[]>;
  savePayoutDetails(
    id: string,
    fields: Record<string, string>
  ): Promise<PayoutMethod>;
  setDefaultPayoutMethod(id: string): Promise<void>;
  withdraw(amountMinor: number): Promise<void>;
  listEarnings(): Promise<EarningsEntry[]>;
}

export interface SocialPlatformService {
  listSupported(): Promise<
    { platform: SocialPlatformName; label: string; connected: boolean }[]
  >;
  detectPost(url: string, platform: SocialPlatformName): Promise<DetectedPostMetrics>;
  validateUrl(url: string, platform: SocialPlatformName): Promise<boolean>;
}

export interface AdminService {
  getOverview(): Promise<AdminOverview>;
  getGmvSeries(): Promise<TimeSeriesPoint[]>;
  listSubmissions(filter?: SubmissionFilter): Promise<Clip[]>;
  reviewSubmission(
    clipId: string,
    action: ModerationReview["action"],
    notes: string,
    rejectionReason?: string
  ): Promise<void>;
  listFraudQueue(): Promise<Clip[]>;
  updateFraudNote(clipId: string, note: string): Promise<void>;
  listUsers(search?: string): Promise<AdminUserRow[]>;
  listRecentSignups(limit?: number): Promise<AdminUserRow[]>;
  getUser(id: string): Promise<AdminUserRow>;
  getUserCampaigns(id: string): Promise<string[]>;
  banUser(id: string): Promise<void>;
  kickUser(id: string): Promise<void>;
  listPayments(): Promise<Transaction[]>;
  listPayouts(): Promise<AdminPayout[]>;
  releasePayout(id: string): Promise<void>;
  listCampaigns(search?: string): Promise<Campaign[]>;
  getCampaign(id: string): Promise<Campaign | null>;
  createCampaign(input: NewCampaignInput): Promise<Campaign>;
  updateCampaign(id: string, input: UpdateCampaignInput): Promise<Campaign>;
  deleteCampaign(campaignId: string): Promise<void>;
  updateCampaignStatus(campaignId: string, status: CampaignStatus): Promise<void>;
}

export type AdminRole = "creator" | "brand" | "moderator" | "admin";

export interface AdminUserRow {
  id: string;
  name: string;
  handle: string;
  role: AdminRole;
  email: string;
  status: "active" | "suspended" | "pending" | "banned";
  joinedAt: string;
  lifetimeValueMinor: number;
}

export interface AdminPayout {
  id: string;
  creatorName: string;
  method: PayoutMethodKind;
  paymentDetail: string;
  amountMinor: number;
  requestedAt: string;
  status: TransactionStatus;
}
