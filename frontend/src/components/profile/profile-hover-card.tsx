'use client';

import { useState } from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { ProfileHoverCardContent, ProfileHoverCardAuthor } from './profile-hover-card-content';

interface ProfileHoverCardProps {
    profileId: string;
    author?: ProfileHoverCardAuthor;
    children: React.ReactNode;
    side?: 'top' | 'right' | 'bottom' | 'left';
}

export function ProfileHoverCard({
    profileId,
    author,
    children,
    side = 'top'
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
                />
            </HoverCardContent>
        </HoverCard>
    );
}
