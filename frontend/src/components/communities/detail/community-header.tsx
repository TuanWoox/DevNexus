"use client";

import { useState, useMemo } from "react";
import { SelectCommunityDTO } from "@/types/community/select-community-dto";
import Image from "next/image";
import { Lock, Users, CalendarDays, ImageIcon, Settings } from "lucide-react";
import { JoinButton } from "./join-button";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useGetCommunityModerators } from "@/hooks/community-moderators-hooks/use-get-community-moderators";
import { SortOrderType } from "@/constants/sortOrderType";
import { CommunityMediaUploadModal } from "./community-media-upload-modal";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FilterType } from "@/constants/filterType";

interface CommunityHeaderProps {
    community: SelectCommunityDTO;
}

export function CommunityHeader({ community }: CommunityHeaderProps) {
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const { user } = useSelector((state: RootState) => state.auth);

    // Check if user is a moderator
    const modPagePayload = useMemo(() => ({
        size: 1,
        pageNumber: 0,
        totalElements: 0,
        orders: [{ sort: "DateCreated", sortDir: SortOrderType.DESC, dynamicProperty: "", delimiter: "", dataType: "datetime" }],
        filter: user?.profileId ? [
            {
                prop: "ModeratorId",
                value: user.profileId,
                filterType: FilterType.Text,
                filterOperator: 0,
                dynamicProperty: "",
                delimiter: ""
            }
        ] : [],
        selected: []
    }), [user?.profileId]);

    const { data: modData } = useGetCommunityModerators(community.id, modPagePayload);

    const isOwner = user?.profileId === community.ownerId;
    const isModerator = (modData?.data && modData.data.length > 0);
    const hasAccess = isOwner || isModerator;

    const formattedDate = community.dateCreated
        ? new Date(community.dateCreated).toLocaleDateString()
        : "N/A";

    return (
        <div className="relative w-full bg-card border-b shadow-sm">
            {/* Cover Photo */}
            <div
                className={`relative h-48 md:h-64 w-full bg-gradient-to-r from-primary/20 to-primary/5 transition-opacity ${hasAccess ? 'group cursor-pointer' : ''}`}
                onClick={() => { if (hasAccess) setIsUploadModalOpen(true) }}
            >
                {community.communityCoverPhotoUrl ? (
                    <Image
                        src={community.communityCoverPhotoUrl}
                        alt={community.name}
                        fill
                        unoptimized
                        className={`object-cover ${hasAccess ? 'transition-opacity group-hover:opacity-80' : ''}`}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                        <Users className="w-24 h-24 text-primary" />
                    </div>
                )}
                {hasAccess && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex flex-col items-center text-white">
                            <ImageIcon className="w-10 h-10 mb-2" />
                            <span className="font-semibold shadow-sm text-lg">Update Cover</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Community Info */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between py-8 gap-6">
                    {/* Text Details */}
                    <div className="flex-1 space-y-4">
                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-2xl md:text-4xl font-bold text-foreground">
                                    {community.name}
                                </h1>
                                {community.isPrivate && (
                                    <div className="flex items-center justify-center bg-muted p-1.5 rounded-full">
                                        <Lock className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                <span className="font-mono bg-subtle px-2 py-0.5 rounded-md text-primary">
                                    c/{community.slug || community.id}
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <CalendarDays className="w-4 h-4" />
                                    <span>Created on {formattedDate}</span>
                                </div>
                            </div>
                        </div>

                        <p className="text-body whitespace-pre-wrap leading-relaxed max-w-3xl text-sm md:text-base">
                            {community.description || "No description provided for this community."}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="w-full md:w-auto shrink-0 flex flex-col sm:flex-row md:flex-col gap-3">
                        <JoinButton community={community} />
                        {hasAccess && (
                            <Button asChild variant="outline" className="w-full" size="lg">
                                <Link href={`/communities/${community.id}/settings`}>
                                    <Settings className="w-4 h-4 mr-2" />
                                    Settings
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {hasAccess && (
                <CommunityMediaUploadModal
                    isOpen={isUploadModalOpen}
                    onClose={() => setIsUploadModalOpen(false)}
                    communityId={community.id}
                />
            )}
        </div>
    );
}
