/*
  Warnings:

  - The `EntityType` column on the `Notification` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `Type` on the `Notification` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `EntityType` on the `NotificationMuteSetting` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `Type` on the `NotificationMuteSetting` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "Type",
ADD COLUMN     "Type" INTEGER NOT NULL,
DROP COLUMN "EntityType",
ADD COLUMN     "EntityType" INTEGER;

-- AlterTable
ALTER TABLE "NotificationMuteSetting" DROP COLUMN "EntityType",
ADD COLUMN     "EntityType" INTEGER NOT NULL,
DROP COLUMN "Type",
ADD COLUMN     "Type" INTEGER NOT NULL;

-- DropEnum
DROP TYPE "EntityType";

-- DropEnum
DROP TYPE "NotificationType";

-- CreateIndex
CREATE INDEX "NotificationMuteSetting_ProfileId_EntityType_EntityId_idx" ON "NotificationMuteSetting"("ProfileId", "EntityType", "EntityId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationMuteSetting_ProfileId_EntityType_EntityId_Type_key" ON "NotificationMuteSetting"("ProfileId", "EntityType", "EntityId", "Type");
