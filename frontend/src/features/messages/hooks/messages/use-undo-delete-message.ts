import { useMutation } from "@tanstack/react-query";
import { messageService } from "@/features/messages/services/message-service";
import type { Message } from "@/features/messages/types/contracts";
import { ReturnResult } from "@/types/common/return-result";

export const useUndoDeleteMessage = () => {
    return useMutation({
        mutationFn: async (messageId: number): Promise<ReturnResult<Message>> => {
            return messageService.undoDeleteMessage(messageId);
        },
        onSuccess: () => {
            // Cache update handled by socket listener (message-undeleted)
        },
    });
};
