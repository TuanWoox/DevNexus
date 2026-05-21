-- Drop foreign keys to the local Profile cache before dropping the table.
ALTER TABLE "Notification" DROP CONSTRAINT IF EXISTS "Notification_ActorId_fkey";
ALTER TABLE "Notification" DROP CONSTRAINT IF EXISTS "Notification_RecipientId_fkey";
ALTER TABLE "NotificationGlobalSetting" DROP CONSTRAINT IF EXISTS "NotificationGlobalSetting_ProfileId_fkey";
ALTER TABLE "NotificationMuteSetting" DROP CONSTRAINT IF EXISTS "NotificationMuteSetting_ProfileId_fkey";

-- Store actor snapshot data directly on Notification.
ALTER TABLE "Notification"
ADD COLUMN IF NOT EXISTS "ActorType" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "ActorName" VARCHAR(200),
ADD COLUMN IF NOT EXISTS "ActorAvatarUrl" VARCHAR(500);

-- Remove the local profile cache. Notifications no longer join to it.
DROP TABLE IF EXISTS "Profile";
