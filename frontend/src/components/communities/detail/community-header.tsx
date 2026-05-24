"use client";

import { useState } from "react";
import { SelectCommunityDTO } from "@/types/community/select-community-dto";
import Image from "next/image";
import { ClipboardList, Clock3, Lock, Users, CalendarDays, ImageIcon, Settings, Plus, Sparkles, ShieldAlert, ChevronDown, LogOut, Loader2 } from "lucide-react";
import { CommunityActionButton } from "./community-action-button";
import { CommunityMediaUploadModal } from "./community-media-upload-modal";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLeaveCommunity } from "@/hooks/community-members-hooks/use-leave-community";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CommunityHeaderProps {
    community: SelectCommunityDTO;
    activeTab?: string;
}

export function CommunityHeader({ community, activeTab }: CommunityHeaderProps) {
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const { mutate: leaveCommunity, isPending: isLeaving } = useLeaveCommunity();

    const role = community?.currentUserRole;
    const hasManageAccess = role === "OWNER" || role === "MODERATOR";

    const formattedDate = community.dateCreated
        ? new Date(community.dateCreated).toLocaleDateString()
        : "N/A";

    return (
        <div className="relative w-full">
            {/* Cover Photo */}
            <div
                className={`relative h-48 md:h-64 w-full bg-linear-to-r from-primary/20 to-primary/5 transition-opacity ${hasManageAccess ? 'group cursor-pointer' : ''}`}
                onClick={() => { if (hasManageAccess) setIsUploadModalOpen(true) }}
            >
                {community.communityCoverPhotoUrl ? (
                    <Image
                        src={community.communityCoverPhotoUrl}
                        alt={community.name}
                        fill
                        unoptimized
                        className={`object-cover ${hasManageAccess ? 'transition-opacity group-hover:opacity-80' : ''}`}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                        <Users className="w-24 h-24 text-primary" />
                    </div>
                )}
                {hasManageAccess && (
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
                    <div className="w-full md:w-auto shrink-0 flex flex-row flex-wrap items-center gap-3 md:justify-end">
                        {/* Guest / Pending / Banned Join Actions */}
                        {(role !== "OWNER" && role !== "MODERATOR" && role !== "MEMBER") && (
                            <CommunityActionButton communityId={community.id} role={role} />
                        )}

                        {/* Member / Moderator / Owner Consolidated Console */}
                        {(role === "OWNER" || role === "MODERATOR" || role === "MEMBER") && (
                            <>
                                {/* Primary Action: Create Post */}
                                <Button asChild className="btn-ai text-white cursor-pointer" size="lg">
                                    <Link href={`/post/create?communityId=${community.id}&communityName=${encodeURIComponent(community.name)}&communityIconUrl=${encodeURIComponent(community.communityCoverPhotoUrl || '')}${activeTab === 'qa' ? '&type=qa' : ''}`}>
                                        {activeTab === 'qa' ? <Plus className="w-5 h-5 mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                        {activeTab === 'qa' ? 'Ask Question' : 'Create Post'}
                                    </Link>
                                </Button>

                                {/* Consolidated Action Dropdown */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="lg" className="gap-2 cursor-pointer">
                                            <Settings className="w-4 h-4" />
                                            <span>{hasManageAccess ? "Manage" : "Options"}</span>
                                            <ChevronDown className="w-4 h-4 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-52">
                                        {/* Moderator / Owner Actions */}
                                        {hasManageAccess && (
                                            <>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/communities/${community.id}/moderate-pending`} className="w-full cursor-pointer flex items-center">
                                                        <ClipboardList className="mr-2 h-4 w-4" />
                                                        Pending Queue
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/communities/${community.id}/settings`} className="w-full cursor-pointer flex items-center">
                                                        <Settings className="mr-2 h-4 w-4" />
                                                        Settings
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                            </>
                                        )}

                                        {/* User Utilities */}
                                        <DropdownMenuItem asChild>
                                            <Link href={`/communities/${community.id}/pending-posts`} className="w-full cursor-pointer flex items-center">
                                                <Clock3 className="mr-2 h-4 w-4" />
                                                My Pending Posts
                                            </Link>
                                        </DropdownMenuItem>

                                        <DropdownMenuItem asChild>
                                            <Link href={`/communities/${community.id}/reports`} className="w-full cursor-pointer flex items-center text-amber-500 focus:text-amber-600">
                                                <ShieldAlert className="mr-2 h-4 w-4" />
                                                Reports
                                            </Link>
                                        </DropdownMenuItem>

                                        {/* Leave Community Action (Not for Owner) */}
                                        {role !== "OWNER" && (
                                            <>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem 
                                                    className="text-destructive focus:text-destructive focus:bg-destructive/10 dark:focus:bg-destructive/20 cursor-pointer flex items-center"
                                                    disabled={isLeaving}
                                                    onClick={() => leaveCommunity(community.id)}
                                                >
                                                    {isLeaving ? (
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <LogOut className="mr-2 h-4 w-4" />
                                                    )}
                                                    Leave Community
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {hasManageAccess && (
                <CommunityMediaUploadModal
                    isOpen={isUploadModalOpen}
                    onClose={() => setIsUploadModalOpen(false)}
                    communityId={community.id}
                />
            )}
        </div>
    );
}
