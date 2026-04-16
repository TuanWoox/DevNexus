-- CreateEnum
CREATE TYPE "ChatRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateTable
CREATE TABLE "Chat" (
    "Id" SERIAL NOT NULL,
    "Name" VARCHAR(200),
    "IsGroup" BOOLEAN NOT NULL DEFAULT false,
    "Members" TEXT[],
    "ChatPictureUrl" TEXT,
    "DateCreated" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "DateModified" TIMESTAMP(3),

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "ChatSetting" (
    "Id" TEXT NOT NULL,
    "NickName" VARCHAR(200),
    "MuteUntil" TIMESTAMP(3),
    "IsMuted" BOOLEAN NOT NULL DEFAULT false,
    "IsPinned" BOOLEAN NOT NULL DEFAULT false,
    "IsArchived" BOOLEAN NOT NULL DEFAULT false,
    "IsRequested" BOOLEAN NOT NULL DEFAULT false,
    "Role" "ChatRole" NOT NULL DEFAULT 'MEMBER',
    "ProfileId" VARCHAR(200) NOT NULL,
    "ChatId" INTEGER NOT NULL,
    "DateCreated" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "DateModified" TIMESTAMP(3),

    CONSTRAINT "ChatSetting_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Message" (
    "Id" SERIAL NOT NULL,
    "Content" TEXT NOT NULL,
    "ReadBy" TEXT[],
    "VisibleTo" TEXT[],
    "SenderId" VARCHAR(200) NOT NULL,
    "ChatId" INTEGER NOT NULL,
    "DateCreated" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "DateModified" TIMESTAMP(3),

    CONSTRAINT "Message_pkey" PRIMARY KEY ("Id")
);

-- CreateIndex
CREATE INDEX "Message_ChatId_Id_idx" ON "Message"("ChatId", "Id");

-- AddForeignKey
ALTER TABLE "ChatSetting" ADD CONSTRAINT "ChatSetting_ProfileId_fkey" FOREIGN KEY ("ProfileId") REFERENCES "Profile"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatSetting" ADD CONSTRAINT "ChatSetting_ChatId_fkey" FOREIGN KEY ("ChatId") REFERENCES "Chat"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_SenderId_fkey" FOREIGN KEY ("SenderId") REFERENCES "Profile"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_ChatId_fkey" FOREIGN KEY ("ChatId") REFERENCES "Chat"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;
