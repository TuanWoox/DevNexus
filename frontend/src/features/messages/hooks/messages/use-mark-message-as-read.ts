import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { messageService } from "@/features/messages/services/message-service";
import { getProfileId } from "@/features/messages/utils/message-service.helper";
import {
    appendReadReceiptToChatListItem,
} from "@/features/messages/utils/message-cache-helper";
import type { ReadReceipt } from "@/features/messages/types/contracts";
import { ReturnResult } from "@/types/common/return-result";

export const useMarkMessageAsRead = () => {
    const queryClient = useQueryClient();
    const currentProfileId = useSelector((state: RootState) =>
        getProfileId(state.auth.user?.profileId),
    );

    return useMutation({
        mutationFn: async (chatId: string): Promise<ReturnResult<ReadReceipt>> => {
            return messageService.markMessageAsRead(chatId);
        },
        onSuccess: (data, chatId) => {
            if (!data.result) return;
            const receipt = {
                ReaderId: currentProfileId,
                ReadAt: new Date().toISOString(),
                Reader: data.result.Reader
            };

            appendReadReceiptToChatListItem(queryClient, chatId, data.result.MessageId, receipt);
        },
    });
};
