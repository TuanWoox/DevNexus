-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "IsEdited" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "MessageEditHistory" (
    "Id" SERIAL NOT NULL,
    "MessageId" INTEGER NOT NULL,
    "Content" TEXT NOT NULL,
    "EditedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageEditHistory_pkey" PRIMARY KEY ("Id")
);

-- CreateIndex
CREATE INDEX "MessageEditHistory_MessageId_Id_idx" ON "MessageEditHistory"("MessageId", "Id");

-- AddForeignKey
ALTER TABLE "MessageEditHistory" ADD CONSTRAINT "MessageEditHistory_MessageId_fkey" FOREIGN KEY ("MessageId") REFERENCES "Message"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;
