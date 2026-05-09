"use client";

import { ShieldBan, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUnblockProfile } from "@/hooks/block-hooks/use-unblock-profile";

interface Props {
    iBlockedThem: boolean;
    theyBlockedMe: boolean;
    blockId: string | null;
    otherProfileId: string;
    otherName: string;
}

export function BlockBanner({ iBlockedThem, theyBlockedMe, blockId, otherProfileId, otherName }: Props) {
    const unblockMutation = useUnblockProfile(blockId, otherProfileId);

    if (!iBlockedThem && !theyBlockedMe) return null;

    if (theyBlockedMe && !iBlockedThem) {
        return (
            <div className="flex items-center justify-center gap-2 px-4 py-3 border-b border-border bg-muted/40 text-sm text-muted-foreground">
                <ShieldBan className="h-4 w-4 shrink-0" />
                <span>You can&apos;t send messages to this person.</span>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border bg-muted/40">
            <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                <ShieldBan className="h-4 w-4 shrink-0 text-destructive" />
                <span className="truncate">You blocked <span className="font-medium text-foreground">{otherName}</span></span>
            </div>
            <Button
                variant="outline"
                size="sm"
                onClick={() => unblockMutation.mutate()}
                disabled={unblockMutation.isPending || !blockId}
                className="shrink-0 h-8 text-xs"
            >
                {unblockMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Unblock"}
            </Button>
        </div>
    );
}
