import { useInfiniteQuery } from "@tanstack/react-query";
import { messageService } from "@/features/messages/services/message-service";
import { messagingQueryKeys } from "../messaging-query-keys";

export const useMessageEditHistory = (messageId: number, enabled: boolean) => {
    return useInfiniteQuery({
        queryKey: messagingQueryKeys.messageEditHistory(messageId),
        queryFn: ({ pageParam }: { pageParam: number | undefined }) =>
            messageService.getMessageEditHistory(messageId, {
                size: 20,
                indexPaging: pageParam,
            }),
        initialPageParam: undefined as number | undefined,
        getNextPageParam: (lastPage) => {
            const data = lastPage.result?.data;
            if (!data?.length || data.length < 20) return undefined;
            return data[data.length - 1].Id;
        },
        enabled,
    });
};
