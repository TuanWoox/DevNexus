import { useMutation } from "@tanstack/react-query";
import { chatSettingService } from "@/features/messages/services/chat-setting-service";
import type { ChatSetting, UpdateChatSettingDTO } from "@/features/messages/types/contracts";
import { ReturnResult } from "@/types/common/return-result";

export const useUpdateChatSetting = () => {
    return useMutation({
        mutationFn: async (updateInfo: UpdateChatSettingDTO): Promise<ReturnResult<ChatSetting>> => {
            return chatSettingService.updateChatSetting(updateInfo);
        },
        // Cache update handled by socket listener (chat-setting-updated)
    });
};
