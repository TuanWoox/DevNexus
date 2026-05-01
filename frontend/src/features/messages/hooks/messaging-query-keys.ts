export const messagingQueryKeys = {
    all: ["messages"] as const,
    chat: (type: string) => [...messagingQueryKeys.all, "chats", type] as const,
    messagesInsideChat: (chatId: string) => [...messagingQueryKeys.all, "messagesInsideChat", chatId] as const,
    search: (query: string) => [...messagingQueryKeys.all, "search", query] as const,
};
