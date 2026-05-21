"use client";

import { useState } from "react";
import { SelectProfileDTO } from "@/types/profile/select-profile-dto";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Lock, Star, UserPlus, UserCheck, Clock, MessageSquare, MoreHorizontal, Share2, ShieldAlert, UserX, Edit3, Loader2, Users, KeyRound } from "lucide-react";
import { useOpenChatByProfile } from "@/features/messages/hooks/chats/use-open-chat-by-profile";
import { useCreateUserFollow } from "@/hooks/user-follow-hooks/use-create-user-follow";
import { useDeleteFollowById } from "@/hooks/user-follow-hooks/use-delete-follow-by-id";
import { useCancelRequest } from "@/hooks/follow-request-hooks";
import { ConnectionsModal, type ConnectionsTabValue } from "./connections/connections-modal";
import { cn } from "@/lib/utils";
import { ReportDialog } from "@/components/report/report-dialog";
import { ReportTargetType } from "@/types/report/report-target-type";

interface ProfileInfoProps {
    profile: SelectProfileDTO;
    isOwnProfile: boolean;
    onEdit?: () => void;
    onChangePassword?: () => void;
}

export function ProfileInfo({ profile, isOwnProfile, onEdit, onChangePassword }: ProfileInfoProps) {
    const dropdownTriggerId = `profile-menu-trigger-${profile.id}`;
    const { openMessagePopup, isCheckingChat } = useOpenChatByProfile({
        id: profile.id,
        fullName: profile.fullName || "Unknown",
        avatarUrl: profile.avatarUrl,
    });

    // Follow actions
    const createFollow = useCreateUserFollow();
    const deleteFollow = useDeleteFollowById();
    const cancelRequest = useCancelRequest();

    // Connections modal
    const [connectionsModalOpen, setConnectionsModalOpen] = useState(false);
    const [connectionsInitialTab, setConnectionsInitialTab] = useState<ConnectionsTabValue>("followers");
    const [reportDialogOpen, setReportDialogOpen] = useState(false);

    const openConnectionsModal = (tab: ConnectionsTabValue) => {
        setConnectionsInitialTab(tab);
        setConnectionsModalOpen(true);
    };

    const handleMessage = async () => {
        if (isCheckingChat) return;
        await openMessagePopup();
    };

    const handleFollowAction = () => {
        if (profile.followStatus === "following" && profile.currentUserFollowId) {
            deleteFollow.mutate(profile.currentUserFollowId);
        } else if (profile.followStatus === "requested" && profile.currentUserRequestId) {
            cancelRequest.mutate(profile.currentUserRequestId);
        } else {
            createFollow.mutate({ followingProfileId: profile.id });
        }
    };

    const isFollowActionPending = createFollow.isPending || deleteFollow.isPending || cancelRequest.isPending;

    const getFollowButtonConfig = () => {
        switch (profile.followStatus) {
            case "following":
                return { label: "Following", icon: UserCheck, variant: "secondary" as const };
            case "requested":
                return { label: "Requested", icon: Clock, variant: "outline" as const };
            default:
                return { label: "Follow", icon: UserPlus, variant: "default" as const };
        }
    };

    const followConfig = getFollowButtonConfig();

    return (
        <div className="px-4 md:px-10 max-w-5xl mx-auto w-full pb-6">
            {/* Name + private badge + options menu */}
            <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                    {profile.fullName || "User Name"}
                </h1>

                {!isOwnProfile && (
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger id={dropdownTriggerId} asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground border shadow-sm cursor-pointer">
                                <MoreHorizontal className="w-5 h-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                            <DropdownMenuItem
                                className="w-full flex items-center gap-2 p-2.5 text-sm text-body hover:bg-subtle hover:text-heading cursor-pointer rounded-lg transition-colors font-medium"
                            >
                                <Share2 className="w-4 h-4 mr-2" />
                                Share Profile
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onSelect={() => setReportDialogOpen(true)}
                                variant='destructive'
                                className="w-full flex items-center gap-2 p-2.5 text-sm text-destructive cursor-pointer rounded-lg transition-colors font-medium"
                            >
                                <ShieldAlert className="w-4 h-4 mr-2" />
                                Report User
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                variant='destructive'
                                className="w-full flex items-center gap-2 p-2.5 text-sm text-destructive cursor-pointer rounded-lg transition-colors font-medium"
                            >
                                <UserX className="w-4 h-4 mr-2" />
                                Block User
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}

                {profile.isPrivate && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium ml-2">
                        <Lock className="w-3 h-3" />
                        Private
                    </span>
                )}
            </div>

            {/* Bio */}
            {profile.bio && (
                <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
                    {profile.bio}
                </p>
            )}

            {/* Stats row */}
            <div className="flex items-center gap-5 mt-3 text-sm flex-wrap">
                <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-bold text-heading">{profile.reputationPoints || 0}</span>
                    <span className="text-muted-foreground">reputation</span>
                </div>

                {/* Follower count */}
                <button
                    onClick={() => profile.canViewProfile && openConnectionsModal("followers")}
                    disabled={!profile.canViewProfile}
                    className={cn(
                        "flex items-center gap-1.5 transition-colors",
                        profile.canViewProfile
                            ? "hover:text-primary cursor-pointer"
                            : "cursor-default"
                    )}
                >
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="font-bold text-heading">{profile.followerCount || 0}</span>
                    <span className="text-muted-foreground">followers</span>
                </button>

                {/* Following count */}
                <button
                    onClick={() => profile.canViewProfile && openConnectionsModal("following")}
                    disabled={!profile.canViewProfile}
                    className={cn(
                        "flex items-center gap-1.5 transition-colors",
                        profile.canViewProfile
                            ? "hover:text-primary cursor-pointer"
                            : "cursor-default"
                    )}
                >
                    <UserCheck className="w-4 h-4 text-muted-foreground" />
                    <span className="font-bold text-heading">{profile.followingCount || 0}</span>
                    <span className="text-muted-foreground">following</span>
                </button>
            </div>

            {/* Tech stack tags - Ensuring they display */}
            {profile.techStacks && profile.techStacks.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-4">
                    {profile.techStacks.map((tech) => (
                        <span
                            key={tech}
                            className="bg-primary/10 text-primary text-xs px-3 py-1 rounded-full font-medium border border-primary/20 hover:bg-primary/20 transition-colors cursor-default"
                        >
                            {tech}
                        </span>
                    ))}
                </div>
            ) : isOwnProfile && (
                <p className="mt-4 text-xs text-muted-foreground italic">No tech stacks added yet. Edit your profile to showcase your skills.</p>
            )}

            {/* Actions Row - Positioned "under the tags" */}
            <div className="flex items-center gap-2 mt-6">
                {isOwnProfile ? (
                    <>
                        <Button
                            onClick={onEdit}
                            variant="secondary"
                            size="default"
                            className="h-10 font-semibold px-8 border shadow-sm cursor-pointer"
                        >
                            <Edit3 className="w-4 h-4 mr-2" />
                            Edit Profile
                        </Button>
                        <Button
                            onClick={onChangePassword}
                            variant="secondary"
                            size="default"
                            className="h-10 font-semibold px-5 border shadow-sm cursor-pointer"
                        >
                            <KeyRound className="w-4 h-4 mr-2" />
                            Change Password
                        </Button>
                    </>
                ) : (
                    <>
                        <Button
                            size="default"
                            variant={followConfig.variant}
                            className={cn(
                                "h-10 font-semibold px-8 shadow-sm cursor-pointer",
                                profile.followStatus === "following" && "hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
                            )}
                            onClick={handleFollowAction}
                            disabled={isFollowActionPending}
                        >
                            {isFollowActionPending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <followConfig.icon className="w-4 h-4 mr-2" />
                            )}
                            {profile.followStatus === "following" ? (
                                <span className="group-hover/button:hidden">{followConfig.label}</span>
                            ) : followConfig.label}
                            {profile.followStatus === "following" && (
                                <span className="hidden group-hover/button:inline">Unfollow</span>
                            )}
                        </Button>
                        <Button
                            variant="secondary"
                            size="default"
                            className="h-10 font-semibold px-8 border shadow-sm cursor-pointer"
                            onClick={handleMessage}
                            disabled={isCheckingChat}
                        >
                            {isCheckingChat ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <MessageSquare className="w-4 h-4 mr-2" />
                            )}
                            Message
                        </Button>
                    </>
                )}
            </div>

            {/* Connections Modal */}
            <ConnectionsModal
                open={connectionsModalOpen}
                onClose={() => setConnectionsModalOpen(false)}
                profileId={profile.id}
                isOwnProfile={isOwnProfile}
                initialTab={connectionsInitialTab}
                followerCount={profile.followerCount}
                followingCount={profile.followingCount}
            />
            {!isOwnProfile && (
                <ReportDialog
                    open={reportDialogOpen}
                    onOpenChange={setReportDialogOpen}
                    targetType={ReportTargetType.Profile}
                    targetId={profile.id}
                    targetLabel={profile.fullName || "Profile"}
                />
            )}
        </div>
    );
}
