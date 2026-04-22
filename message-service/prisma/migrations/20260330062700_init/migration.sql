-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "fullName" VARCHAR(200) NOT NULL,
    "avatarUrl" VARCHAR(500),
    "bio" VARCHAR(500),
    "reputationPoints" INTEGER NOT NULL DEFAULT 0,
    "techStacks" TEXT[],
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);
