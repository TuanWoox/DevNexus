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
                                        <Button variant="outline" size="lg" className="gap-2 cursor-pointer hover:bg-muted active:scale-[0.98] transition-all duration-150">
                                            <Settings className="w-4 h-4 text-muted-foreground" />
                                            <span className="font-medium">{hasManageAccess ? "Manage" : "Options"}</span>
                                            <ChevronDown className="w-4 h-4 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-80 p-2 rounded-2xl border border-border/80 bg-popover shadow-xl transition-all duration-200">
                                        {/* Moderator / Owner Actions */}
                                        {hasManageAccess && (
                                            <div className="space-y-1">
                                                <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">
                                                    Administration
                                                </div>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/communities/${community.id}/moderate-pending`} className="group/item flex items-center gap-3 w-full rounded-xl p-2 cursor-pointer transition-all duration-200 hover:bg-emerald-500/5 focus:bg-emerald-500/5 outline-hidden">
                                                        <div className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 group-hover/item:bg-emerald-500/20 group-hover/item:scale-105 transition-all duration-200">
                                                            <ClipboardList className="h-4.5 w-4.5" />
                                                        </div>
                                                        <div className="flex flex-col gap-0.5 min-w-0">
                                                            <span className="text-xs font-semibold text-foreground tracking-tight group-hover/item:text-emerald-600 transition-colors">
                                                                Pending Queue
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground leading-normal">
                                                                Review join requests & content approvals
                                                            </span>
                                                        </div>
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/communities/${community.id}/settings`} className="group/item flex items-center gap-3 w-full rounded-xl p-2 cursor-pointer transition-all duration-200 hover:bg-emerald-500/5 focus:bg-emerald-500/5 outline-hidden">
                                                        <div className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 group-hover/item:bg-emerald-500/20 group-hover/item:scale-105 transition-all duration-200">
                                                            <Settings className="h-4.5 w-4.5" />
                                                        </div>
                                                        <div className="flex flex-col gap-0.5 min-w-0">
                                                            <span className="text-xs font-semibold text-foreground tracking-tight group-hover/item:text-emerald-600 transition-colors">
                                                                Settings
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground leading-normal">
                                                                Manage configurations & preferences
                                                            </span>
                                                        </div>
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="my-1.5 opacity-60" />
                                            </div>
                                        )}

                                        {/* User Utilities */}
                                        <div className="space-y-1">
                                            <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">
                                                Your Space
                                            </div>
                                            <DropdownMenuItem asChild>
                                                <Link href={`/communities/${community.id}/pending-posts`} className="group/item flex items-center gap-3 w-full rounded-xl p-2 cursor-pointer transition-all duration-200 hover:bg-primary/5 focus:bg-primary/5 outline-hidden">
                                                    <div className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg bg-primary/10 text-primary group-hover/item:bg-primary/20 group-hover/item:scale-105 transition-all duration-200">
                                                        <Clock3 className="h-4.5 w-4.5" />
                                                    </div>
                                                    <div className="flex flex-col gap-0.5 min-w-0">
                                                        <span className="text-xs font-semibold text-foreground tracking-tight group-hover/item:text-primary transition-colors">
                                                            My Pending Posts
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground leading-normal">
                                                            Track your submitted posts awaiting approval
                                                        </span>
                                                    </div>
                                                </Link>
                                            </DropdownMenuItem>
                                        </div>

                                        <DropdownMenuSeparator className="my-1.5 opacity-60" />

                                        {/* Safety & Options */}
                                        <div className="space-y-1">
                                            <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">
                                                Safety & Options
                                            </div>
                                            <DropdownMenuItem asChild>
                                                <Link href={`/communities/${community.id}/reports`} className="group/item flex items-center gap-3 w-full rounded-xl p-2 cursor-pointer transition-all duration-200 hover:bg-amber-500/5 focus:bg-amber-500/5 outline-hidden">
                                                    <div className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 group-hover/item:bg-amber-500/20 group-hover/item:scale-105 transition-all duration-200">
                                                        <ShieldAlert className="h-4.5 w-4.5" />
                                                    </div>
                                                    <div className="flex flex-col gap-0.5 min-w-0">
                                                        <span className="text-xs font-semibold text-foreground tracking-tight group-hover/item:text-amber-600 transition-colors">
                                                            Reports
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground leading-normal">
                                                            Flag or check community violations & issues
                                                        </span>
                                                    </div>
                                                </Link>
                                            </DropdownMenuItem>

                                            {/* Leave Community Action (Not for Owner) */}
                                            {role !== "OWNER" && (
                                                <DropdownMenuItem 
                                                    className="group/item flex items-center gap-3 w-full rounded-xl p-2 cursor-pointer transition-all duration-200 hover:bg-rose-500/10 focus:bg-rose-500/10 text-destructive focus:text-destructive outline-hidden"
                                                    disabled={isLeaving}
                                                    onClick={() => leaveCommunity(community.id)}
                                                >
                                                    <div className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 group-hover/item:bg-rose-500/20 group-hover/item:scale-105 transition-all duration-200">
                                                        {isLeaving ? (
                                                            <Loader2 className="h-4.5 w-4.5 animate-spin" />
                                                        ) : (
                                                            <LogOut className="h-4.5 w-4.5" />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col gap-0.5 min-w-0">
                                                        <span className="text-xs font-semibold group-hover/item:text-rose-600 transition-colors">
                                                            Leave Community
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground/80 leading-normal">
                                                            Exit this community and remove membership
                                                        </span>
                                                    </div>
                                                </DropdownMenuItem>
                                            )}
                                        </div>
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
