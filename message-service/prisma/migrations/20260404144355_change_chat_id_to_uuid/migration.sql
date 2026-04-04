/*
  Warnings:

  - The primary key for the `Chat` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "ChatSetting" DROP CONSTRAINT "ChatSetting_ChatId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_ChatId_fkey";

-- AlterTable
ALTER TABLE "Chat" DROP CONSTRAINT "Chat_pkey",
ALTER COLUMN "Id" DROP DEFAULT,
ALTER COLUMN "Id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Chat_pkey" PRIMARY KEY ("Id");
DROP SEQUENCE "Chat_Id_seq";

-- AlterTable
ALTER TABLE "ChatSetting" ALTER COLUMN "ChatId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "ChatId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "ChatSetting" ADD CONSTRAINT "ChatSetting_ChatId_fkey" FOREIGN KEY ("ChatId") REFERENCES "Chat"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_ChatId_fkey" FOREIGN KEY ("ChatId") REFERENCES "Chat"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;
