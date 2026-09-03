import type { CreatorProfile, LeaderboardEntry } from "@/lib/services/types";

export const currentCreatorSeed: CreatorProfile = {
  id: "creator-a",
  userId: "user-creator",
  displayName: "Alex Rivera",
  handle: "@alexclips",
  totalViews: 12_400_000,
  followers: 612_400,
  lifetimeEarningsMinor: 1_834_055,
  clipsCount: 142,
  engagementRate: 7.8,
  joinedAt: "2025-02-14T10:00:00Z",
};

export const creatorDirectorySeed: CreatorProfile[] = [
  currentCreatorSeed,
  {
    id: "creator-b",
    userId: "user-b",
    displayName: "Bianca Cho",
    handle: "@biancacreates",
    totalViews: 6_100_000,
    followers: 480_200,
    lifetimeEarningsMinor: 1_326_000,
    clipsCount: 118,
    engagementRate: 7.1,
    joinedAt: "2025-04-03T10:00:00Z",
  },
  {
    id: "creator-c",
    userId: "user-c",
    displayName: "Caleb Wright",
    handle: "@calebcuts",
    totalViews: 4_800_000,
    followers: 391_500,
    lifetimeEarningsMinor: 1_041_000,
    clipsCount: 97,
    engagementRate: 6.6,
    joinedAt: "2025-05-19T10:00:00Z",
  },
  {
    id: "creator-d",
    userId: "user-d",
    displayName: "Dana Okafor",
    handle: "@danadrops",
    totalViews: 3_900_000,
    followers: 302_800,
    lifetimeEarningsMinor: 862_400,
    clipsCount: 88,
    engagementRate: 6.9,
    joinedAt: "2025-06-01T10:00:00Z",
  },
  {
    id: "creator-e",
    userId: "user-e",
    displayName: "Elias Novak",
    handle: "@eliasedits",
    totalViews: 3_100_000,
    followers: 254_300,
    lifetimeEarningsMinor: 704_800,
    clipsCount: 74,
    engagementRate: 6.2,
    joinedAt: "2025-07-11T10:00:00Z",
  },
  {
    id: "creator-f",
    userId: "user-f",
    displayName: "Farah Aziz",
    handle: "@farahfilms",
    totalViews: 2_600_000,
    followers: 198_600,
    lifetimeEarningsMinor: 588_900,
    clipsCount: 63,
    engagementRate: 7.4,
    joinedAt: "2025-08-08T10:00:00Z",
  },
  {
    id: "creator-g",
    userId: "user-g",
    displayName: "Gabriel Ruiz",
    handle: "@gaberushes",
    totalViews: 2_100_000,
    followers: 165_900,
    lifetimeEarningsMinor: 471_200,
    clipsCount: 57,
    engagementRate: 6.4,
    joinedAt: "2025-09-22T10:00:00Z",
  },
  {
    id: "creator-h",
    userId: "user-h",
    displayName: "Hana Kim",
    handle: "@hanahighlights",
    totalViews: 1_700_000,
    followers: 132_400,
    lifetimeEarningsMinor: 388_600,
    clipsCount: 49,
    engagementRate: 7.0,
    joinedAt: "2025-10-30T10:00:00Z",
  },
];

export function toLeaderboard(entries: CreatorProfile[], campaignId: string): LeaderboardEntry[] {
  return entries
    .slice()
    .sort((a, b) => b.totalViews - a.totalViews)
    .map((entry, index) => ({
      rank: index + 1,
      creatorId: entry.id,
      displayName: entry.displayName,
      handle: entry.handle,
      views: Math.round(entry.totalViews * shareFor(campaignId)),
      engagementRate: entry.engagementRate,
      clipsCount: Math.max(4, Math.round(entry.clipsCount / 12)),
      earnedMinor: Math.round((entry.lifetimeEarningsMinor * shareFor(campaignId)) / 100) * 100,
    }));
}

function shareFor(campaignId: string): number {
  let hash = 0;
  for (let i = 0; i < campaignId.length; i++) hash += campaignId.charCodeAt(i);
  return 0.06 + (hash % 9) / 100;
}
