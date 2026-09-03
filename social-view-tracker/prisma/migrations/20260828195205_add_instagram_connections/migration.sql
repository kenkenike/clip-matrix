-- AlterTable
ALTER TABLE "Reel" ADD COLUMN     "connectedAccountId" TEXT,
ADD COLUMN     "instagramMediaId" TEXT,
ALTER COLUMN "initialViews" DROP NOT NULL,
ALTER COLUMN "initialViews" DROP DEFAULT,
ALTER COLUMN "trackingStatus" SET DEFAULT 'pending_connection';

-- AlterTable
ALTER TABLE "ReelViewHistory" ALTER COLUMN "viewCount" DROP NOT NULL;

-- CreateTable
CREATE TABLE "InstagramConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "instagramUserId" TEXT NOT NULL,
    "instagramUsername" TEXT NOT NULL,
    "accessTokenEncrypted" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3),
    "scopes" TEXT,
    "isBusinessLinked" BOOLEAN NOT NULL DEFAULT false,
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstagramConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InstagramConnection_userId_idx" ON "InstagramConnection"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "InstagramConnection_userId_instagramUserId_key" ON "InstagramConnection"("userId", "instagramUserId");

-- CreateIndex
CREATE INDEX "Reel_connectedAccountId_idx" ON "Reel"("connectedAccountId");

-- AddForeignKey
ALTER TABLE "InstagramConnection" ADD CONSTRAINT "InstagramConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reel" ADD CONSTRAINT "Reel_connectedAccountId_fkey" FOREIGN KEY ("connectedAccountId") REFERENCES "InstagramConnection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
