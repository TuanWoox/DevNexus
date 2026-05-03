import { useMutation } from "@tanstack/react-query";
import { messageService } from "@/features/messages/services/message-service";
import type { Message } from "@/features/messages/types/contracts";
import { ReturnResult } from "@/types/common/return-result";

interface UpdateMessageVariables {
    messageId: number;
    content: string;
}

export const useUpdateMessage = () => {
    return useMutation({
        mutationFn: async ({ messageId, content }: UpdateMessageVariables): Promise<ReturnResult<Message>> => {
            return messageService.updateMessage(messageId, content);
        },
        onSuccess: () => {
            // Cache update handled by socket listener (message-updated)
        },
    });
};
