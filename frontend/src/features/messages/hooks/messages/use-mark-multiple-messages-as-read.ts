import { useMutation, useQueryClient } from "@tanstack/react-query";
import { messagingQueryKeys } from "../messaging-query-keys";
import { messageService } from "@/features/messages/services/message-service";
import type { MessageReadReceipt } from "@/features/messages/types/contracts";
import { ReturnResult } from "@/types/common/return-result";

export const useMarkMultipleMessagesAsRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (messageIds: string[]): Promise<ReturnResult<MessageReadReceipt[]>> => {
            return messageService.markMultipleMessagesAsRead(messageIds);
        },
        onSuccess: () => {
            // Invalidate all message queries to reflect read status
            queryClient.invalidateQueries({
                queryKey: messagingQueryKeys.all,
            });
        },
    });
};
