"use client";

import { Button } from "@/components/ui/button";
import { useJoinCommunity } from "@/hooks/community-members-hooks/use-join-community";
import { SelectCommunityDTO } from "@/types/community/select-community-dto";
import { Loader2 } from "lucide-react";

interface JoinButtonProps {
    community: SelectCommunityDTO;
}

export function JoinButton({ community }: JoinButtonProps) {
    const { mutate: joinCommunity, isPending } = useJoinCommunity();

    const handleJoin = () => {
        joinCommunity(community.id);
    };

    return (
        <Button
            size="lg"
            onClick={handleJoin}
            disabled={isPending}
            variant="custom"
            className="btn-primary text-white"
        >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Join Community
        </Button>
    );
}
