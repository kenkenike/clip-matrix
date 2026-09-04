import { NextResponse } from "next/server";
import { insforge } from "@/lib/insforge";

export async function POST() {
  try {
    // Seed profiles
    const profiles = [
      { id: "usr-admin-01", name: "Kaneki", handle: "kaneki", role: "admin", bio: "Platform administrator" },
      { id: "usr-creator-01", name: "Alex Rivera", handle: "alexcreates", role: "creator", bio: "Content creator & storyteller", total_views: 2450000, followers: 85000, lifetime_earnings_minor: 4250000, clips_count: 26, engagement_rate: 6.8 },
      { id: "usr-brand-01", name: "Nova Media", handle: "novamedia", role: "brand", bio: "Leading media company", industry: "Media & Entertainment", website: "https://novamedia.co", verified: true },
      { id: "usr-mod-01", name: "Sam Torres", handle: "samtorres", role: "moderator", bio: "Content moderator" },
      { id: "usr-creator-02", name: "Maya Chen", handle: "mayachen", role: "creator", bio: "Tech reviewer", total_views: 1800000, followers: 62000, clips_count: 18 },
      { id: "usr-creator-03", name: "Jordan Blake", handle: "jordanblake", role: "creator", bio: "Gaming content", total_views: 3200000, followers: 120000, clips_count: 34 },
      { id: "usr-creator-04", name: "Priya Sharma", handle: "priyasharma", role: "creator", bio: "Lifestyle & fashion", total_views: 950000, followers: 45000, clips_count: 12 },
      { id: "usr-brand-02", name: "Northbeam Labs", handle: "northbeam", role: "brand", bio: "SaaS analytics platform", industry: "SaaS", website: "https://northbeam.io", verified: true },
      { id: "usr-brand-03", name: "Cartel Studios", handle: "cartelstudios", role: "brand", bio: "Entertainment studio", industry: "Entertainment", website: "https://cartelstudios.com" },
    ];
    await insforge.database.from("profiles").upsert(profiles, { onConflict: "id" });

    // Seed campaigns
    const campaigns = [
      {
        id: "cmp-001", brand_id: "usr-brand-01", brand_name: "Nova Media", brand_initial: "N",
        name: "Nova Podcast Clip Drive", category: "Podcast", status: "ACTIVE",
        days_remaining: 24, ends_at: new Date(Date.now() + 24 * 86400000).toISOString(),
        rate_per_100k_minor: 2500, budget_minor: 50000000, spent_minor: 12500000,
        platforms: ["tiktok", "instagram", "youtube"], creator_count: 45,
        description: "Clip the best moments from Nova Podcast episodes. Focus on hot takes and viral-worthy insights.",
        long_description: "Nova Podcast is looking for creators to clip the best moments from our weekly episodes. We want hot takes, insightful commentary, and viral-worthy segments that will drive engagement across social platforms.",
        rules_summary: "Keep clips under 60 seconds. Include captions. No profanity in first 3 seconds.",
        required_hashtags: ["#NovaPodcast", "#ClipMatrix"],
        required_mentions: ["@novapodcast"],
        prohibited_content: ["No hate speech", "No misinformation", "No copyrighted music"],
        total_views: 1250000, total_clips: 89, engagement_rate: 5.2, cpm_minor: 28,
        geo_breakdown: [{ country: "US", pct: 40 }, { country: "UK", pct: 25 }, { country: "IN", pct: 20 }, { country: "CA", pct: 15 }],
        spend_history: [{ month: "Jan", amountMinor: 3000000 }, { month: "Feb", amountMinor: 4500000 }, { month: "Mar", amountMinor: 5000000 }],
        performance_series: [{ label: "Week 1", value: 250000 }, { label: "Week 2", value: 380000 }, { label: "Week 3", value: 420000 }, { label: "Week 4", value: 200000 }],
      },
      {
        id: "cmp-002", brand_id: "usr-brand-2", brand_name: "Northbeam Labs", brand_initial: "N",
        name: "Alpha Arena Trading Clips", category: "Finance", status: "ACTIVE",
        days_remaining: 18, ends_at: new Date(Date.now() + 18 * 86400000).toISOString(),
        rate_per_100k_minor: 3500, budget_minor: 75000000, spent_minor: 8000000,
        platforms: ["youtube", "tiktok"], creator_count: 32,
        description: "Create educational clips about trading strategies and market analysis.",
        required_hashtags: ["#AlphaArena", "#TradingClips"],
        total_views: 890000, total_clips: 56, engagement_rate: 4.8, cpm_minor: 38,
      },
      {
        id: "cmp-003", brand_id: "usr-brand-01", brand_name: "Nova Media", brand_initial: "N",
        name: "Lumen Sessions Highlights", category: "Music", status: "ACTIVE",
        days_remaining: 30, ends_at: new Date(Date.now() + 30 * 86400000).toISOString(),
        rate_per_100k_minor: 2000, budget_minor: 30000000, spent_minor: 5000000,
        platforms: ["instagram", "tiktok"], creator_count: 28,
        description: "Clip the best live performance moments from Lumen Sessions.",
        required_hashtags: ["#LumenSessions", "#LiveMusic"],
        total_views: 670000, total_clips: 42, engagement_rate: 7.1, cpm_minor: 22,
      },
      {
        id: "cmp-004", brand_id: "usr-brand-03", brand_name: "Cartel Studios", brand_initial: "C",
        name: "Cartel Drop 04 Launch", category: "Entertainment", status: "ENDING_SOON",
        days_remaining: 3, ends_at: new Date(Date.now() + 3 * 86400000).toISOString(),
        rate_per_100k_minor: 4000, budget_minor: 100000000, spent_minor: 85000000,
        platforms: ["tiktok", "instagram", "youtube", "x"], creator_count: 67,
        description: "Promote the Cartel Drop 04 collection launch. Create hype content.",
        required_hashtags: ["#CartelDrop04", "#Streetwear"],
        total_views: 2100000, total_clips: 134, engagement_rate: 8.5, cpm_minor: 42,
      },
      {
        id: "cmp-005", brand_id: "usr-brand-01", brand_name: "Nova Media", brand_initial: "N",
        name: "Statline Sync Dashboard", category: "SaaS", status: "DRAFT",
        days_remaining: 45, ends_at: new Date(Date.now() + 45 * 86400000).toISOString(),
        rate_per_100k_minor: 3000, budget_minor: 40000000, spent_minor: 0,
        platforms: ["youtube", "x"], creator_count: 0,
        description: "Create tutorial clips showing Statline Sync dashboard features.",
        required_hashtags: ["#StatlineSync", "#DataAnalytics"],
        total_views: 0, total_clips: 0, engagement_rate: 0, cpm_minor: 32,
      },
      {
        id: "cmp-006", brand_id: "usr-brand-02", brand_name: "Northbeam Labs", brand_initial: "N",
        name: "Ledger Lessons Financial", category: "Education", status: "ACTIVE",
        days_remaining: 21, ends_at: new Date(Date.now() + 21 * 86400000).toISOString(),
        rate_per_100k_minor: 2800, budget_minor: 60000000, spent_minor: 15000000,
        platforms: ["youtube", "tiktok", "instagram"], creator_count: 38,
        description: "Create educational clips about personal finance and accounting.",
        required_hashtags: ["#LedgerLessons", "#FinanceTips"],
        total_views: 980000, total_clips: 67, engagement_rate: 5.5, cpm_minor: 30,
      },
    ];
    await insforge.database.from("campaigns").upsert(campaigns, { onConflict: "id" });

    // Seed clips
    const clips = [
      { id: "clip-001", campaign_id: "cmp-001", campaign_name: "Nova Podcast Clip Drive", brand_name: "Nova Media", creator_id: "usr-creator-01", creator_name: "Alex Rivera", creator_handle: "alexcreates", platform: "tiktok", url: "https://tiktok.com/@alexcreates/video/001", views: 245000, likes: 18200, comments: 1340, shares: 890, status: "approved", earned_minor: 61250 },
      { id: "clip-002", campaign_id: "cmp-001", campaign_name: "Nova Podcast Clip Drive", brand_name: "Nova Media", creator_id: "usr-creator-02", creator_name: "Maya Chen", creator_handle: "mayachen", platform: "instagram", url: "https://instagram.com/reel/002", views: 189000, likes: 14500, comments: 980, shares: 670, status: "approved", earned_minor: 47250 },
      { id: "clip-003", campaign_id: "cmp-002", campaign_name: "Alpha Arena Trading Clips", brand_name: "Northbeam Labs", creator_id: "usr-creator-03", creator_name: "Jordan Blake", creator_handle: "jordanblake", platform: "youtube", url: "https://youtube.com/watch?v=003", views: 312000, likes: 22100, comments: 2100, shares: 1500, status: "approved", earned_minor: 109200 },
      { id: "clip-004", campaign_id: "cmp-003", campaign_name: "Lumen Sessions Highlights", brand_name: "Nova Media", creator_id: "usr-creator-04", creator_name: "Priya Sharma", creator_handle: "priyasharma", platform: "tiktok", url: "https://tiktok.com/@priyasharma/video/004", views: 156000, likes: 12800, comments: 780, shares: 520, status: "pending", earned_minor: 0 },
      { id: "clip-005", campaign_id: "cmp-004", campaign_name: "Cartel Drop 04 Launch", brand_name: "Cartel Studios", creator_id: "usr-creator-01", creator_name: "Alex Rivera", creator_handle: "alexcreates", platform: "instagram", url: "https://instagram.com/reel/005", views: 420000, likes: 35000, comments: 2800, shares: 2100, status: "approved", earned_minor: 168000 },
      { id: "clip-006", campaign_id: "cmp-001", campaign_name: "Nova Podcast Clip Drive", brand_name: "Nova Media", creator_id: "usr-creator-03", creator_name: "Jordan Blake", creator_handle: "jordanblake", platform: "youtube", url: "https://youtube.com/watch?v=006", views: 98000, likes: 7200, comments: 540, shares: 320, status: "under_review", earned_minor: 0 },
      { id: "clip-007", campaign_id: "cmp-006", campaign_name: "Ledger Lessons Financial", brand_name: "Northbeam Labs", creator_id: "usr-creator-02", creator_name: "Maya Chen", creator_handle: "mayachen", platform: "tiktok", url: "https://tiktok.com/@mayachen/video/007", views: 67000, likes: 5100, comments: 380, shares: 210, status: "rejected", rejection_reason: "Does not meet content guidelines", earned_minor: 0 },
      { id: "clip-008", campaign_id: "cmp-004", campaign_name: "Cartel Drop 04 Launch", brand_name: "Cartel Studios", creator_id: "usr-creator-04", creator_name: "Priya Sharma", creator_handle: "priyasharma", platform: "x", url: "https://x.com/priyasharma/status/008", views: 89000, likes: 6300, comments: 420, shares: 280, status: "flagged", earned_minor: 0 },
    ];
    await insforge.database.from("clips").upsert(clips, { onConflict: "id" });

    // Seed social accounts
    const socialAccounts = [
      { id: "sa-001", user_id: "usr-creator-01", platform: "tiktok", username: "alexcreates", followers: 85000, status: "verified", connected_at: new Date().toISOString() },
      { id: "sa-002", user_id: "usr-creator-01", platform: "instagram", username: "alexcreates", followers: 62000, status: "verified", connected_at: new Date().toISOString() },
      { id: "sa-003", user_id: "usr-creator-01", platform: "youtube", username: "Alex Rivera", followers: 45000, status: "verified", connected_at: new Date().toISOString() },
      { id: "sa-004", user_id: "usr-creator-01", platform: "x", username: "alexcreates", followers: 28000, status: "not_connected" },
    ];
    await insforge.database.from("social_accounts").upsert(socialAccounts, { onConflict: "id" });

    // Seed earnings
    const earnings = [
      { id: "earn-001", user_id: "usr-creator-01", campaign_id: "cmp-001", campaign_name: "Nova Podcast Clip Drive", views: 245000, amount_minor: 61250, status: "completed", method: "bank_transfer" },
      { id: "earn-002", user_id: "usr-creator-01", campaign_id: "cmp-004", campaign_name: "Cartel Drop 04 Launch", views: 420000, amount_minor: 168000, status: "completed", method: "bank_transfer" },
      { id: "earn-003", user_id: "usr-creator-02", campaign_id: "cmp-001", campaign_name: "Nova Podcast Clip Drive", views: 189000, amount_minor: 47250, status: "pending", method: "upi" },
      { id: "earn-004", user_id: "usr-creator-03", campaign_id: "cmp-002", campaign_name: "Alpha Arena Trading Clips", views: 312000, amount_minor: 109200, status: "completed", method: "bank_transfer" },
    ];
    await insforge.database.from("earnings").upsert(earnings, { onConflict: "id" });

    // Seed payout methods
    const payoutMethods = [
      { id: "pm-001", user_id: "usr-creator-01", kind: "bank_transfer", label: "HDFC Bank", identifier: "****4521", is_default: true },
      { id: "pm-002", user_id: "usr-creator-01", kind: "upi", label: "Google Pay", identifier: "alex@upi", is_default: false },
    ];
    await insforge.database.from("payout_methods").upsert(payoutMethods, { onConflict: "id" });

    // Seed transactions
    const transactions = [
      { id: "tx-001", user_id: "usr-creator-01", description: "Earning from Nova Podcast Clip Drive", kind: "earning", amount_minor: 61250, status: "completed", method: "bank_transfer" },
      { id: "tx-002", user_id: "usr-creator-01", description: "Earning from Cartel Drop 04 Launch", kind: "earning", amount_minor: 168000, status: "completed", method: "bank_transfer" },
      { id: "tx-003", user_id: "usr-creator-01", description: "Withdrawal to HDFC Bank", kind: "withdrawal", amount_minor: -100000, status: "completed", method: "bank_transfer" },
    ];
    await insforge.database.from("transactions").upsert(transactions, { onConflict: "id" });

    return NextResponse.json({ success: true, message: "Database seeded successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
