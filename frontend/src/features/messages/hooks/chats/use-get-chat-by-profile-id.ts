import { useQuery } from "@tanstack/react-query";
import { chatService } from "../../services/chat-service";
import { messagingQueryKeys } from "../messaging-query-keys";

export const useGetChatByProfileId = (profileId: string, enabled = true) => {
    return useQuery({
        queryKey: messagingQueryKeys.chatByProfile(profileId),
        queryFn: async () => {
            const data = await chatService.getChatByProfileId(profileId);
            return data.result ?? null;
        },
        enabled: enabled && !!profileId,
        staleTime: 60_000,
        retry: false,
    });
};
