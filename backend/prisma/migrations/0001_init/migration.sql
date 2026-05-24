CREATE TYPE "ReminderType" AS ENUM ('TIME', 'LOCATION', 'HABIT', 'HYBRID');
CREATE TYPE "ReminderStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'DELETED', 'SNOOZED');
CREATE TYPE "LocationTriggerType" AS ENUM ('ARRIVAL', 'DEPARTURE');
CREATE TYPE "HabitFrequencyType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM');
CREATE TYPE "ReminderEventType" AS ENUM ('CREATED', 'TRIGGERED', 'COMPLETED', 'SNOOZED', 'DISMISSED', 'EDITED', 'DELETED');
CREATE TYPE "DevicePlatform" AS ENUM ('IOS', 'ANDROID', 'WEB');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Reminder" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "notes" TEXT,
  "type" "ReminderType" NOT NULL,
  "status" "ReminderStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LocationTrigger" (
  "id" TEXT NOT NULL,
  "reminderId" TEXT NOT NULL,
  "placeName" TEXT NOT NULL,
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "radiusMeters" INTEGER NOT NULL,
  "triggerType" "LocationTriggerType" NOT NULL,
  "lastTriggeredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LocationTrigger_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TimeTrigger" (
  "id" TEXT NOT NULL,
  "reminderId" TEXT NOT NULL,
  "triggerDateTime" TIMESTAMP(3) NOT NULL,
  "timezone" TEXT NOT NULL,
  "repeatRule" TEXT,
  "lastTriggeredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TimeTrigger_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Habit" (
  "id" TEXT NOT NULL,
  "reminderId" TEXT NOT NULL,
  "frequencyType" "HabitFrequencyType" NOT NULL,
  "frequencyCount" INTEGER NOT NULL,
  "lastCompletedAt" TIMESTAMP(3),
  "nextDueAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Habit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReminderEvent" (
  "id" TEXT NOT NULL,
  "reminderId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "eventType" "ReminderEventType" NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB,
  CONSTRAINT "ReminderEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Device" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "platform" "DevicePlatform" NOT NULL,
  "pushToken" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "lastSeenAt" TIMESTAMP(3),
  CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserPrivacySetting" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "locationEnabled" BOOLEAN NOT NULL DEFAULT false,
  "voiceInputEnabled" BOOLEAN NOT NULL DEFAULT false,
  "aiParsingEnabled" BOOLEAN NOT NULL DEFAULT true,
  "dataRetentionDays" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserPrivacySetting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "Reminder_userId_status_idx" ON "Reminder"("userId", "status");
CREATE INDEX "Reminder_userId_type_idx" ON "Reminder"("userId", "type");
CREATE UNIQUE INDEX "LocationTrigger_reminderId_key" ON "LocationTrigger"("reminderId");
CREATE UNIQUE INDEX "TimeTrigger_reminderId_key" ON "TimeTrigger"("reminderId");
CREATE INDEX "TimeTrigger_triggerDateTime_idx" ON "TimeTrigger"("triggerDateTime");
CREATE UNIQUE INDEX "Habit_reminderId_key" ON "Habit"("reminderId");
CREATE INDEX "Habit_nextDueAt_idx" ON "Habit"("nextDueAt");
CREATE INDEX "ReminderEvent_userId_timestamp_idx" ON "ReminderEvent"("userId", "timestamp");
CREATE INDEX "ReminderEvent_reminderId_timestamp_idx" ON "ReminderEvent"("reminderId", "timestamp");
CREATE UNIQUE INDEX "Device_userId_pushToken_key" ON "Device"("userId", "pushToken");
CREATE INDEX "Device_userId_idx" ON "Device"("userId");
CREATE UNIQUE INDEX "UserPrivacySetting_userId_key" ON "UserPrivacySetting"("userId");

ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LocationTrigger" ADD CONSTRAINT "LocationTrigger_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "Reminder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TimeTrigger" ADD CONSTRAINT "TimeTrigger_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "Reminder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Habit" ADD CONSTRAINT "Habit_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "Reminder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReminderEvent" ADD CONSTRAINT "ReminderEvent_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "Reminder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReminderEvent" ADD CONSTRAINT "ReminderEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Device" ADD CONSTRAINT "Device_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserPrivacySetting" ADD CONSTRAINT "UserPrivacySetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
