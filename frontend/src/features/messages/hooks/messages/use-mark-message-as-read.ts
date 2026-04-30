import { useMutation, useQueryClient } from "@tanstack/react-query";
import { messagingQueryKeys } from "../messaging-query-keys";
import { messageService } from "@/features/messages/services/message-service";
import type { MessageReadReceipt } from "@/features/messages/types/contracts";
import { ReturnResult } from "@/types/common/return-result";

export const useMarkMessageAsRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (messageId: number): Promise<ReturnResult<MessageReadReceipt>> => {
            return messageService.markMessageAsRead(messageId);
        },
        onSuccess: () => {
            // Invalidate all message queries to reflect read status
            queryClient.invalidateQueries({
                queryKey: messagingQueryKeys.all,
            });
        },
    });
};
