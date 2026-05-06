-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('UPVOTE_POST', 'DOWNVOTE_POST', 'UPVOTE_ANSWER', 'DOWNVOTE_ANSWER', 'UPVOTE_COMMENT', 'DOWNVOTE_COMMENT', 'NEW_ANSWER', 'COMMENT_POST', 'COMMENT_ANSWER', 'REPLY_COMMENT', 'ANSWER_ACCEPTED', 'FOLLOW_USER', 'FOLLOW_REQUEST', 'FOLLOW_ACCEPTED', 'COMMUNITY_INVITE', 'COMMUNITY_JOIN_REQUEST', 'COMMUNITY_POST', 'COMMUNITY_ROLE_CHANGE', 'COMMUNITY_BAN', 'NEW_MESSAGE', 'MESSAGE_REQUEST', 'MODERATION_RESULT', 'REPUTATION_MILESTONE', 'SYSTEM_ANNOUNCEMENT');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('POST', 'COMMENT', 'ANSWER', 'COMMUNITY', 'PROFILE', 'MESSAGE');

-- CreateTable
CREATE TABLE "Notification" (
    "Id" TEXT NOT NULL,
    "RecipientId" VARCHAR(200) NOT NULL,
    "Type" "NotificationType" NOT NULL,
    "ActorId" VARCHAR(200),
    "ActorName" VARCHAR(200),
    "ActorAvatarUrl" VARCHAR(500),
    "EntityType" "EntityType",
    "EntityId" VARCHAR(200),
    "EntityTitle" TEXT,
    "EntityPreview" TEXT,
    "Message" TEXT NOT NULL,
    "ActionUrl" VARCHAR(500),
    "IsRead" BOOLEAN NOT NULL DEFAULT false,
    "ReadAt" TIMESTAMP(3),
    "GroupKey" VARCHAR(200),
    "AggregatedCount" INTEGER NOT NULL DEFAULT 1,
    "DateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "DateModified" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "NotificationGlobalSetting" (
    "Id" TEXT NOT NULL,
    "ProfileId" VARCHAR(200) NOT NULL,
    "AllNotifications" BOOLEAN NOT NULL DEFAULT true,
    "DateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "DateModified" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationGlobalSetting_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "NotificationMuteSetting" (
    "Id" TEXT NOT NULL,
    "ProfileId" VARCHAR(200) NOT NULL,
    "EntityType" "EntityType" NOT NULL,
    "EntityId" VARCHAR(200) NOT NULL,
    "Type" "NotificationType" NOT NULL,
    "DateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationMuteSetting_pkey" PRIMARY KEY ("Id")
);

-- CreateIndex
CREATE INDEX "Notification_RecipientId_IsRead_DateCreated_idx" ON "Notification"("RecipientId", "IsRead", "DateCreated");

-- CreateIndex
CREATE INDEX "Notification_GroupKey_idx" ON "Notification"("GroupKey");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationGlobalSetting_ProfileId_key" ON "NotificationGlobalSetting"("ProfileId");

-- CreateIndex
CREATE INDEX "NotificationMuteSetting_ProfileId_EntityType_EntityId_idx" ON "NotificationMuteSetting"("ProfileId", "EntityType", "EntityId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationMuteSetting_ProfileId_EntityType_EntityId_Type_key" ON "NotificationMuteSetting"("ProfileId", "EntityType", "EntityId", "Type");
