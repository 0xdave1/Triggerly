ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS 'PAYMENT_REMINDER';
ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS 'PREPARE_MEETING_NOTES';

CREATE TYPE "ActionPromptEventType" AS ENUM ('CREATED', 'UPDATED', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'CONTENT_GENERATED');

ALTER TABLE "UserPrivacySetting"
  ADD COLUMN "messageDraftingEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "calendarIntegrationEnabled" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "ActionPrompt"
  ADD COLUMN "title" TEXT NOT NULL DEFAULT 'Prepared action',
  ADD COLUMN "generatedContent" TEXT,
  ADD COLUMN "sensitive" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "confirmedAt" TIMESTAMP(3),
  ADD COLUMN "completedAt" TIMESTAMP(3);

UPDATE "ActionPrompt"
SET
  "sensitive" = CASE
    WHEN "actionType" IN ('DRAFT_EMAIL', 'DRAFT_MESSAGE', 'OPEN_PAYMENT_APP') THEN true
    ELSE false
  END,
  "confirmedAt" = CASE
    WHEN "status" = 'CONFIRMED' THEN "updatedAt"
    ELSE NULL
  END,
  "completedAt" = CASE
    WHEN "status" = 'COMPLETED' THEN "updatedAt"
    ELSE NULL
  END;

CREATE TABLE "ActionPromptEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "actionPromptId" TEXT NOT NULL,
  "eventType" "ActionPromptEventType" NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ActionPromptEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ActionPromptEvent_userId_createdAt_idx" ON "ActionPromptEvent"("userId", "createdAt");
CREATE INDEX "ActionPromptEvent_actionPromptId_createdAt_idx" ON "ActionPromptEvent"("actionPromptId", "createdAt");
ALTER TABLE "ActionPromptEvent" ADD CONSTRAINT "ActionPromptEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActionPromptEvent" ADD CONSTRAINT "ActionPromptEvent_actionPromptId_fkey" FOREIGN KEY ("actionPromptId") REFERENCES "ActionPrompt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
