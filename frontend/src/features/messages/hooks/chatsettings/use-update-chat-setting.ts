import { useMutation, useQueryClient } from "@tanstack/react-query";
import { messagingQueryKeys } from "../messaging-query-keys";
import { chatSettingService } from "@/features/messages/services/chat-setting-service";
import type { ChatSetting, UpdateChatSettingDTO } from "@/features/messages/types/contracts";
import { ReturnResult } from "@/types/common/return-result";
import { toast } from "sonner";

export const useUpdateChatSetting = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (updateInfo: UpdateChatSettingDTO): Promise<ReturnResult<ChatSetting>> => {
            return chatSettingService.updateChatSetting(updateInfo);
        },
        onSuccess: (data) => {
            if (data.result) {
                toast.success("Updated chat successfully")
                // Invalidate only chat lists — message contents don't change on settings update
                queryClient.invalidateQueries({
                    queryKey: ["messages", "chats"],
                });
            }
        },
    });
};
