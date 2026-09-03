import type { Clip, ClipStatus } from "@/lib/services/types";

type Platform = "tiktok" | "instagram" | "youtube" | "x";

type Row = [
  id: string,
  campaignId: string,
  campaignName: string,
  brand: string,
  creatorId: string,
  creator: string,
  handle: string,
  platform: Platform,
  views: number,
  likes: number,
  comments: number,
  shares: number,
  postedAt: string,
  status: ClipStatus,
  earnedMinor: number,
];

const rows: Row[] = [
  ["clip-001", "nova-podcast", "Nova Podcast", "Northbeam Labs", "creator-a", "Alex Rivera", "@alexclips", "tiktok", 2_410_000, 214_000, 8_420, 31_200, "2026-08-02", "paid", 60_250],
  ["clip-002", "alpha-arena", "Alpha Arena", "Hexforge Games", "creator-a", "Alex Rivera", "@alexclips", "youtube", 840_000, 61_400, 2_910, 9_800, "2026-08-10", "pending", 42_000],
  ["clip-003", "podium-fm-clips", "Podium FM Clips", "Podium FM", "creator-a", "Alex Rivera", "@alexclips", "instagram", 1_120_000, 98_300, 4_150, 12_600, "2026-08-06", "paid", 61_600],
  ["clip-004", "midnight-reel-club", "Midnight Reel Club", "Lumen Audio", "creator-a", "Alex Rivera", "@alexclips", "x", 322_000, 24_800, 1_240, 6_050, "2026-08-14", "under_review", 10_304],
  ["clip-005", "lumen-sessions", "Lumen Sessions", "Lumen Audio", "creator-a", "Alex Rivera", "@alexclips", "instagram", 486_000, 44_100, 1_980, 7_320, "2026-08-16", "approved", 14_580],
  ["clip-006", "cartel-drop-04", "Cartel Drop 04", "Cartel Supply", "creator-a", "Alex Rivera", "@alexclips", "tiktok", 96_500, 8_140, 410, 1_180, "2026-08-19", "flagged", 5_790],
  ["clip-007", "statline-sync", "Statline Sync", "Statline", "creator-a", "Alex Rivera", "@alexclips", "tiktok", 74_200, 5_310, 289, 640, "2026-08-20", "rejected", 0],
  ["clip-008", "orbit-explainers", "Orbit Explainers", "Orbit Agency", "creator-b", "Bianca Cho", "@biancacreates", "youtube", 1_890_000, 132_500, 5_620, 18_400, "2026-07-28", "paid", 37_800],
  ["clip-009", "hexforge-beta", "Hexforge Open Beta", "Hexforge Games", "creator-c", "Caleb Wright", "@calebcuts", "tiktok", 3_400_000, 388_000, 12_900, 51_000, "2026-08-08", "paid", 153_000],
  ["clip-010", "ledger-lessons", "Ledger Lessons", "Orbit Agency", "creator-d", "Dana Okafor", "@danadrops", "x", 654_000, 41_200, 2_050, 8_900, "2026-08-11", "flagged", 22_890],
  ["clip-011", "midnight-reel-club", "Midnight Reel Club", "Lumen Audio", "creator-e", "Elias Novak", "@eliasedits", "tiktok", 1_240_000, 118_600, 6_400, 15_700, "2026-08-13", "pending", 39_680],
  ["clip-012", "cartel-drop-04", "Cartel Drop 04", "Cartel Supply", "creator-f", "Farah Aziz", "@farahfilms", "instagram", 780_000, 71_500, 3_100, 9_450, "2026-08-17", "approved", 46_800],
  ["clip-013", "podium-fm-clips", "Podium FM Clips", "Podium FM", "creator-g", "Gabriel Ruiz", "@gaberushes", "youtube", 2_050_000, 156_800, 7_240, 22_100, "2026-08-05", "paid", 112_750],
  ["clip-014", "alpha-arena", "Alpha Arena", "Hexforge Games", "creator-h", "Hana Kim", "@hanahighlights", "tiktok", 5_600_000, 512_000, 19_300, 84_000, "2026-07-30", "paid", 280_000],
  ["clip-015", "northbeam-field-notes", "Northbeam Field Notes", "Northbeam Labs", "creator-b", "Bianca Cho", "@biancacreates", "tiktok", 412_000, 36_800, 1_540, 4_900, "2026-08-18", "pending", 10_300],
  ["clip-016", "northbeam-field-notes", "Northbeam Field Notes", "Northbeam Labs", "creator-e", "Elias Novak", "@eliasedits", "youtube", 1_060_000, 84_200, 3_480, 11_700, "2026-08-09", "paid", 26_500],
  ["clip-017", "northbeam-field-notes", "Northbeam Field Notes", "Northbeam Labs", "creator-h", "Hana Kim", "@hanahighlights", "instagram", 233_000, 19_400, 880, 2_650, "2026-08-21", "under_review", 5_825],
  ["clip-018", "lumen-audio-drops", "Lumen Audio Drops", "Lumen Audio", "creator-d", "Dana Okafor", "@danadrops", "tiktok", 1_580_000, 142_000, 5_960, 17_300, "2026-08-07", "approved", 39_500],
  ["clip-019", "lumen-audio-drops", "Lumen Audio Drops", "Lumen Audio", "creator-g", "Gabriel Ruiz", "@gaberushes", "x", 96_400, 7_120, 342, 940, "2026-08-22", "rejected", 0],
  ["clip-020", "lumen-audio-drops", "Lumen Audio Drops", "Lumen Audio", "creator-c", "Caleb Wright", "@calebcuts", "youtube", 2_720_000, 301_000, 9_850, 38_600, "2026-08-04", "flagged", 68_000],
  ["clip-021", "nova-podcast", "Nova Podcast", "Northbeam Labs", "creator-f", "Farah Aziz", "@farahfilms", "youtube", 3_120_000, 284_000, 10_400, 33_800, "2026-07-31", "paid", 156_000],
  ["clip-022", "statline-sync", "Statline Sync", "Statline", "creator-b", "Bianca Cho", "@biancacreates", "instagram", 158_000, 13_900, 610, 1_820, "2026-08-23", "under_review", 3_950],
  ["clip-023", "ledger-lessons", "Ledger Lessons", "Orbit Agency", "creator-e", "Elias Novak", "@eliasedits", "tiktok", 934_000, 88_100, 3_720, 10_400, "2026-08-12", "approved", 23_350],
  ["clip-024", "orbit-explainers", "Orbit Explainers", "Orbit Agency", "creator-d", "Dana Okafor", "@danadrops", "instagram", 640_000, 52_600, 2_280, 6_750, "2026-08-20", "pending", 16_000],
  ["clip-025", "hexforge-beta", "Hexforge Open Beta", "Hexforge Games", "creator-g", "Gabriel Ruiz", "@gaberushes", "instagram", 1_970_000, 176_400, 6_890, 20_500, "2026-08-06", "under_review", 49_250],
  ["clip-026", "lumen-sessions", "Lumen Sessions", "Lumen Audio", "creator-b", "Bianca Cho", "@biancacreates", "x", 288_000, 24_600, 1_130, 3_240, "2026-08-15", "approved", 14_400],
];

