import { useCallback } from "react";
import { toast } from "sonner";
import { useGetCommunityMute } from "./use-get-community-mute";

export const useMuteGuard = (communityId: string | null | undefined) => {
    const { data: muteStatus } = useGetCommunityMute(communityId);

    const checkMuted = useCallback(
        (actionName: string = "perform this action") => {
            if (!muteStatus?.isMuted) {
                return false;
            }

            const untilText = muteStatus.mutedUntil
                ? new Date(muteStatus.mutedUntil).toLocaleString()
                : "further notice";

            toast.error(`You are muted in this community until ${untilText} and cannot ${actionName}.`, {
                duration: 4000,
            });

            return true;
        },
        [muteStatus]
    );

    return {
        checkMuted,
        isMuted: muteStatus?.isMuted ?? false,
        muteStatus,
    };
};
