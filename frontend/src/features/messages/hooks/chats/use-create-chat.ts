import { useMutation, useQueryClient } from "@tanstack/react-query";
import { chatService } from "../../services/chat-service";
import { messagingQueryKeys } from "../messaging-query-keys";
import type { CreateChatDto } from "../../types/contracts";

export const useCreateChat = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (dto: CreateChatDto) => chatService.createChat(dto),
        onSuccess: (data) => {
            if (data.result) {
                // Invalidate all chat list tabs so the new chat appears
                queryClient.invalidateQueries({ queryKey: messagingQueryKeys.chat("main") });
            }
        },
    });
};
