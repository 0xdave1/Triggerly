ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS 'DRAFT_MESSAGE';
ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS 'CREATE_CALENDAR_EVENT';
ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS 'GENERATE_CHECKLIST';

CREATE TYPE "TriggerType" AS ENUM (
  'TIME',
  'LOCATION_ARRIVAL',
  'LOCATION_DEPARTURE',
  'HABIT',
  'WEATHER',
  'EXCHANGE_RATE',
  'PRICE',
  'CONTACT',
  'TRAVEL'
);

CREATE TYPE "TriggerStatus" AS ENUM (
  'ACTIVE',
  'DISABLED',
  'COMPLETED',
  'DELETED'
);

CREATE TYPE "MemoryType" AS ENUM (
  'PERSON',
  'PLACE',
  'PRICE',
  'DEBT',
  'PROMISE',
  'PREFERENCE',
  'TRAVEL',
  'ROUTINE',
  'GENERAL'
);

ALTER TABLE "UserPrivacySetting"
  ADD COLUMN "locationTriggersEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "backgroundLocationEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "microphoneInputEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "voiceNotificationsEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "cloudSyncEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "contactAccessEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "emailDraftingEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "paymentRemindersEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "paymentActionsEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "screenshotReceiptScanningEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "smartSuggestionsEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "habitLearningEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "weatherTriggersEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "exchangeRateTriggersEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "priceMemoryEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "travelContextEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "analyticsEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "crashReportsEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "dataExportEnabled" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "Trigger" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "reminderId" TEXT,
  "type" "TriggerType" NOT NULL,
  "status" "TriggerStatus" NOT NULL DEFAULT 'ACTIVE',
  "title" TEXT,
  "configuration" JSONB,
  "requiresConfirmation" BOOLEAN NOT NULL DEFAULT true,
  "confirmedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Trigger_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HabitTrigger" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "triggerId" TEXT,
  "frequencyType" "HabitFrequencyType" NOT NULL,
  "frequencyCount" INTEGER NOT NULL,
  "lastCompletedAt" TIMESTAMP(3),
  "nextDueAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HabitTrigger_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LiveContextTrigger" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "triggerId" TEXT,
  "kind" "TriggerType" NOT NULL,
  "provider" TEXT,
  "query" JSONB NOT NULL,
  "threshold" JSONB,
  "status" "TriggerStatus" NOT NULL DEFAULT 'ACTIVE',
  "lastCheckedAt" TIMESTAMP(3),
  "lastMatchedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LiveContextTrigger_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Memory" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "MemoryType" NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "entities" JSONB,
  "source" TEXT,
  "confidence" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "archivedAt" TIMESTAMP(3),
  CONSTRAINT "Memory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Trigger_userId_type_status_idx" ON "Trigger"("userId", "type", "status");
CREATE INDEX "Trigger_reminderId_idx" ON "Trigger"("reminderId");
CREATE UNIQUE INDEX "HabitTrigger_triggerId_key" ON "HabitTrigger"("triggerId");
CREATE INDEX "HabitTrigger_userId_nextDueAt_idx" ON "HabitTrigger"("userId", "nextDueAt");
CREATE UNIQUE INDEX "LiveContextTrigger_triggerId_key" ON "LiveContextTrigger"("triggerId");
CREATE INDEX "LiveContextTrigger_userId_kind_status_idx" ON "LiveContextTrigger"("userId", "kind", "status");
CREATE INDEX "Memory_userId_type_idx" ON "Memory"("userId", "type");
CREATE INDEX "Memory_userId_archivedAt_idx" ON "Memory"("userId", "archivedAt");

ALTER TABLE "Trigger" ADD CONSTRAINT "Trigger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Trigger" ADD CONSTRAINT "Trigger_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "Reminder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HabitTrigger" ADD CONSTRAINT "HabitTrigger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HabitTrigger" ADD CONSTRAINT "HabitTrigger_triggerId_fkey" FOREIGN KEY ("triggerId") REFERENCES "Trigger"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LiveContextTrigger" ADD CONSTRAINT "LiveContextTrigger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LiveContextTrigger" ADD CONSTRAINT "LiveContextTrigger_triggerId_fkey" FOREIGN KEY ("triggerId") REFERENCES "Trigger"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Memory" ADD CONSTRAINT "Memory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
