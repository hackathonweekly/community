-- Add event series support with non-breaking optional relation to events.

CREATE TABLE IF NOT EXISTS "event_series" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "richContent" TEXT,
  "coverImage" TEXT,
  "logoImage" TEXT,
  "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "organizerId" TEXT,
  "organizationId" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "event_series_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "event_series_slug_key" ON "event_series"("slug");
CREATE INDEX IF NOT EXISTS "event_series_organizerId_idx" ON "event_series"("organizerId");
CREATE INDEX IF NOT EXISTS "event_series_organizationId_idx" ON "event_series"("organizationId");
CREATE INDEX IF NOT EXISTS "event_series_isActive_createdAt_idx" ON "event_series"("isActive", "createdAt");

ALTER TABLE "event_series"
  ADD CONSTRAINT "event_series_organizerId_fkey"
  FOREIGN KEY ("organizerId") REFERENCES "user"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "event_series"
  ADD CONSTRAINT "event_series_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organization"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "event_series_subscription" (
  "id" TEXT NOT NULL,
  "seriesId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "notifyEmail" BOOLEAN NOT NULL DEFAULT true,
  "notifyInApp" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "event_series_subscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "event_series_subscription_seriesId_userId_key"
ON "event_series_subscription"("seriesId", "userId");
CREATE INDEX IF NOT EXISTS "event_series_subscription_userId_idx"
ON "event_series_subscription"("userId");
CREATE INDEX IF NOT EXISTS "event_series_subscription_seriesId_idx"
ON "event_series_subscription"("seriesId");

ALTER TABLE "event_series_subscription"
  ADD CONSTRAINT "event_series_subscription_seriesId_fkey"
  FOREIGN KEY ("seriesId") REFERENCES "event_series"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "event_series_subscription"
  ADD CONSTRAINT "event_series_subscription_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "user"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "event"
  ADD COLUMN IF NOT EXISTS "seriesId" TEXT;

CREATE INDEX IF NOT EXISTS "event_seriesId_startTime_idx"
ON "event"("seriesId", "startTime");

ALTER TABLE "event"
  ADD CONSTRAINT "event_seriesId_fkey"
  FOREIGN KEY ("seriesId") REFERENCES "event_series"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
