-- CreateTable
CREATE TABLE "ProfileBlock" (
    "Id" TEXT NOT NULL,
    "OwnerId" VARCHAR(200) NOT NULL,
    "BlockedProfileId" VARCHAR(200) NOT NULL,

    CONSTRAINT "ProfileBlock_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "UserFollow" (
    "Id" TEXT NOT NULL,
    "OwnerId" VARCHAR(200) NOT NULL,
    "FollowingProfileId" VARCHAR(200) NOT NULL,

    CONSTRAINT "UserFollow_pkey" PRIMARY KEY ("Id")
);
