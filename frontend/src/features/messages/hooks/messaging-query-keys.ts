export const messagingQueryKeys = {
    all: ["messages"] as const,
    inbox: (profileId: string) => [...messagingQueryKeys.all, "inbox", profileId] as const,
    chat: (profileId: string, chatId: string) =>
        [...messagingQueryKeys.all, "chat", profileId, chatId] as const,
};
