"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useGetCommunityMembers } from "@/hooks/community-members-hooks/use-get-community-members";
import { Button } from "@/components/ui/button";
import { Crown, Shield, User, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { SortOrderType } from "@/constants/sortOrderType";

interface CommunityMemberListProps {
    communityId: string;
    role: string
}

const PAGE_SIZE = 12;

export function CommunityMemberList({ communityId, role }: CommunityMemberListProps) {
    const [pageNumber, setPageNumber] = useState(0);
    const isManager = role === "OWNER" || role === "MODERATOR";

    const payload = {
        size: PAGE_SIZE,
        pageNumber,
        totalElements: 0,
        orders: [{ sort: "dateCreated", sortDir: SortOrderType.DESC, dynamicProperty: "", delimiter: "", dataType: "" }],
        filter: [],
        selected: [],
    };

    const { data: pagedData, isLoading } = useGetCommunityMembers(communityId, payload);

    const members = pagedData?.data ?? [];
    const totalPages = Math.ceil((pagedData?.page?.totalElements ?? 0) / PAGE_SIZE);

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (members.length === 0) {
        return (
            <div className="text-center py-16">
                <p className="text-muted-foreground">No members found.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 px-4 sm:px-6 mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {members.map((member) => {
                    const profile = member.profile;
                    const profileId = member.profileId;
                    const isOwner = member.isOwner;

                    return (
                        <div
                            key={member.id}
                            className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card hover:bg-muted/30 transition-colors group"
                        >
                            {/* Avatar + Link */}
                            <Link
                                href={`/profile/${profileId}`}
                                className="shrink-0"
                                title={`View ${profile?.fullName ?? "profile"}`}
                            >
                                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-muted ring-2 ring-transparent group-hover:ring-primary/30 transition-all">
                                    {profile?.avatarUrl ? (
                                        <Image
                                            src={profile.avatarUrl}
                                            alt={profile.fullName ?? "Member"}
                                            fill
                                            unoptimized
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <User className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                            </Link>

                            {/* Name + Role badge */}
                            <div className="flex-1 min-w-0">
                                <Link
                                    href={`/profile/${profileId}`}
                                    className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate block"
                                >
                                    {profile?.fullName ?? "Unknown User"}
                                </Link>
                                <div className="flex items-center gap-1 mt-0.5">
                                    {isOwner ? (
                                        <span className="inline-flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                                            <Crown className="h-3 w-3" />
                                            Owner
                                        </span>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">Member</span>
                                    )}
                                </div>
                            </div>

                            {/* Manager-only: link to profile for verification */}
                            {isManager && (
                                <Link
                                    href={`/profile/${profileId}`}
                                    className="shrink-0 text-xs text-muted-foreground hover:text-primary transition-colors"
                                    title="View full profile"
                                >
                                    <Shield className="h-4 w-4" />
                                </Link>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 pt-4">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={pageNumber === 0}
                        onClick={() => setPageNumber((p) => p - 1)}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground font-medium">
                        Page {pageNumber + 1} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={pageNumber >= totalPages - 1}
                        onClick={() => setPageNumber((p) => p + 1)}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
