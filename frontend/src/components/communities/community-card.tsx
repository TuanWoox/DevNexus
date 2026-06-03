"use client";

import { SelectCommunityDTO } from "@/types/community/select-community-dto";
import Image from "next/image";
import Link from "next/link";
import { Lock, Users, Crown, Shield, User, Clock, UserPlus, X, Loader2, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useJoinCommunity } from "@/hooks/community-members-hooks/use-join-community";
import { useCancelRequest } from "@/hooks/community-requests-hooks/use-cancel-request";
import { useSubmitRecommendationFeedback } from "@/hooks/recommendation-hooks/use-submit-recommendation-feedback";
import { cn } from "@/lib/utils";

interface CommunityCardProps {
    community: SelectCommunityDTO;
    isRecommendation?: boolean;
}

const roleConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
    OWNER: {
        label: "Owner",
        icon: <Crown className="w-3 h-3" />,
        className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300 dark:border-amber-700",
    },
    MODERATOR: {
        label: "Mod",
        icon: <Shield className="w-3 h-3" />,
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-300 dark:border-blue-700",
    },
    MEMBER: {
        label: "Member",
        icon: <User className="w-3 h-3" />,
        className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-700",
    },
    PENDING: {
        label: "Pending",
        icon: <Clock className="w-3 h-3" />,
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700",
    },
    GUEST: {
        label: "Guest",
        icon: <UserPlus className="w-3 h-3" />,
        className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-300 dark:border-gray-600",
    },
};

export function CommunityCard({ community, isRecommendation = false }: CommunityCardProps) {
    const formattedDate = community.dateCreated
        ? new Date(community.dateCreated).toLocaleDateString()
        : "N/A";

    const role = community.currentUserRole ?? "GUEST";
    const roleInfo = roleConfig[role] ?? roleConfig.GUEST;

    const { mutate: joinCommunity, isPending: isJoining } = useJoinCommunity();
    const { mutate: cancelRequest, isPending: isCancelling } = useCancelRequest();
    const submitFeedback = useSubmitRecommendationFeedback();

    const handleJoin = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        joinCommunity(community.id);
    };

    const handleCancel = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        cancelRequest(community.id);
    };

    const handleDismiss = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        submitFeedback.mutate({
            communityId: community.id,
            feedbackType: "hide",
        });
    };

    return (
        <Card className="h-full flex flex-col card-hover card transition-all duration-300 overflow-hidden backdrop-blur-sm group relative border-default/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
            {/* Overlay Link for the whole card */}
            <Link
                href={`/communities/${community.id}`}
                className="absolute inset-0 z-0"
                aria-label={`View ${community.name}`}
            />

            {/* Cover Photo Area */}
            <div className="relative h-32 w-full bg-linear-to-r from-primary/20 to-primary/5 overflow-hidden">
                {community.communityCoverPhotoUrl ? (
                    <Image
                        src={community.communityCoverPhotoUrl}
                        alt={community.name}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                        <Users className="w-16 h-16 text-primary" />
                    </div>
                )}
                {/* Private Lock Icon */}
                {community.isPrivate && (
                    <div className={cn(
                        "absolute top-2 bg-background/80 backdrop-blur-sm p-1.5 rounded-full text-muted-foreground shadow-sm z-10",
                        isRecommendation ? "right-10" : "right-2"
                    )}>
                        <Lock className="w-4 h-4" />
                    </div>
                )}
                {/* Recommendation Dismiss Button */}
                {isRecommendation && (
                    <button
                        onClick={handleDismiss}
                        disabled={submitFeedback.isPending}
                        className="absolute top-2 right-2 bg-background/80 hover:bg-destructive hover:text-destructive-foreground backdrop-blur-sm p-1.5 rounded-full text-muted-foreground shadow-sm z-10 transition-colors duration-200 cursor-pointer border-0"
                        title="Dismiss recommendation"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            <CardHeader className="px-4 space-y-1">
                <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-xl line-clamp-1 break-all group-hover:text-primary transition-colors flex-1 min-w-0">
                        {community.name}
                    </h3>
                    {/* Role Badge */}
                    <Badge
                        variant="outline"
                        className={`shrink-0 flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium border transition-transform group-hover:scale-105 ${roleInfo.className}`}
                    >
                        {roleInfo.icon}
                        {roleInfo.label}
                    </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                    Est. {formattedDate}
                </p>
            </CardHeader>

            <CardContent className="p-4 pt-0 flex-1 flex flex-col gap-3">
                <p className="text-sm text-muted-foreground line-clamp-3 flex-1 leading-relaxed">
                    {community.description || "No description provided."}
                </p>

                {/* Action Buttons — shown based on role */}
                <div className="mt-auto pt-2 relative z-10">
                    {role === "GUEST" && (
                        <Button
                            size="sm"
                            variant="default"
                            className="w-full gap-1.5 text-xs h-9 font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] btn-primary"
                            onClick={handleJoin}
                            disabled={isJoining}
                        >
                            {isJoining ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <UserPlus className="w-3.5 h-3.5" />
                            )}
                            {isJoining ? "Joining..." : "Join Community"}
                        </Button>
                    )}
                    {role === "PENDING" && (
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 gap-1.5 text-xs h-9 text-muted-foreground bg-muted/30 border-muted"
                                disabled
                            >
                                <Clock className="w-3.5 h-3.5" />
                                Requested
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="gap-1.5 text-xs h-9 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-300 hover:scale-[1.02]"
                                onClick={handleCancel}
                                disabled={isCancelling}
                            >
                                {isCancelling ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <X className="w-3.5 h-3.5" />
                                )}
                                Cancel
                            </Button>
                        </div>
                    )}
                    {(role === "OWNER" || role === "MODERATOR" || role === "MEMBER") && (
                        <Button
                            size="sm"
                            variant="secondary"
                            className="w-full gap-1.5 text-xs h-9 font-medium transition-all duration-300 hover:scale-[1.02] hover:bg-secondary/80 group/btn"
                            asChild
                        >
                            <Link href={`/communities/${community.id}`}>
                                <ExternalLink className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                                View Details
                            </Link>
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