export function urlFor(platform: Platform, id: string): string {
  switch (platform) {
    case "tiktok":
      return `https://www.tiktok.com/@creator/video/${id}`;
    case "instagram":
      return `https://www.instagram.com/reel/${id}`;
    case "youtube":
      return `https://www.youtube.com/shorts/${id}`;
    case "x":
      return `https://x.com/creator/status/${id}`;
  }
}

const rejectionReasons: Record<string, string> = {
  "clip-007":
    "This is a near-untouched episode segment. Re-cut it into an original short under 60 seconds with your own hook and captions.",
  "clip-019":
    "The audio cuts off mid-sentence and the required #clipmatrixpartner hashtag is missing. Please follow the campaign content rules before resubmitting.",
};

function buildClip(row: Row): Clip {
  const [
    id,
    campaignId,
    campaignName,
    brand,
    creatorId,
    creator,
    handle,
    platform,
    views,
    likes,
    comments,
    shares,
    postedAt,
    status,
    earnedMinor,
  ] = row;
  const submittedDate = new Date(`${postedAt}T18:00:00Z`).toISOString();
  return {
    id,
    campaignId,
    campaignName,
    brandName: brand,
    creatorId,
    creatorName: creator,
    creatorHandle: handle,
    platform,
    url: urlFor(platform, id.replace("clip-", "88")),
    views,
    likes,
    comments,
    shares,
    postedAt: new Date(`${postedAt}T12:00:00Z`).toISOString(),
    submittedAt: submittedDate,
    status,
    earnedMinor,
    rejectionReason: rejectionReasons[id],
  };
}

export const clipsSeed: Clip[] = rows.map(buildClip);
