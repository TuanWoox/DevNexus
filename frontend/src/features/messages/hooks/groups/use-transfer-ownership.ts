import { useMutation, useQueryClient } from "@tanstack/react-query";
import { groupService } from "../../services/group-service";
import type { TransferOwnershipDto } from "../../types/contracts";
import { messagingQueryKeys } from "../messaging-query-keys";
import { toast } from "sonner";

export function useTransferOwnership(chatId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (dto: TransferOwnershipDto) => groupService.transferOwnership(chatId, dto),
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
