import { useMutation } from "@tanstack/react-query";
import { messageService } from "@/features/messages/services/message-service";
import type { ReadReceipt } from "@/features/messages/types/contracts";
import { ReturnResult } from "@/types/common/return-result";

export const useMarkMessageAsRead = () => {
    return useMutation({
        mutationFn: async (chatId: string): Promise<ReturnResult<ReadReceipt>> => {
            return messageService.markMessageAsRead(chatId);
        },
        onSuccess: () => {
            // Cache update handled by socket listener (message-read)
        },
    });
};
