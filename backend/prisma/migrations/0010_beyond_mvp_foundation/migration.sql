ALTER TYPE "MemoryType" ADD VALUE IF NOT EXISTS 'FAVOUR';
ALTER TYPE "MemorySource" ADD VALUE IF NOT EXISTS 'SHARE_EXTENSION';
ALTER TYPE "MemorySource" ADD VALUE IF NOT EXISTS 'SYSTEM_SUGGESTED';
ALTER TYPE "PriceLogSource" ADD VALUE IF NOT EXISTS 'AI_CHAT';
ALTER TYPE "PriceLogSource" ADD VALUE IF NOT EXISTS 'SHARE_EXTENSION';

CREATE TYPE "BriefingType" AS ENUM ('MORNING', 'EVENING', 'TRAVEL', 'CUSTOM');
CREATE TYPE "PromiseStatus" AS ENUM ('PENDING', 'COMPLETED', 'OVERDUE', 'CANCELLED');
CREATE TYPE "DebtDirection" AS ENUM ('OWED_TO_ME', 'I_OWE');
CREATE TYPE "DebtStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');
CREATE TYPE "TravelPlanStatus" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE "AccountabilityStrictness" AS ENUM ('GENTLE', 'BALANCED', 'STRICT');
CREATE TYPE "AccountabilityGoalStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "AccountabilityCheckInStatus" AS ENUM ('DONE', 'MISSED', 'SNOOZED');
CREATE TYPE "FollowUpSourceType" AS ENUM ('REMINDER', 'ACTION', 'MEMORY', 'TRAVEL', 'PRICE', 'PROMISE', 'DEBT');
CREATE TYPE "FollowUpSuggestionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DISMISSED', 'EXPIRED');
CREATE TYPE "ShareCaptureContentType" AS ENUM ('TEXT', 'IMAGE', 'URL', 'FILE');
CREATE TYPE "ShareCaptureStatus" AS ENUM ('RECEIVED', 'PARSED', 'CONFIRMED', 'DISCARDED');
CREATE TYPE "VoicePersonalityStyle" AS ENUM ('CALM', 'PROFESSIONAL', 'FRIENDLY_NIGERIAN', 'STRICT_COACH', 'MINIMAL', 'ENERGETIC');

ALTER TABLE "UserPrivacySetting"
  ADD COLUMN "briefingsEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "promiseTrackingEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "debtFavourMemoryEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "travelModeEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "smartSnoozeEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "voicePersonalityEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "accountabilityModeEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "followUpSuggestionsEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "widgetSummaryEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "shareCaptureEnabled" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "Memory" ADD COLUMN "priceLogId" TEXT;

