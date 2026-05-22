'use client';

import { useState } from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { ProfileHoverCardContent, ProfileHoverCardAuthor } from './profile-hover-card-content';

interface ProfileHoverCardProps {
    profileId: string;
    author?: ProfileHoverCardAuthor;
    children: React.ReactNode;
    side?: 'top' | 'right' | 'bottom' | 'left';
    showMessageAction?: boolean;
    showBlockAction?: boolean;
    showProfileAction?: boolean;
    communityId?: string | null;
    showCommunityStatus?: boolean;
    canModerateCommunity?: boolean;
    variant?: 'default' | 'admin';
}

export function ProfileHoverCard({
    profileId,
    author,
    children,
    side = 'top',
    showMessageAction = true,
    showBlockAction = true,
    showProfileAction = true,
    communityId,
    showCommunityStatus = false,
    canModerateCommunity = false,
    variant = 'default'
}: ProfileHoverCardProps) {
    const [open, setOpen] = useState(false);

    return (
        <HoverCard open={open} onOpenChange={setOpen} openDelay={300} closeDelay={100}>
            <HoverCardTrigger asChild>
                {children}
            </HoverCardTrigger>
            <HoverCardContent
                side={side}
                align="start"
                className="max-h-[calc(100vh-1rem)] w-80 overflow-y-auto overflow-x-hidden p-0"
                sideOffset={8}
                alignOffset={8}
                collisionPadding={12}
                sticky="always"
            >
                <ProfileHoverCardContent
                    profileId={profileId}
                    author={author}
                    onClose={() => setOpen(false)}
                    showMessageAction={showMessageAction}
                    showBlockAction={showBlockAction}
                    showProfileAction={showProfileAction}
                    communityId={communityId}
                    showCommunityStatus={showCommunityStatus}
                    canModerateCommunity={canModerateCommunity}
                    variant={variant}
                />
            </HoverCardContent>
        </HoverCard>
    );
}
