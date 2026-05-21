'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { Loader2, MessageSquare, Star, User, X } from 'lucide-react';
import { UserAvatar } from '@/components/shared/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RootState } from '@/store/store';
import { ProfileHoverCardActions } from './profile-hover-card-actions';
import { useOpenChatByProfile } from '@/features/messages/hooks/chats/use-open-chat-by-profile';

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
    const actionCount = Number(canShowProfile) + Number(canShowMessage);
    const handleViewProfile = () => {
        router.push(`/profile/${profileId}`);
        onClose?.();
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

            {canShowBlock ? <ProfileHoverCardActions profileId={profileId} onClose={onClose} /> : null}
        </div>
    );
}
