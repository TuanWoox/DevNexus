import { useCallback } from "react";
import { useGetChatByProfileId } from "./use-get-chat-by-profile-id";
import { useChatWindows, type NewChatProfileData } from "@/features/messages/context/chat-windows-context";

export function useOpenChatByProfile(profile: NewChatProfileData) {
    const { openChat } = useChatWindows();
    const chatByProfile = useGetChatByProfileId(profile.id, false);

    const openMessagePopup = useCallback(async () => {
        try {
            const result = await chatByProfile.refetch();
            const chat = result.data;

            if (chat?.Id) {
                openChat(chat.Id);
                return;
            }
        } catch {
            // Fall through to new-chat popup. Existing create path will handle errors.
        }

        openChat(`new-${profile.id}`, profile);
    }, [chatByProfile, openChat, profile]);

    return {
        openMessagePopup,
        isCheckingChat: chatByProfile.isFetching,
    };
}
