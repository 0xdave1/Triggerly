ALTER TYPE "MemoryType" ADD VALUE IF NOT EXISTS 'DOCUMENT';

CREATE TYPE "MemorySource" AS ENUM ('MANUAL', 'AI_EXTRACTED', 'IMPORTED');
CREATE TYPE "MemoryStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DELETED');
CREATE TYPE "MemoryEventType" AS ENUM ('CREATED', 'UPDATED', 'ARCHIVED', 'DELETED', 'USED_IN_TRIGGER');

ALTER TABLE "UserPrivacySetting"
  ADD COLUMN "memoryEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "contactMemoryEnabled" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Memory"
  ADD COLUMN "sourceNext" "MemorySource" NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN "status" "MemoryStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "deletedAt" TIMESTAMP(3);

UPDATE "Memory"
SET
  "sourceNext" = CASE
    WHEN LOWER(COALESCE("source", '')) LIKE '%ai%' THEN 'AI_EXTRACTED'::"MemorySource"
    WHEN LOWER(COALESCE("source", '')) LIKE '%import%' THEN 'IMPORTED'::"MemorySource"
    ELSE 'MANUAL'::"MemorySource"
  END,
  "status" = CASE
    WHEN "archivedAt" IS NOT NULL THEN 'ARCHIVED'::"MemoryStatus"
    ELSE 'ACTIVE'::"MemoryStatus"
  END;

ALTER TABLE "Memory" DROP COLUMN "source";
ALTER TABLE "Memory" RENAME COLUMN "sourceNext" TO "source";

DROP INDEX IF EXISTS "Memory_userId_type_idx";
DROP INDEX IF EXISTS "Memory_userId_archivedAt_idx";
CREATE INDEX "Memory_userId_type_status_idx" ON "Memory"("userId", "type", "status");
CREATE INDEX "Memory_userId_status_idx" ON "Memory"("userId", "status");

CREATE TABLE "MemoryEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "memoryId" TEXT NOT NULL,
  "eventType" "MemoryEventType" NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MemoryEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MemoryEvent_userId_createdAt_idx" ON "MemoryEvent"("userId", "createdAt");
CREATE INDEX "MemoryEvent_memoryId_createdAt_idx" ON "MemoryEvent"("memoryId", "createdAt");
ALTER TABLE "MemoryEvent" ADD CONSTRAINT "MemoryEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MemoryEvent" ADD CONSTRAINT "MemoryEvent_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
