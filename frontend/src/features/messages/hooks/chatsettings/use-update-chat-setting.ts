import { useMutation } from "@tanstack/react-query";
import { chatSettingService } from "@/features/messages/services/chat-setting-service";
import type { ChatSetting, UpdateChatSettingDTO } from "@/features/messages/types/contracts";
import { ReturnResult } from "@/types/common/return-result";
import { toast } from "sonner";

export const useUpdateChatSetting = () => {
    return useMutation({
        mutationFn: async (updateInfo: UpdateChatSettingDTO): Promise<ReturnResult<ChatSetting>> => {
            return chatSettingService.updateChatSetting(updateInfo);
        },
        onSuccess: (data) => {
            if (data.result) {
                toast.success("Updated chat successfully");
                // Cache update handled by socket listener (chat-setting-updated)
            }
        },
    });
};
