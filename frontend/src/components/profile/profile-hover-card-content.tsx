'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Ban, Calendar, Loader2, MessageSquare, Star, User, Volume2, VolumeX, X } from 'lucide-react';
import { UserAvatar } from '@/components/shared/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RootState } from '@/store/store';
import { ProfileHoverCardActions } from './profile-hover-card-actions';
import { useOpenChatByProfile } from '@/features/messages/hooks/chats/use-open-chat-by-profile';
import { useGetProfileCommunityMute } from '@/hooks/community-mute-hooks/use-get-profile-community-mute';
import { useGetProfileCommunityBan } from '@/hooks/community-bans-hooks/use-get-profile-community-ban';
import { useMuteCommunityMember } from '@/hooks/community-mute-hooks/use-mute-community-member';
import { useUnmuteProfileCommunityMember } from '@/hooks/community-mute-hooks/use-unmute-profile-community-member';
import { useBanCommunityMember } from '@/hooks/community-bans-hooks/use-ban-community-member';
import { useUnbanProfileCommunityMember } from '@/hooks/community-bans-hooks/use-unban-profile-community-member';

const MUTE_PRESETS = [
    { label: "1h", value: "1h" },
    { label: "12h", value: "12h" },
    { label: "24h", value: "24h" },
    { label: "7d", value: "7d" },
    { label: "Permanent", value: "permanent" },
    { label: "Custom", value: "custom" },
];

export interface ProfileHoverCardAuthor {
    fullName?: string | null;
    avatarUrl?: string | null;
    backgroundUrl?: string | null;
    bio?: string | null;
    reputationPoints?: number;
    techStacks?: string[];
    isPrivate?: boolean;
}

interface ProfileHoverCardMessageButtonProps {
    profileId: string;
    fullName: string;
    avatarUrl: string;
    onClose?: () => void;
}

interface ProfileHoverCardContentProps {
    profileId: string;
    author?: ProfileHoverCardAuthor;
    onClose?: () => void;
    showMessageAction?: boolean;
    showBlockAction?: boolean;
    showProfileAction?: boolean;
    communityId?: string | null;
    showCommunityStatus?: boolean;
    canModerateCommunity?: boolean;
    variant?: 'default' | 'admin';
}

function ProfileHoverCardMessageButton({
    profileId,
    fullName,
    avatarUrl,
    onClose,
}: ProfileHoverCardMessageButtonProps) {
    const { openMessagePopup, isCheckingChat } = useOpenChatByProfile({
        id: profileId,
        fullName,
        avatarUrl,
    });

    const handleMessage = async () => {
        if (isCheckingChat) return;
        await openMessagePopup();
        onClose?.();
    };

    return (
        <Button size="sm" onClick={handleMessage} disabled={isCheckingChat} className="w-full cursor-pointer">
            {isCheckingChat ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <MessageSquare className="mr-2 h-4 w-4" />
            )}
            Message
        </Button>
    );
}

