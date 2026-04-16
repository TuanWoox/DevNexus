/*
  Warnings:

  - You are about to drop the column `Members` on the `Chat` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Chat" DROP COLUMN "Members";

-- CreateTable
CREATE TABLE "ProfileChat" (
    "Id" TEXT NOT NULL,
    "ChatId" TEXT NOT NULL,
    "MemberId" VARCHAR(200) NOT NULL,

    CONSTRAINT "ProfileChat_pkey" PRIMARY KEY ("Id")
);

-- AddForeignKey
ALTER TABLE "ProfileChat" ADD CONSTRAINT "ProfileChat_ChatId_fkey" FOREIGN KEY ("ChatId") REFERENCES "Chat"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileChat" ADD CONSTRAINT "ProfileChat_MemberId_fkey" FOREIGN KEY ("MemberId") REFERENCES "Profile"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;
