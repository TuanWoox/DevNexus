import { useMutation, useQueryClient } from "@tanstack/react-query";
import { messagingQueryKeys } from "../messaging-query-keys";
import { chatSettingService } from "@/features/messages/services/chat-setting-service";
import type { ChatSetting, UpdateNickName } from "@/features/messages/types/contracts";
import { ReturnResult } from "@/types/common/return-result";

export const useUpdateNickName = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (updateNickName: UpdateNickName): Promise<ReturnResult<ChatSetting>> => {
            return chatSettingService.updateNickName(updateNickName);
        },
        onSuccess: (data) => {
            if (data.result) {
                // Invalidate all messaging queries to reflect nickname changes
                queryClient.invalidateQueries({
                    queryKey: messagingQueryKeys.all,
                });
            }
        },
    });
};
