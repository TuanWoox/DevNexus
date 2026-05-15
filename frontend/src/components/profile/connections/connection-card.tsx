"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { SelectProfileDTO } from "@/types/profile/select-profile-dto";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ProfileHoverCard } from "@/components/profile/profile-hover-card";

interface ConnectionCardProps {
    profile: SelectProfileDTO;
    selected?: boolean;
    onSelect?: () => void;
    showCheckbox?: boolean;
    actionLabel?: React.ReactNode;
    actionVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
    onAction?: () => void;
    actionPending?: boolean;
    secondaryActionLabel?: React.ReactNode;
    secondaryActionVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
    onSecondaryAction?: () => void;
    secondaryActionPending?: boolean;
}

export function ConnectionCard({
    profile,
    selected = false,
    onSelect,
    showCheckbox = true,
    actionLabel,
    actionVariant = "outline",
    onAction,
    actionPending = false,
    secondaryActionLabel,
    secondaryActionVariant = "destructive",
    onSecondaryAction,
    secondaryActionPending = false,
}: ConnectionCardProps) {
    return (
        <div
            className={cn(
                "flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border transition-colors hover:bg-muted/30",
                selected && "bg-primary/5 border-primary"
            )}
        >
            {showCheckbox && onSelect && (
                <Checkbox
                    checked={selected}
                    onCheckedChange={onSelect}
                    className="shrink-0 cursor-pointer"
                />
            )}

            <ProfileHoverCard profileId={profile.id} author={profile} side="right">
                <Link href={`/profile/${profile.id}`} className="shrink-0">
                    <Avatar className="sm:size-10 border border-border">
                        <AvatarImage
                            src={profile.avatarUrl || "/images/default-avatar.webp"}
                            alt={profile.fullName}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs sm:text-sm">
                            {profile.fullName?.charAt(0)?.toUpperCase() ?? "U"}
                        </AvatarFallback>
                    </Avatar>
                </Link>
            </ProfileHoverCard>

            <div className="flex-1 min-w-0">
                <ProfileHoverCard profileId={profile.id} author={profile} side="bottom">
                    <Link
                        href={`/profile/${profile.id}`}
                        className="font-medium text-xs sm:text-sm text-foreground hover:text-primary transition-colors truncate block"
                    >
                        {profile.fullName || "Unknown User"}
                    </Link>
                </ProfileHoverCard>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                {actionLabel && onAction && (
                    <Button
                        size="sm"
                        variant={actionVariant}
                        onClick={onAction}
                        disabled={actionPending}
                        className="cursor-pointer text-xs h-8"
                    >
                        {actionPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : actionLabel}
                    </Button>
                )}
                {secondaryActionLabel && onSecondaryAction && (
                    <Button
                        size="sm"
                        variant={secondaryActionVariant}
                        onClick={onSecondaryAction}
                        disabled={secondaryActionPending}
                        className="cursor-pointer text-xs h-8"
                    >
                        {secondaryActionPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : secondaryActionLabel}
                    </Button>
                )}
            </div>
        </div>
    );
}
