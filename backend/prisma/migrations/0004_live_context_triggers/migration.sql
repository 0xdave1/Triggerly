CREATE TYPE "LiveContextTriggerType" AS ENUM ('WEATHER', 'EXCHANGE_RATE', 'PRICE', 'TRAVEL');
CREATE TYPE "LiveContextTriggerStatus" AS ENUM ('ACTIVE', 'PAUSED', 'TRIGGERED', 'DELETED');
CREATE TYPE "PriceLogSource" AS ENUM ('MANUAL', 'OCR', 'AI_PARSE');

DROP INDEX IF EXISTS "LiveContextTrigger_userId_kind_status_idx";
ALTER TABLE "LiveContextTrigger" DROP CONSTRAINT IF EXISTS "LiveContextTrigger_triggerId_fkey";
DROP INDEX IF EXISTS "LiveContextTrigger_triggerId_key";

ALTER TABLE "LiveContextTrigger"
  ADD COLUMN "type" "LiveContextTriggerType",
  ADD COLUMN "title" TEXT,
  ADD COLUMN "condition" JSONB,
  ADD COLUMN "statusNext" "LiveContextTriggerStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "lastTriggeredAt" TIMESTAMP(3);

UPDATE "LiveContextTrigger"
SET
  "type" = CASE "kind"::TEXT
    WHEN 'WEATHER' THEN 'WEATHER'::"LiveContextTriggerType"
    WHEN 'EXCHANGE_RATE' THEN 'EXCHANGE_RATE'::"LiveContextTriggerType"
    WHEN 'PRICE' THEN 'PRICE'::"LiveContextTriggerType"
    WHEN 'TRAVEL' THEN 'TRAVEL'::"LiveContextTriggerType"
    ELSE 'WEATHER'::"LiveContextTriggerType"
  END,
  "title" = LOWER("kind"::TEXT) || ' trigger',
  "condition" = jsonb_strip_nulls(jsonb_build_object('query', "query", 'threshold', "threshold")),
  "lastTriggeredAt" = "lastMatchedAt";

ALTER TABLE "LiveContextTrigger"
  ALTER COLUMN "type" SET NOT NULL,
  ALTER COLUMN "title" SET NOT NULL,
  ALTER COLUMN "condition" SET NOT NULL,
  DROP COLUMN IF EXISTS "triggerId",
  DROP COLUMN IF EXISTS "kind",
  DROP COLUMN IF EXISTS "provider",
  DROP COLUMN IF EXISTS "query",
  DROP COLUMN IF EXISTS "threshold",
  DROP COLUMN IF EXISTS "lastMatchedAt",
  DROP COLUMN "status";

ALTER TABLE "LiveContextTrigger" RENAME COLUMN "statusNext" TO "status";

CREATE INDEX "LiveContextTrigger_userId_type_status_idx" ON "LiveContextTrigger"("userId", "type", "status");
CREATE INDEX "LiveContextTrigger_userId_createdAt_idx" ON "LiveContextTrigger"("userId", "createdAt");

CREATE TABLE "PriceLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "itemName" TEXT NOT NULL,
  "price" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'NGN',
  "quantityLabel" TEXT,
  "placeName" TEXT,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "source" "PriceLogSource" NOT NULL DEFAULT 'MANUAL',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PriceLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PriceLog_userId_itemName_loggedAt_idx" ON "PriceLog"("userId", "itemName", "loggedAt");
ALTER TABLE "PriceLog" ADD CONSTRAINT "PriceLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "WeatherProviderCache" (
  "id" TEXT NOT NULL,
  "locationKey" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WeatherProviderCache_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WeatherProviderCache_locationKey_key" ON "WeatherProviderCache"("locationKey");
CREATE INDEX "WeatherProviderCache_expiresAt_idx" ON "WeatherProviderCache"("expiresAt");

CREATE TABLE "ExchangeRateCache" (
  "id" TEXT NOT NULL,
  "pair" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExchangeRateCache_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExchangeRateCache_pair_key" ON "ExchangeRateCache"("pair");
CREATE INDEX "ExchangeRateCache_expiresAt_idx" ON "ExchangeRateCache"("expiresAt");
