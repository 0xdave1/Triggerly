CREATE TYPE "DeliveryMode" AS ENUM ('PUSH', 'VOICE', 'VOICE_AND_PUSH', 'SILENT', 'URGENT');
CREATE TYPE "ActionType" AS ENUM ('DRAFT_EMAIL', 'OPEN_PAYMENT_APP', 'CALL_CONTACT', 'OPEN_MAPS', 'OPEN_URL');
CREATE TYPE "ActionPromptStatus" AS ENUM ('PENDING_CONFIRMATION', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

ALTER TABLE "Reminder"
  ADD COLUMN "deliveryMode" "DeliveryMode" NOT NULL DEFAULT 'PUSH',
  ADD COLUMN "voiceScript" TEXT,
  ADD COLUMN "voiceEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "contactMemoryId" TEXT,
  ADD COLUMN "actionPromptId" TEXT;

CREATE TABLE "UserVoiceSetting" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "voiceNotificationsEnabled" BOOLEAN NOT NULL DEFAULT false,
  "selectedVoiceStyle" TEXT NOT NULL DEFAULT 'calm',
  "selectedVoiceId" TEXT,
  "readFullReminder" BOOLEAN NOT NULL DEFAULT true,
  "readLocationContext" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserVoiceSetting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContactMemory" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT,
  "email" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContactMemory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ActionPrompt" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "reminderId" TEXT,
  "actionType" "ActionType" NOT NULL,
  "payload" JSONB,
  "status" "ActionPromptStatus" NOT NULL DEFAULT 'PENDING_CONFIRMATION',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ActionPrompt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IntentParseLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "input" TEXT NOT NULL,
  "parsedOutput" JSONB NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IntentParseLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserVoiceSetting_userId_key" ON "UserVoiceSetting"("userId");
CREATE INDEX "ContactMemory_userId_name_idx" ON "ContactMemory"("userId", "name");
CREATE UNIQUE INDEX "ActionPrompt_reminderId_key" ON "ActionPrompt"("reminderId");
CREATE INDEX "ActionPrompt_userId_status_idx" ON "ActionPrompt"("userId", "status");
CREATE INDEX "IntentParseLog_userId_createdAt_idx" ON "IntentParseLog"("userId", "createdAt");

ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_contactMemoryId_fkey" FOREIGN KEY ("contactMemoryId") REFERENCES "ContactMemory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UserVoiceSetting" ADD CONSTRAINT "UserVoiceSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContactMemory" ADD CONSTRAINT "ContactMemory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActionPrompt" ADD CONSTRAINT "ActionPrompt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActionPrompt" ADD CONSTRAINT "ActionPrompt_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "Reminder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IntentParseLog" ADD CONSTRAINT "IntentParseLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
