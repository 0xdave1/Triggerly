ALTER TABLE "UserPrivacySetting"
  ALTER COLUMN "locationTriggersEnabled" SET DEFAULT false,
  ALTER COLUMN "paymentRemindersEnabled" SET DEFAULT false,
  ALTER COLUMN "priceMemoryEnabled" SET DEFAULT false;
