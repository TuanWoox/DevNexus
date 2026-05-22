"use client";

import Link from "next/link";
import { UserAvatar } from "@/components/shared/user-avatar";
import { UnavailableProfileHoverCard } from "@/components/profile/unavailable-profile-hover-card";
import { ProfileHoverCard } from "@/components/profile/profile-hover-card";
import type { ProfileHoverCardAuthor } from "@/components/profile/profile-hover-card-content";
import { cn } from "@/lib/utils";

interface ManagementProfileCellProps {
    profileId: string;
    fullName?: string | null;
    avatarUrl?: string | null;
    profilePreview?: ProfileHoverCardAuthor | null;
    isRestricted?: boolean;
    restrictedMessage?: string | null;
    labelFallback: string;
    subLabel?: string;
}

export function ManagementProfileCell({
    profileId,
    fullName,
    avatarUrl,
    profilePreview,
    isRestricted,
    restrictedMessage,
    labelFallback,
    subLabel,
}: ManagementProfileCellProps) {
    const displayName = profilePreview?.fullName || fullName || labelFallback;
    const displayAvatarUrl = profilePreview?.avatarUrl ?? avatarUrl ?? undefined;
    const hoverAuthor: ProfileHoverCardAuthor = {
        fullName: displayName,
        avatarUrl: displayAvatarUrl,
        backgroundUrl: profilePreview?.backgroundUrl,
        bio: profilePreview?.bio,
        reputationPoints: profilePreview?.reputationPoints,
        techStacks: profilePreview?.techStacks,
        isPrivate: profilePreview?.isPrivate,
    };

    const content = (
        <span
            className={cn(
                "flex w-fit items-center gap-3",
                isRestricted ? "cursor-default" : "group"
            )}
        >
            <UserAvatar
                avatarUrl={displayAvatarUrl}
                fullName={displayName}
                className="h-8 w-8 shrink-0"
            />
            <span className="flex min-w-0 flex-col">
                <span className={cn(
                    "truncate text-sm font-medium",
                    !isRestricted && "group-hover:text-primary transition-colors"
                )}>
                    {displayName}
                </span>
                <span className="text-xs text-muted-foreground">
                    {isRestricted ? "Profile unavailable" : subLabel || "View profile ->"}
                </span>
            </span>
        </span>
    );

    if (isRestricted) {
        return (
            <UnavailableProfileHoverCard
                fullName={displayName}
                avatarUrl={displayAvatarUrl}
                message={restrictedMessage}
            >
                {content}
            </UnavailableProfileHoverCard>
        );
    }

    return (
        <ProfileHoverCard
            profileId={profileId}
            author={hoverAuthor}
            side="right"
            showMessageAction={false}
            showBlockAction={false}
        >
            <Link href={`/profile/${profileId}`} className="block w-fit">
                {content}
            </Link>
        </ProfileHoverCard>
    );
}
