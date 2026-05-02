export const messagingQueryKeys = {
    all: ["messages"] as const,
    chat: (type: string) => [...messagingQueryKeys.all, "chats", type] as const,
    messagesInsideChat: (chatId: string) => [...messagingQueryKeys.all, "messagesInsideChat", chatId] as const,
    search: (query: string) => [...messagingQueryKeys.all, "search", query] as const,
    messageReaders: (messageId: number) => [...messagingQueryKeys.all, "messageReaders", messageId] as const,
    chatMedia: (chatId: string, mediaType: string) => [...messagingQueryKeys.all, "chatMedia", chatId, mediaType] as const,
    chatMediaAll: (chatId: string) => [...messagingQueryKeys.all, "chatMedia", chatId] as const,
};
