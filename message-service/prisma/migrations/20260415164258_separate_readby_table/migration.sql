/*
  Warnings:

  - You are about to drop the column `ReadBy` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `VisibleTo` on the `Message` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Message" DROP COLUMN "ReadBy",
DROP COLUMN "VisibleTo";

-- CreateTable
CREATE TABLE "MessageReadReceipt" (
    "MessageId" INTEGER NOT NULL,
    "ReaderId" VARCHAR(200) NOT NULL,
    "ReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageReadReceipt_pkey" PRIMARY KEY ("MessageId","ReaderId")
);

-- CreateIndex
CREATE INDEX "MessageReadReceipt_ReaderId_idx" ON "MessageReadReceipt"("ReaderId");

-- AddForeignKey
ALTER TABLE "MessageReadReceipt" ADD CONSTRAINT "MessageReadReceipt_MessageId_fkey" FOREIGN KEY ("MessageId") REFERENCES "Message"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReadReceipt" ADD CONSTRAINT "MessageReadReceipt_ReaderId_fkey" FOREIGN KEY ("ReaderId") REFERENCES "Profile"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;
