import { useMutation, useQueryClient } from "@tanstack/react-query";
import { groupService } from "../../services/group-service";
import type { AddMembersDto } from "../../types/contracts";
import { messagingQueryKeys } from "../messaging-query-keys";
import { toast } from "sonner";

export function useAddMembers(chatId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (dto: AddMembersDto) => groupService.addMembers(chatId, dto),
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
