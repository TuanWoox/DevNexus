/*
  Warnings:

  - You are about to drop the column `ActorAvatarUrl` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `ActorName` on the `Notification` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "ActorAvatarUrl",
DROP COLUMN "ActorName";

-- CreateTable
CREATE TABLE "Profile" (
    "Id" TEXT NOT NULL,
    "FullName" VARCHAR(200) NOT NULL,
    "AvatarUrl" VARCHAR(500),
    "BackgroundUrl" VARCHAR(500),
    "Bio" VARCHAR(500),
    "ReputationPoints" INTEGER NOT NULL DEFAULT 0,
    "TechStacks" TEXT[],
    "IsPrivate" BOOLEAN NOT NULL DEFAULT false,
    "ApplicationUserId" VARCHAR(200) NOT NULL,
    "DateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "DateModified" TIMESTAMP(3) NOT NULL,
    "Deleted" BOOLEAN NOT NULL DEFAULT false,
    "DateDeleted" TIMESTAMP(3),

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("Id")
);

-- CreateIndex
CREATE INDEX "Profile_Id_idx" ON "Profile"("Id");

-- CreateIndex
CREATE INDEX "Notification_ActorId_idx" ON "Notification"("ActorId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_RecipientId_fkey" FOREIGN KEY ("RecipientId") REFERENCES "Profile"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_ActorId_fkey" FOREIGN KEY ("ActorId") REFERENCES "Profile"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationGlobalSetting" ADD CONSTRAINT "NotificationGlobalSetting_ProfileId_fkey" FOREIGN KEY ("ProfileId") REFERENCES "Profile"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationMuteSetting" ADD CONSTRAINT "NotificationMuteSetting_ProfileId_fkey" FOREIGN KEY ("ProfileId") REFERENCES "Profile"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;
