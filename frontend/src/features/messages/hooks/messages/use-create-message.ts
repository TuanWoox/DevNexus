import { useMutation, useQueryClient } from "@tanstack/react-query";
import { messagingQueryKeys } from "../messaging-query-keys";
import { messageService } from "@/features/messages/services/message-service";
import type { CreateMessageDto, Message } from "@/features/messages/types/contracts";
import { ReturnResult } from "@/types/common/return-result";
import { toast } from "sonner";

export const useCreateMessage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (variables: {
            createMessageDto: CreateMessageDto;
            file?: File;
        }): Promise<ReturnResult<Message>> => {
            return messageService.createMessage(variables.createMessageDto, variables.file);
        },
        onSuccess: (data, variables) => {
            // Invalidate message paging query for the chat
            if (data.result) {
                queryClient.invalidateQueries({
                    queryKey: messagingQueryKeys.chat("", variables.createMessageDto.ChatId),
                });
            } else {
                toast.error(data.message);
            }
        },
    });
};
