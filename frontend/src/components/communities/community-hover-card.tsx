"use client";

import { useState } from "react";
import { Ban, ExternalLink, Lock, Users, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetCommunityById } from "@/hooks/community-hooks/use-get-community-by-id";
import { useBlockCommunity } from "@/hooks/profile-community-block-hooks/use-block-community";

export interface CommunityHoverCardInfo {
    id: string;
    name?: string | null;
    description?: string | null;
    communityCoverPhotoUrl?: string | null;
    memberCount?: number | null;
    isPrivate?: boolean | null;
    slug?: string | null;
}

interface CommunityHoverCardProps {
    communityId: string;
    community?: CommunityHoverCardInfo | null;
    children: React.ReactNode;
    side?: "top" | "right" | "bottom" | "left";
}

function formatMemberCount(count?: number | null) {
    if (typeof count !== "number") return "Members";
    return `${count.toLocaleString()} ${count === 1 ? "member" : "members"}`;
}

export function CommunityHoverCard({
    communityId,
    community,
    children,
    side = "top",
}: CommunityHoverCardProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const shouldFetch = open && Boolean(communityId);
    const blockCommunityMutation = useBlockCommunity();

    const { data: loadedCommunity, isLoading: isCommunityLoading } = useGetCommunityById(communityId, shouldFetch);

    const resolvedCommunity: CommunityHoverCardInfo = {
        ...community,
        ...loadedCommunity,
        id: communityId,
    };
    const name = resolvedCommunity.name || "Community";
    const description = resolvedCommunity.description?.trim() || "No description yet.";
    const memberCount = resolvedCommunity.memberCount;
    const avatarUrl = resolvedCommunity.communityCoverPhotoUrl || undefined;
    const isLoading = isCommunityLoading && !resolvedCommunity.name;

    const handleViewCommunity = () => {
        setOpen(false);
        router.push(`/communities/${communityId}`);
    };

    const handleBlockCommunity = () => {
        blockCommunityMutation.mutate(communityId, {
            onSuccess: (data) => {
                if (data.result) setOpen(false);
            },
        });
    };

    return (
        <HoverCard open={open} onOpenChange={setOpen} openDelay={300} closeDelay={100}>
            <HoverCardTrigger asChild>{children}</HoverCardTrigger>
            <HoverCardContent
                side={side}
                align="start"
                sideOffset={8}
                alignOffset={8}
                collisionPadding={12}
                sticky="always"
                className="w-80 overflow-hidden p-0"
            >
                <div className="relative bg-popover text-popover-foreground">
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="absolute right-2 top-2 z-10 rounded-full bg-background/80 p-1 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:bg-accent hover:text-foreground"
                        aria-label="Close community hover card"
                    >
                        <X className="h-4 w-4" />
                    </button>

                    <div className="relative h-28 bg-muted">
                        {avatarUrl ? (
                            <Image src={avatarUrl} alt="" fill unoptimized className="object-cover" />
                        ) : (
                            <div className="flex size-full items-center justify-center bg-primary/10 text-primary">
                                <Users className="h-8 w-8" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-linear-to-t from-black/30 via-transparent to-transparent" />
                    </div>

                    <div className="px-4 pb-4">
                        <div className="pt-4">
                            {isLoading ? (
                                <Skeleton className="h-5 w-40" />
                            ) : (
                                <h3 className="truncate text-base font-semibold text-foreground">{name}</h3>
                            )}
                            <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                {resolvedCommunity.isPrivate ? <Lock className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
                                <span>{isCommunityLoading && typeof memberCount !== "number" ? "Loading members..." : formatMemberCount(memberCount)}</span>
                            </div>
                        </div>

                        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-foreground/80">
                            {isLoading ? "Loading community..." : description}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 border-t border-border px-4 py-3">
                        <Button variant="outline" size="sm" onClick={handleViewCommunity} className="w-full cursor-pointer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleBlockCommunity}
                            disabled={blockCommunityMutation.isPending}
                            className="w-full cursor-pointer"
                        >
                            <Ban className="mr-2 h-4 w-4" />
                            {blockCommunityMutation.isPending ? "Blocking..." : "Block"}
                        </Button>
                    </div>
                </div>
            </HoverCardContent>
        </HoverCard>
    );
}
