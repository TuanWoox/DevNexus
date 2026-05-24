"use client";

import { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { UserAvatar } from "@/components/shared/user-avatar";

interface UnavailableProfileHoverCardProps {
    fullName?: string | null;
    avatarUrl?: string | null;
    message?: string | null;
    children: ReactNode;
}

export function UnavailableProfileHoverCard({
    fullName,
    avatarUrl,
    message,
    children,
}: UnavailableProfileHoverCardProps) {
    const displayName = fullName || "Unavailable profile";

    return (
        <HoverCard openDelay={250} closeDelay={100}>
            <HoverCardTrigger asChild>
                {children}
            </HoverCardTrigger>
            <HoverCardContent side="right" align="start" className="w-72 p-4">
                <div className="flex items-start gap-3">
                    <UserAvatar
                        avatarUrl={avatarUrl ?? undefined}
                        fullName={displayName}
                        className="h-11 w-11 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-foreground">{displayName}</p>
                        <div className="mt-2 flex gap-2 rounded-lg bg-muted/60 p-2 text-xs text-muted-foreground">
                            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>
                                {message || "This profile is unavailable because of a block relationship."}
                            </span>
                        </div>
                    </div>
                </div>
            </HoverCardContent>
        </HoverCard>
    );
}
