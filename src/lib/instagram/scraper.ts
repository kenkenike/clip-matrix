import type { InstagramInsightResult, InstagramContentType, ScrapeError } from "./types";
import { IG_APP_ID, USER_AGENTS } from "./types";
import { parseInstagramUrl, getWebProfileInfoUrl, getMediaInfoUrl } from "./url-parser";
import { getCached, setCache } from "./cache";
import { createJob, completeJob, failJob, rateLimitJob, updateJob } from "./jobs";

let uaIndex = 0;
function nextUA(): string {
  const ua = USER_AGENTS[uaIndex % USER_AGENTS.length];
  uaIndex++;
  return ua;
}

function buildHeaders(): Record<string, string> {
  return {
    "User-Agent": nextUA(),
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "X-IG-App-ID": IG_APP_ID,
    "X-Requested-With": "XMLHttpRequest",
    "Referer": "https://www.instagram.com/",
    "Origin": "https://www.instagram.com",
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Tier 1: Lightweight HTTP ──────────────────────────────────────────

async function fetchProfileHTTP(username: string): Promise<InstagramInsightResult | ScrapeError> {
  const url = getWebProfileInfoUrl(username);
  try {
    const res = await fetch(url, { headers: buildHeaders(), redirect: "follow" });
    if (res.status === 401 || res.status === 403) {
      return { kind: "rate_limited", message: `HTTP ${res.status} — login required or blocked` };
    }
    if (res.status === 404) {
      return { kind: "deleted", message: "Profile not found (404)" };
    }
    if (!res.ok) {
      return { kind: "unknown", message: `HTTP ${res.status}` };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json: any = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user: Record<string, any> | undefined = json?.data?.user ?? json?.user;
    if (!user) return { kind: "unknown", message: "No user data in response" };

    const edgeFollowedBy = user.edge_followed_by as { count?: number } | undefined;
    const edgeFollow = user.edge_follow as { count?: number } | undefined;
    const edgeOwnerToTimelineMedia = user.edge_owner_to_timeline_media as { count?: number } | undefined;

    return {
      type: "profile",
      url: `https://www.instagram.com/${username}/`,
      caption: null,
      timestamp: null,
      likes: null,
      comments: null,
      views: null,
      engagementRate: null,
      followers: edgeFollowedBy?.count ?? null,
      following: edgeFollow?.count ?? null,
      postsCount: edgeOwnerToTimelineMedia?.count ?? null,
      username: (user.username as string) ?? username,
      fullName: (user.full_name as string) ?? null,
      isPrivate: (user.is_private as boolean) ?? false,
      scrapedAt: new Date().toISOString(),
    };
  } catch (err) {
    return { kind: "unknown", message: `HTTP fetch failed: ${String(err)}` };
  }
}

async function fetchMediaHTTP(shortcode: string): Promise<InstagramInsightResult | ScrapeError> {
  const url = getMediaInfoUrl(shortcode);
  try {
    const res = await fetch(url, { headers: buildHeaders(), redirect: "follow" });
    if (res.status === 401 || res.status === 403) {
      return { kind: "rate_limited", message: `HTTP ${res.status} — login required or blocked` };
    }
    if (res.status === 404) {
      return { kind: "deleted", message: "Media not found (404)" };
    }
    if (!res.ok) {
      return { kind: "unknown", message: `HTTP ${res.status}` };
    }
    const json = await res.json() as Record<string, unknown>;
    const items = json?.items as unknown[] | undefined;
    const item = items?.[0] as Record<string, unknown> | undefined;
    if (!item) return { kind: "unknown", message: "No media data in response" };

    const mediaType = item.media_type as number | undefined;
    const likeCount = item.like_count as number | undefined;
    const commentCount = item.comment_count as number | undefined;
    const playCount = item.play_count as number | undefined;
    const captionObj = item.caption as { text?: string } | undefined;
    const takenAt = item.taken_at as number | undefined;
    const user = item.user as { username?: string; full_name?: string } | undefined;
    const productType = item.product_type as string | undefined;

    let type: InstagramContentType = "post";
    if (mediaType === 2 || productType === "clips") {
      type = "reel";
    }

    const views = playCount ?? (mediaType === 2 ? (item.view_count as number ?? null) : null);

    let engagementRate: number | null = null;
    if (likeCount != null && commentCount != null && views != null && views > 0) {
      engagementRate = Number((((likeCount + commentCount) / views) * 100).toFixed(2));
    }

    return {
      type,
      url: `https://www.instagram.com/p/${shortcode}/`,
      caption: (captionObj?.text as string) ?? null,
      timestamp: takenAt ? new Date(takenAt * 1000).toISOString() : null,
      likes: likeCount ?? null,
      comments: commentCount ?? null,
      views,
      engagementRate,
      followers: null,
      following: null,
      postsCount: null,
      username: user?.username ?? null,
      fullName: user?.full_name ?? null,
      isPrivate: false,
      scrapedAt: new Date().toISOString(),
    };
  } catch (err) {
    return { kind: "unknown", message: `HTTP fetch failed: ${String(err)}` };
  }
}

// ── Tier 2: Playwright headless browser ───────────────────────────────

async function fetchViaPlaywright(targetUrl: string, type: InstagramContentType): Promise<InstagramInsightResult | ScrapeError> {
  let browser;
  try {
    const { chromium } = await import("playwright");
    browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const context = await browser.newContext({
      userAgent: nextUA(),
      viewport: { width: 1920, height: 1080 },
      locale: "en-US",
    });
    const page = await context.newPage();

    let capturedData: Record<string, unknown> | null = null;

    page.on("response", async (response) => {
      const url = response.url();
      if (url.includes("/api/v1/media/info/") || url.includes("/api/v1/users/web_profile_info/")) {
        try {
          const json = await response.json();
          capturedData = json;
        } catch { /* ignore non-JSON */ }
      }
    });

    await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 30000 });
    await sleep(2000);

    if (capturedData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = capturedData;
      if (type === "profile") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const user: Record<string, any> | undefined = data?.data?.user ?? data?.user;
        if (user) {
          const edgeFollowedBy = user.edge_followed_by as { count?: number } | undefined;
          const edgeFollow = user.edge_follow as { count?: number } | undefined;
          const edgeOwnerToTimelineMedia = user.edge_owner_to_timeline_media as { count?: number } | undefined;
          return {
            type: "profile",
            url: targetUrl,
            caption: null,
            timestamp: null,
            likes: null,
            comments: null,
            views: null,
            engagementRate: null,
            followers: edgeFollowedBy?.count ?? null,
            following: edgeFollow?.count ?? null,
            postsCount: edgeOwnerToTimelineMedia?.count ?? null,
            username: (user.username as string) ?? null,
            fullName: (user.full_name as string) ?? null,
            isPrivate: (user.is_private as boolean) ?? false,
            scrapedAt: new Date().toISOString(),
          };
        }
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items: any[] | undefined = data?.items;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const item: Record<string, any> | undefined = items?.[0];
        if (item) {
          const likeCount = item.like_count as number | undefined;
          const commentCount = item.comment_count as number | undefined;
          const playCount = item.play_count as number | undefined;
          const captionObj = item.caption as { text?: string } | undefined;
          const takenAt = item.taken_at as number | undefined;
          const user = item.user as { username?: string; full_name?: string } | undefined;
          const productType = item.product_type as string | undefined;
          const mediaType = item.media_type as number | undefined;
          const resolvedType: InstagramContentType = (mediaType === 2 || productType === "clips") ? "reel" : "post";
          const views = playCount ?? (mediaType === 2 ? (item.view_count as number ?? null) : null);
          let engagementRate: number | null = null;
          if (likeCount != null && commentCount != null && views != null && views > 0) {
            engagementRate = Number((((likeCount + commentCount) / views) * 100).toFixed(2));
          }
          return {
            type: resolvedType,
            url: targetUrl,
            caption: (captionObj?.text as string) ?? null,
            timestamp: takenAt ? new Date(takenAt * 1000).toISOString() : null,
            likes: likeCount ?? null,
            comments: commentCount ?? null,
            views,
            engagementRate,
            followers: null,
            following: null,
            postsCount: null,
            username: user?.username ?? null,
            fullName: user?.full_name ?? null,
            isPrivate: false,
            scrapedAt: new Date().toISOString(),
          };
        }
      }
    }

    // Fallback: try to extract from page HTML (LD+JSON or meta tags)
    const html = await page.content();
    const ldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (ldMatch) {
      try {
        const ld = JSON.parse(ldMatch[1]) as Record<string, unknown>;
        if (type === "profile") {
          return {
            type: "profile",
            url: targetUrl,
            caption: null,
            timestamp: null,
            likes: null,
            comments: null,
            views: null,
            engagementRate: null,
            followers: null,
            following: null,
            postsCount: null,
            username: null,
            fullName: (ld.name as string) ?? null,
            isPrivate: false,
            scrapedAt: new Date().toISOString(),
          };
        }
      } catch { /* ignore parse errors */ }
    }

    return { kind: "unknown", message: "Playwright could not extract data from page" };
  } catch (err) {
    return { kind: "unknown", message: `Playwright error: ${String(err)}` };
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

// ── Main scrape orchestrator ──────────────────────────────────────────

const MAX_ATTEMPTS = 2;
const BACKOFF_BASE_MS = 3000;

export async function startScrape(url: string): Promise<string> {
  const parsed = parseInstagramUrl(url);
  if (!parsed.valid || !parsed.type) {
    const job = createJob(url);
    failJob(job.id, parsed.error ?? "Invalid URL");
    return job.id;
  }

  const cached = getCached(url);
  if (cached) {
    const job = createJob(url);
    completeJob(job.id, cached);
    return job.id;
  }

  const job = createJob(url);
  processScrape(job.id, parsed.type, parsed.username, parsed.shortcode).catch(() => {});
  return job.id;
}

async function processScrape(
  jobId: string,
  type: InstagramContentType,
  username: string | null,
  shortcode: string | null,
): Promise<void> {
  updateJob(jobId, { status: "running" });

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    updateJob(jobId, { attempts: attempt });

    // Tier 1: HTTP
    let result: InstagramInsightResult | ScrapeError;
    if (type === "profile" && username) {
      result = await fetchProfileHTTP(username);
    } else if (shortcode) {
      result = await fetchMediaHTTP(shortcode);
    } else {
      failJob(jobId, "Cannot determine scrape target");
      return;
    }

    if ("kind" in result) {
      if (result.kind === "rate_limited") {
        if (attempt < MAX_ATTEMPTS) {
          await sleep(BACKOFF_BASE_MS * Math.pow(2, attempt - 1));
          continue;
        }
        rateLimitJob(jobId);
        return;
      }
      if (result.kind === "private" || result.kind === "deleted") {
        failJob(jobId, result.message);
        return;
      }

      // Tier 2: Playwright fallback
      if (attempt === 1) {
        const targetUrl = type === "profile"
          ? `https://www.instagram.com/${username}/`
          : `https://www.instagram.com/p/${shortcode}/`;
        const playwrightResult = await fetchViaPlaywright(targetUrl, type);
        if (!("kind" in playwrightResult)) {
          setCache(type === "profile" ? `https://www.instagram.com/${username}/` : `https://www.instagram.com/p/${shortcode}/`, playwrightResult);
          completeJob(jobId, playwrightResult);
          return;
        }
        if (playwrightResult.kind === "rate_limited") {
          rateLimitJob(jobId);
          return;
        }
      }

      if (attempt < MAX_ATTEMPTS) {
        await sleep(BACKOFF_BASE_MS * Math.pow(2, attempt - 1));
        continue;
      }
      failJob(jobId, result.message);
      return;
    }

    // Success
    const targetUrl = type === "profile" ? `https://www.instagram.com/${username}/` : `https://www.instagram.com/p/${shortcode}/`;
    setCache(targetUrl, result);
    completeJob(jobId, result);
    return;
  }

  failJob(jobId, "Max attempts exceeded");
}
