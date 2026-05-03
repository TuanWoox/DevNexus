import { useMutation } from "@tanstack/react-query";
import { chatSettingService } from "@/features/messages/services/chat-setting-service";
import type { ChatSetting } from "@/features/messages/types/contracts";
import { ReturnResult } from "@/types/common/return-result";

export const useDeleteAllMessages = () => {
    return useMutation({
        mutationFn: async (chatSettingId: string): Promise<ReturnResult<ChatSetting>> => {
            return chatSettingService.deleteAllMessages(chatSettingId);
        },
        onSuccess: () => {
            // Cache update handled by socket listener (all-messages-deleted)
        },
    });
};
