import { useMutation, useQueryClient } from "@tanstack/react-query";
import { groupService } from "../../services/group-service";
import { messagingQueryKeys } from "../messaging-query-keys";
import { toast } from "sonner";

export function useRemoveMember(chatId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (profileId: string) => groupService.removeMember(chatId, profileId),
        onSuccess: (data) => {
            if (data.message) {
                toast.error(data.message);
            } else {
                queryClient.invalidateQueries({ queryKey: messagingQueryKeys.groupMembers(chatId) });
                queryClient.invalidateQueries({ queryKey: ["messages", "chats"] });
            }
        },
    });
}
