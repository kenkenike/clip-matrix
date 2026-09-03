-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "Reel" (
    "id" TEXT NOT NULL,
    "instagramReelId" TEXT NOT NULL,
    "instagramUrl" TEXT NOT NULL,
    "normalizedUrl" TEXT NOT NULL,
    "username" TEXT,
    "caption" TEXT,
    "thumbnailUrl" TEXT,
    "currentViews" INTEGER NOT NULL DEFAULT 0,
    "initialViews" INTEGER NOT NULL DEFAULT 0,
    "viewsGained" INTEGER NOT NULL DEFAULT 0,
    "trackingStatus" TEXT NOT NULL DEFAULT 'active',
    "lastCheckedAt" TIMESTAMP(3),
    "consecutiveErrors" INTEGER NOT NULL DEFAULT 0,
    "consecutiveIdentical" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "lastSource" TEXT,
    "flaggedForReview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Reel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReelViewHistory" (
    "id" TEXT NOT NULL,
    "reelId" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT,
    "previousViewCount" INTEGER,
    "eventType" TEXT NOT NULL DEFAULT 'normal',
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReelViewHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReelEvent" (
    "id" TEXT NOT NULL,
    "reelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "meta" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReelEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiRequestLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "status" INTEGER NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiRequestLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reel_userId_trackingStatus_idx" ON "Reel"("userId", "trackingStatus");

-- CreateIndex
CREATE INDEX "Reel_userId_lastCheckedAt_idx" ON "Reel"("userId", "lastCheckedAt");

-- CreateIndex
CREATE INDEX "Reel_userId_createdAt_idx" ON "Reel"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Reel_userId_currentViews_idx" ON "Reel"("userId", "currentViews");

-- CreateIndex
CREATE UNIQUE INDEX "Reel_userId_instagramReelId_key" ON "Reel"("userId", "instagramReelId");

-- CreateIndex
CREATE INDEX "ReelViewHistory_reelId_checkedAt_idx" ON "ReelViewHistory"("reelId", "checkedAt");

-- CreateIndex
CREATE INDEX "ReelEvent_reelId_createdAt_idx" ON "ReelEvent"("reelId", "createdAt");

-- CreateIndex
CREATE INDEX "ReelEvent_kind_createdAt_idx" ON "ReelEvent"("kind", "createdAt");

-- CreateIndex
CREATE INDEX "ApiRequestLog_createdAt_idx" ON "ApiRequestLog"("createdAt");

-- CreateIndex
CREATE INDEX "ApiRequestLog_path_idx" ON "ApiRequestLog"("path");

-- AddForeignKey
ALTER TABLE "Reel" ADD CONSTRAINT "Reel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReelViewHistory" ADD CONSTRAINT "ReelViewHistory_reelId_fkey" FOREIGN KEY ("reelId") REFERENCES "Reel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReelEvent" ADD CONSTRAINT "ReelEvent_reelId_fkey" FOREIGN KEY ("reelId") REFERENCES "Reel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReelEvent" ADD CONSTRAINT "ReelEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiRequestLog" ADD CONSTRAINT "ApiRequestLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
