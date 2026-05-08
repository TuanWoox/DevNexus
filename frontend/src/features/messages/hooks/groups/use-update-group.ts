import { useMutation, useQueryClient } from "@tanstack/react-query";
import { groupService } from "../../services/group-service";
import type { UpdateGroupDto } from "../../types/contracts";
import { messagingQueryKeys } from "../messaging-query-keys";
import { toast } from "sonner";

export function useUpdateGroup(chatId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (dto: UpdateGroupDto) => groupService.updateGroup(chatId, dto),
        onSuccess: (data) => {
            if (data.message) {
                toast.error(data.message);
            } else {
                queryClient.invalidateQueries({ queryKey: ["messages", "chats"] });
                queryClient.invalidateQueries({ queryKey: messagingQueryKeys.chatById(chatId) });
            }
        },
    });
}
