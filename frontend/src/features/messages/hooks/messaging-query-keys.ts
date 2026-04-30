export const messagingQueryKeys = {
    all: ["messages"] as const,
    inbox: (type: string) => [...messagingQueryKeys.all, "inbox", type] as const,
    chat: (profileId: string, chatId: string) =>
        [...messagingQueryKeys.all, "chat", profileId, chatId] as const,
};
