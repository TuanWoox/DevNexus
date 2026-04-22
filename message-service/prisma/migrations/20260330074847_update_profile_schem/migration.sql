/*
  Warnings:

  - The primary key for the `Profile` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `avatarUrl` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `bio` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `fullName` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `isPrivate` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `reputationPoints` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `techStacks` on the `Profile` table. All the data in the column will be lost.
  - Added the required column `ApplicationUserId` to the `Profile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `FullName` to the `Profile` table without a default value. This is not possible if the table is not empty.
  - The required column `Id` was added to the `Profile` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "Profile" DROP CONSTRAINT "Profile_pkey",
DROP COLUMN "avatarUrl",
DROP COLUMN "bio",
DROP COLUMN "fullName",
DROP COLUMN "id",
DROP COLUMN "isPrivate",
DROP COLUMN "reputationPoints",
DROP COLUMN "techStacks",
ADD COLUMN     "ApplicationUserId" VARCHAR(200) NOT NULL,
ADD COLUMN     "AvatarUrl" VARCHAR(500),
ADD COLUMN     "Bio" VARCHAR(500),
ADD COLUMN     "FullName" VARCHAR(200) NOT NULL,
ADD COLUMN     "Id" TEXT NOT NULL,
ADD COLUMN     "IsPrivate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ReputationPoints" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "TechStacks" TEXT[],
ADD CONSTRAINT "Profile_pkey" PRIMARY KEY ("Id");