export function ProfileHoverCardContent({
    profileId,
    author,
    onClose,
    showMessageAction = true,
    showBlockAction = true,
    showProfileAction = true,
    communityId,
    showCommunityStatus = false,
    canModerateCommunity = false,
    variant = 'default'
}: ProfileHoverCardContentProps) {
    const router = useRouter();
    const { user } = useSelector((state: RootState) => state.auth);
    const fullName = author?.fullName || 'Unknown';
    const techStacks = author?.techStacks ?? [];
    const reputationPoints = author?.reputationPoints ?? 0;
    const avatarUrl = author?.avatarUrl || '/images/default-avatar.webp';
    const backgroundUrl = author?.backgroundUrl || '/images/default-background.webp';
    const isOwnProfile = user?.profileId === profileId;
    const canShowProfile = showProfileAction;
    const canShowMessage = showMessageAction && !isOwnProfile;
    const canShowBlock = showBlockAction && !isOwnProfile;
    const shouldFetchCommunityStatus = Boolean(showCommunityStatus && communityId);
    const { data: muteStatus } = useGetProfileCommunityMute(
        communityId,
        profileId,
        shouldFetchCommunityStatus
    );
    const { data: communityBan } = useGetProfileCommunityBan(
        communityId,
        profileId,
        shouldFetchCommunityStatus
    );
    const [isMuteDialogOpen, setIsMuteDialogOpen] = useState(false);
    const [muteReason, setMuteReason] = useState("");
    const [mutePreset, setMutePreset] = useState("24h");
    const [customMutedUntil, setCustomMutedUntil] = useState("");
    const [minCustomDate] = useState(() => new Date(Date.now() + 60 * 1000).toISOString().slice(0, 16));
    const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);
    const [banReason, setBanReason] = useState("");
    const muteMutation = useMuteCommunityMember();
    const unmuteMutation = useUnmuteProfileCommunityMember();
    const banMutation = useBanCommunityMember();
    const unbanMutation = useUnbanProfileCommunityMember();
    const actionCount = Number(canShowProfile) + Number(canShowMessage);
    const canShowCommunityModeration =
        Boolean(communityId) && canModerateCommunity && !isOwnProfile;
    const handleViewProfile = () => {
        router.push(`/profile/${profileId}`);
        onClose?.();
    };
    const calculateMutedUntil = () => {
        if (mutePreset === "permanent") return undefined;
        if (mutePreset === "custom") {
            return customMutedUntil ? new Date(customMutedUntil).toISOString() : undefined;
        }

        const durations: Record<string, number> = {
            "1h": 60 * 60 * 1000,
            "12h": 12 * 60 * 60 * 1000,
            "24h": 24 * 60 * 60 * 1000,
            "7d": 7 * 24 * 60 * 60 * 1000,
        };

        return new Date(Date.now() + (durations[mutePreset] ?? durations["24h"])).toISOString();
    };
    const handleMuteFromCommunity = () => {
        if (!communityId || muteMutation.isPending) return;
        muteMutation.mutate({
            communityId,
            mutedProfileId: profileId,
            muteReason: muteReason.trim() || undefined,
            mutedUntil: calculateMutedUntil(),
        }, {
            onSuccess: () => {
                setIsMuteDialogOpen(false);
                setMuteReason("");
                setMutePreset("24h");
                setCustomMutedUntil("");
            },
        });
    };
    const handleMuteToggle = () => {
        if (muteStatus?.isMuted) {
            if (communityId) {
                unmuteMutation.mutate({ communityId, profileId });
            }
            return;
        }
        setIsMuteDialogOpen(true);
    };
    const handleConfirmBlockFromCommunity = () => {
        if (!communityId || banMutation.isPending) return;
        banMutation.mutate({
            communityId,
            bannedProfileId: profileId,
            banReason: banReason.trim() || undefined,
        }, {
            onSuccess: () => {
                setIsBanDialogOpen(false);
                setBanReason("");
            },
        });
    };
    const handleBlockToggle = () => {
        if (communityBan && communityId) {
            unbanMutation.mutate({ communityId, profileId });
            return;
        }
        setIsBanDialogOpen(true);
    };

    return (
        <div className="relative w-80 overflow-hidden bg-popover text-popover-foreground" data-variant={variant}>
            <div className="relative h-20 w-full bg-muted">
                <Image
                    src={backgroundUrl}
                    alt="Cover Image"
                    fill
                    unoptimized
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/30 via-transparent to-transparent" />
            </div>

            <button
                type="button"
                onClick={onClose}
                className="absolute right-2 top-2 z-10 rounded-full bg-background/80 p-1 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Close profile hover card"
            >
                <X className="h-4 w-4" />
            </button>

            <div className="px-4 pb-3">
                <div className="-mt-7 flex items-end gap-3">
                    <UserAvatar avatarUrl={avatarUrl} fullName={fullName} className="h-14 w-14 border-2 border-popover ring-2 ring-border" />
                    <div className="min-w-0 flex-1 pb-1">
                        <h3 className="truncate text-base font-semibold text-foreground">{fullName}</h3>
                        {reputationPoints > 0 ? (
                            <div className="mt-0.5 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-500">
                                <Star className="h-3 w-3 fill-current" />
                                <span>{reputationPoints.toLocaleString()} reputation</span>
                            </div>
                        ) : null}
                    </div>
                </div>

                {author?.bio ? (
                    <p className="mt-3 line-clamp-2 text-sm text-foreground/80">{author.bio}</p>
                ) : (
                    <p className="mt-3 text-sm italic text-muted-foreground">No bio yet</p>
                )}

                {techStacks.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                        {techStacks.slice(0, 5).map((tech) => (
                            <Badge key={tech} variant="secondary" className="text-xs">
                                {tech}
                            </Badge>
                        ))}
                        {techStacks.length > 5 ? (
                            <Badge variant="secondary" className="text-xs">
                                +{techStacks.length - 5}
                            </Badge>
                        ) : null}
                    </div>
                ) : null}
            </div>

            {actionCount > 0 ? (
                <div className={actionCount === 1 ? 'border-t border-border px-4 py-3' : 'grid grid-cols-2 gap-2 border-t border-border px-4 py-3'}>
                    {canShowProfile ? (
                        <Button variant="outline" size="sm" onClick={handleViewProfile} className="w-full cursor-pointer">
                            <User className="mr-2 h-4 w-4" />
                            {isOwnProfile ? 'View My Profile' : 'Profile'}
                        </Button>
                    ) : null}
                    {canShowMessage ? (
                        <ProfileHoverCardMessageButton
                            profileId={profileId}
                            fullName={fullName}
                            avatarUrl={avatarUrl}
                            onClose={onClose}
                        />
                    ) : null}
                </div>
            ) : null}

            {canShowCommunityModeration ? (
                <div className="grid gap-2 border-t border-border px-4 py-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleMuteToggle}
                        disabled={muteMutation.isPending || unmuteMutation.isPending}
                        className="w-full cursor-pointer"
                    >
                        {muteMutation.isPending || unmuteMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : muteStatus?.isMuted ? (
                            <Volume2 className="mr-2 h-4 w-4" />
                        ) : (
                            <VolumeX className="mr-2 h-4 w-4" />
                        )}
                        {muteStatus?.isMuted ? 'Unmute from community' : 'Mute from community'}
                    </Button>
                    <Button
                        variant={communityBan?.id ? "outline" : "destructive"}
                        size="sm"
                        onClick={handleBlockToggle}
                        disabled={banMutation.isPending || unbanMutation.isPending}
                        className="w-full cursor-pointer"
                    >
                        {banMutation.isPending || unbanMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Ban className="mr-2 h-4 w-4" />
                        )}
                        {communityBan?.id ? 'Unblock from community' : 'Block from community'}
                    </Button>
                </div>
            ) : null}

            {canShowBlock ? <ProfileHoverCardActions profileId={profileId} onClose={onClose} /> : null}

            <Dialog open={isMuteDialogOpen} onOpenChange={setIsMuteDialogOpen}>
                <DialogContent onClick={(event) => event.stopPropagation()}>
                    <DialogHeader>
                        <DialogTitle>Mute from community</DialogTitle>
                        <DialogDescription>
                            Choose how long this profile cannot post, comment, answer, or vote in this community.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-2">
                            {MUTE_PRESETS.map((preset) => (
                                <button
                                    key={preset.value}
                                    type="button"
                                    onClick={() => setMutePreset(preset.value)}
                                    className={`rounded-md border px-2 py-2 text-xs font-medium transition-colors cursor-pointer ${
                                        mutePreset === preset.value
                                            ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                            : "border-border bg-background text-muted-foreground hover:bg-muted"
                                    }`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        {mutePreset === "custom" ? (
                            <div className="space-y-2">
                                <label className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Mute until
                                </label>
                                <Input
                                    type="datetime-local"
                                    value={customMutedUntil}
                                    onChange={(event) => setCustomMutedUntil(event.target.value)}
                                    min={minCustomDate}
                                />
                            </div>
                        ) : null}

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-foreground">Reason</label>
                            <Textarea
                                value={muteReason}
                                onChange={(event) => setMuteReason(event.target.value)}
                                placeholder="Reason for muting this profile..."
                                className="min-h-24 resize-none"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={muteMutation.isPending}
                            onClick={() => setIsMuteDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            disabled={muteMutation.isPending || (mutePreset === "custom" && !customMutedUntil)}
                            onClick={handleMuteFromCommunity}
                        >
                            {muteMutation.isPending ? "Muting..." : "Mute"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
                <DialogContent onClick={(event) => event.stopPropagation()}>
                    <DialogHeader>
                        <DialogTitle>Block from community</DialogTitle>
                        <DialogDescription>
                            This removes the profile from the community and prevents them from accessing community content.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-foreground">Reason</label>
                        <Textarea
                            value={banReason}
                            onChange={(event) => setBanReason(event.target.value)}
                            placeholder="Reason for blocking this profile from the community..."
                            className="min-h-24 resize-none"
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={banMutation.isPending}
                            onClick={() => setIsBanDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={banMutation.isPending}
                            onClick={handleConfirmBlockFromCommunity}
                        >
                            {banMutation.isPending ? "Blocking..." : "Block"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
