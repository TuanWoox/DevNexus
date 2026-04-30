import { useMutation, useQueryClient } from "@tanstack/react-query";
import { messagingQueryKeys } from "../messaging-query-keys";
import { chatSettingService } from "@/features/messages/services/chat-setting-service";
import type { ChatSetting } from "@/features/messages/types/contracts";
import { ReturnResult } from "@/types/common/return-result";

export const useDeleteAllMessages = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (chatSettingId: string): Promise<ReturnResult<ChatSetting>> => {
            return chatSettingService.deleteAllMessages(chatSettingId);
        },
        onSuccess: (data) => {
            if (data.result) {
                // Invalidate all messaging queries to reflect cleared messages
                queryClient.invalidateQueries({
                    queryKey: messagingQueryKeys.all,
                });
            }
        },
    });
};
