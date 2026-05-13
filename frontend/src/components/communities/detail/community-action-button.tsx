"use client";

import { Button } from "@/components/ui/button";
import { useJoinCommunity } from "@/hooks/community-members-hooks/use-join-community";
import { useLeaveCommunity } from "@/hooks/community-members-hooks/use-leave-community";
import { useCancelRequest } from "@/hooks/community-requests-hooks/use-cancel-request";
import { Loader2, LogIn, LogOut, Clock, Crown, Shield, Ban } from "lucide-react";

interface CommunityActionButtonProps {
    communityId: string;
    role: string
}

export function CommunityActionButton({ communityId, role }: CommunityActionButtonProps) {
    const { mutate: joinCommunity, isPending: isJoining } = useJoinCommunity();
    const { mutate: leaveCommunity, isPending: isLeaving } = useLeaveCommunity();
    const { mutate: cancelRequest, isPending: isCancelling } = useCancelRequest();

    // Owner — cannot leave, always has full access
    if (role === "OWNER") {
        return (
            <Button size="lg" variant="outline" disabled className="cursor-default">
                <Crown className="mr-2 h-4 w-4 text-yellow-500" />
                Community Owner
            </Button>
        );
    }

    // Moderator — cannot leave via this button (use settings)
    if (role === "MODERATOR") {
        return (
            <div className="w-full md:w-auto shrink-0 flex flex-col md:flex-col gap-3">
                <Button size="lg" variant="outline" disabled className="cursor-default">
                    <Shield className="mr-2 h-4 w-4 text-primary" />
                    Moderator
                </Button>
                <Button
                    size="lg"
                    variant="outline"
                    onClick={() => leaveCommunity(communityId)}
                    disabled={isLeaving}
                    className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                >
                    {isLeaving
                        ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        : <LogOut className="mr-2 h-4 w-4" />
                    }
                    Leave Community
                </Button>
            </div>
        );
    }

    // Active member — can leave
    if (role === "MEMBER") {
        return (
            <Button
                size="lg"
                variant="outline"
                onClick={() => leaveCommunity(communityId)}
                disabled={isLeaving}
                className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
            >
                {isLeaving
                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    : <LogOut className="mr-2 h-4 w-4" />
                }
                Leave Community
            </Button>
        );
    }

    // Pending approval — can cancel
    if (role === "PENDING") {
        return (
            <Button
                size="lg"
                variant="outline"
                onClick={() => cancelRequest(communityId)}
                disabled={isCancelling}
                className="border-yellow-400/40 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950/20"
            >
                {isCancelling
                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    : <Clock className="mr-2 h-4 w-4" />
                }
                Request Pending (Cancel)
            </Button>
        );
    }

    // Banned — cannot join
    if (role === "BANNED") {
        return (
            <Button size="lg" variant="outline" disabled className="opacity-60 cursor-not-allowed">
                <Ban className="mr-2 h-4 w-4 text-destructive" />
                You Are Banned
            </Button>
        );
    }

    // Guest — can join
    return (
        <Button
            size="lg"
            variant="custom"
            className="btn-primary text-white"
            onClick={() => joinCommunity(communityId)}
            disabled={isJoining}
        >
            {isJoining
                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                : <LogIn className="mr-2 h-4 w-4" />
            }
            Join Community
        </Button>
    );
}
