import { useMutation, useQueryClient } from "@tanstack/react-query";
import { groupService } from "../../services/group-service";
import { messagingQueryKeys } from "../messaging-query-keys";
import { toast } from "sonner";

export function useLeaveGroup(chatId: string, onLeft?: () => void) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => groupService.leaveGroup(chatId),
        onSuccess: (data) => {
            if (data.message) {
                toast.error(data.message);
            } else {
                queryClient.invalidateQueries({ queryKey: ["messages", "chats"] });
                queryClient.invalidateQueries({ queryKey: messagingQueryKeys.groupMembers(chatId) });
                toast.success("You left the group");
                onLeft?.();
            }
        },
    });
}
