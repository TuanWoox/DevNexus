-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('Video', 'Image', 'File');

-- CreateTable
CREATE TABLE "Media" (
    "Id" TEXT NOT NULL,
    "MediaName" TEXT NOT NULL,
    "Type" "MediaType" NOT NULL DEFAULT 'Image',
    "MessageId" INTEGER NOT NULL,
    "DateCreated" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "DateModified" TIMESTAMP(3),
    "Deleted" BOOLEAN NOT NULL DEFAULT false,
    "DateDeleted" TIMESTAMP(3),

    CONSTRAINT "Media_pkey" PRIMARY KEY ("Id")
);

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_MessageId_fkey" FOREIGN KEY ("MessageId") REFERENCES "Message"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;