CREATE TABLE "BriefingPreference" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "morningBriefingEnabled" BOOLEAN NOT NULL DEFAULT false,
  "eveningBriefingEnabled" BOOLEAN NOT NULL DEFAULT false,
  "morningTime" TEXT NOT NULL DEFAULT '08:00',
  "eveningTime" TEXT NOT NULL DEFAULT '21:00',
  "includeWeather" BOOLEAN NOT NULL DEFAULT true,
  "includeActions" BOOLEAN NOT NULL DEFAULT true,
  "includeHabits" BOOLEAN NOT NULL DEFAULT true,
  "includeMemory" BOOLEAN NOT NULL DEFAULT true,
  "voiceEnabled" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BriefingPreference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Briefing" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "BriefingType" NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "items" JSONB NOT NULL,
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Briefing_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Promise" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "personName" TEXT NOT NULL,
  "taskTitle" TEXT NOT NULL,
  "deadline" TIMESTAMP(3),
  "status" "PromiseStatus" NOT NULL DEFAULT 'PENDING',
  "sourceMemoryId" TEXT,
  "reminderId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "Promise_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Debt" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "personName" TEXT NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'NGN',
  "direction" "DebtDirection" NOT NULL,
  "status" "DebtStatus" NOT NULL DEFAULT 'PENDING',
  "sourceMemoryId" TEXT,
  "reminderId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "settledAt" TIMESTAMP(3),
  CONSTRAINT "Debt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TravelPlan" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "destination" TEXT NOT NULL,
  "origin" TEXT,
  "departureDate" TIMESTAMP(3),
  "returnDate" TIMESTAMP(3),
  "weatherAlertsEnabled" BOOLEAN NOT NULL DEFAULT false,
  "checklistEnabled" BOOLEAN NOT NULL DEFAULT true,
  "status" "TravelPlanStatus" NOT NULL DEFAULT 'PLANNED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TravelPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TravelChecklistItem" (
  "id" TEXT NOT NULL,
  "travelPlanId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TravelChecklistItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AccountabilityGoal" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "frequencyType" "HabitFrequencyType" NOT NULL,
  "frequencyCount" INTEGER NOT NULL DEFAULT 1,
  "strictness" "AccountabilityStrictness" NOT NULL DEFAULT 'BALANCED',
  "voiceEnabled" BOOLEAN NOT NULL DEFAULT false,
  "status" "AccountabilityGoalStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AccountabilityGoal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AccountabilityCheckIn" (
  "id" TEXT NOT NULL,
  "goalId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "AccountabilityCheckInStatus" NOT NULL,
  "note" TEXT,
  "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccountabilityCheckIn_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FollowUpSuggestion" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "sourceType" "FollowUpSourceType" NOT NULL,
  "sourceId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "suggestedActionType" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" "FollowUpSuggestionStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FollowUpSuggestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ShareCapture" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "contentType" "ShareCaptureContentType" NOT NULL,
  "rawText" TEXT,
  "fileUrl" TEXT,
  "parsedPlan" JSONB,
  "status" "ShareCaptureStatus" NOT NULL DEFAULT 'RECEIVED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ShareCapture_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WidgetPreference" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "nextTriggerEnabled" BOOLEAN NOT NULL DEFAULT true,
  "briefingEnabled" BOOLEAN NOT NULL DEFAULT true,
  "pendingActionsEnabled" BOOLEAN NOT NULL DEFAULT true,
  "weatherEnabled" BOOLEAN NOT NULL DEFAULT false,
  "habitsEnabled" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WidgetPreference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VoicePersonality" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "style" "VoicePersonalityStyle" NOT NULL DEFAULT 'CALM',
  "voiceNotificationsEnabled" BOOLEAN NOT NULL DEFAULT false,
  "readFullReminder" BOOLEAN NOT NULL DEFAULT true,
  "readSensitiveContent" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VoicePersonality_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BriefingPreference_userId_key" ON "BriefingPreference"("userId");
CREATE INDEX "Briefing_userId_generatedAt_idx" ON "Briefing"("userId", "generatedAt");
CREATE INDEX "Promise_userId_status_deadline_idx" ON "Promise"("userId", "status", "deadline");
CREATE INDEX "Debt_userId_status_direction_idx" ON "Debt"("userId", "status", "direction");
CREATE INDEX "TravelPlan_userId_status_departureDate_idx" ON "TravelPlan"("userId", "status", "departureDate");
CREATE INDEX "TravelChecklistItem_travelPlanId_completed_idx" ON "TravelChecklistItem"("travelPlanId", "completed");
CREATE INDEX "AccountabilityGoal_userId_status_idx" ON "AccountabilityGoal"("userId", "status");
CREATE INDEX "AccountabilityCheckIn_userId_checkedAt_idx" ON "AccountabilityCheckIn"("userId", "checkedAt");
CREATE INDEX "AccountabilityCheckIn_goalId_checkedAt_idx" ON "AccountabilityCheckIn"("goalId", "checkedAt");
CREATE INDEX "FollowUpSuggestion_userId_status_createdAt_idx" ON "FollowUpSuggestion"("userId", "status", "createdAt");
CREATE INDEX "ShareCapture_userId_status_createdAt_idx" ON "ShareCapture"("userId", "status", "createdAt");
CREATE UNIQUE INDEX "WidgetPreference_userId_key" ON "WidgetPreference"("userId");
CREATE UNIQUE INDEX "VoicePersonality_userId_key" ON "VoicePersonality"("userId");
CREATE INDEX "Memory_priceLogId_idx" ON "Memory"("priceLogId");

ALTER TABLE "Memory" ADD CONSTRAINT "Memory_priceLogId_fkey" FOREIGN KEY ("priceLogId") REFERENCES "PriceLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BriefingPreference" ADD CONSTRAINT "BriefingPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Briefing" ADD CONSTRAINT "Briefing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Promise" ADD CONSTRAINT "Promise_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Promise" ADD CONSTRAINT "Promise_sourceMemoryId_fkey" FOREIGN KEY ("sourceMemoryId") REFERENCES "Memory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Debt" ADD CONSTRAINT "Debt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Debt" ADD CONSTRAINT "Debt_sourceMemoryId_fkey" FOREIGN KEY ("sourceMemoryId") REFERENCES "Memory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TravelPlan" ADD CONSTRAINT "TravelPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TravelChecklistItem" ADD CONSTRAINT "TravelChecklistItem_travelPlanId_fkey" FOREIGN KEY ("travelPlanId") REFERENCES "TravelPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccountabilityGoal" ADD CONSTRAINT "AccountabilityGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccountabilityCheckIn" ADD CONSTRAINT "AccountabilityCheckIn_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "AccountabilityGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccountabilityCheckIn" ADD CONSTRAINT "AccountabilityCheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FollowUpSuggestion" ADD CONSTRAINT "FollowUpSuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShareCapture" ADD CONSTRAINT "ShareCapture_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WidgetPreference" ADD CONSTRAINT "WidgetPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VoicePersonality" ADD CONSTRAINT "VoicePersonality_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
