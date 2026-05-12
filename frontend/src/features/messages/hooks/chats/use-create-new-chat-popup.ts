import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { chatService } from "../../services/chat-service";
import { messagingQueryKeys } from "../messaging-query-keys";
import { useChatWindows, type NewChatProfileData } from "@/features/messages/context/chat-windows-context";

interface UseCreateNewChatPopupOptions {
    targetProfile: NewChatProfileData;
    onCreated?: () => void;
}

export function useCreateNewChatPopup({ targetProfile, onCreated }: UseCreateNewChatPopupOptions) {
    const queryClient = useQueryClient();
    const { closeChat, openChat } = useChatWindows();
    const windowId = `new-${targetProfile.id}`;

    return useMutation({
        mutationFn: (content: string) => chatService.createChat({
            profileIds: [targetProfile.id],
            message: { Content: content, ChatId: "" },
        }),
        onSuccess: async (data) => {
            if (data.result?.Id) {
                onCreated?.();
                closeChat(windowId);
                openChat(data.result.Id);
                queryClient.invalidateQueries({ queryKey: messagingQueryKeys.chat("main") });
                return;
            }

            if (data.message?.toLowerCase().includes("already exists")) {
                try {
                    const existing = await chatService.getChatByProfileId(targetProfile.id);
                    if (existing.result?.Id) {
                        onCreated?.();
                        closeChat(windowId);
                        openChat(existing.result.Id);
                        return;
                    }
                } catch {
                    toast.error("Could not open existing chat");
                    return;
                }
            }

            toast.error(data.message || "Could not create chat");
        },
        onError: () => {
            toast.error("Could not create chat");
        },
    });
}
