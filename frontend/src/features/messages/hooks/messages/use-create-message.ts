import { useMutation, useQueryClient } from "@tanstack/react-query";
import { messageService } from "@/features/messages/services/message-service";
import type { CreateMessageDto, Message } from "@/features/messages/types/contracts";
import { ReturnResult } from "@/types/common/return-result";
import { toast } from "sonner";
import { appendMessageToChatCache } from "../../utils/message-cache-helper";

export const useCreateMessage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (variables: {
            createMessageDto: CreateMessageDto;
            file?: File;
        }): Promise<ReturnResult<Message>> => {
            return messageService.createMessage(variables.createMessageDto, variables.file);
        },
        onSuccess: (data) => {
            if (data.result) {
                appendMessageToChatCache(queryClient, data.result as Message);
            } else {
                toast.error(data.message);
            }
        },
    });
};
