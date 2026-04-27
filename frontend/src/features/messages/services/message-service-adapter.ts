import { mockMessageDataSource } from "@/features/messages/mock/mock-message-datasource";
import {
    ChatDetailData,
    ChatListItem,
    ChatSetting,
    CreateMessageDto,
    Message,
    MessageReadEvent,
    MessageReadReceipt,
    Page,
    PagedData,
    ReturnResult,
    UpdateChatSettingDTO,
} from "@/features/messages/types/contracts";

const defaultChatPage: Page<string> = {
    size: 50,
    pageNumber: 1,
    totalElements: 0,
    selected: [],
    indexPaging: null,
};

const defaultMessagePage: Page<number> = {
    size: 80,
    pageNumber: 1,
    totalElements: 0,
    selected: [],
    indexPaging: null,
};

export const messageServiceAdapter = {
    getChatsPaging(
        currentProfileId: string,
        page: Page<string> = defaultChatPage,
    ): Promise<ReturnResult<PagedData<string, ChatListItem>>> {
        return mockMessageDataSource.getChatsPage(page, currentProfileId);
    },

    getMessagesPaging(
        chatId: string,
        currentProfileId: string,
        page: Page<number> = defaultMessagePage,
    ): Promise<ReturnResult<PagedData<number, ChatDetailData>>> {
        return mockMessageDataSource.getChatDetail(chatId, currentProfileId, page);
    },

    sendMessage(payload: CreateMessageDto, currentProfileId: string): Promise<ReturnResult<Message>> {
        return mockMessageDataSource.sendMessage(payload, currentProfileId);
    },

    markMessageRead(messageId: number, currentProfileId: string): Promise<ReturnResult<MessageReadReceipt>> {
        return mockMessageDataSource.markMessageRead(messageId, currentProfileId);
    },

    updateChatSetting(
        payload: UpdateChatSettingDTO,
        currentProfileId: string,
    ): Promise<ReturnResult<ChatSetting>> {
        return mockMessageDataSource.updateChatSetting(payload, currentProfileId);
    },

    clearMessages(chatSettingId: string, currentProfileId: string): Promise<ReturnResult<ChatSetting>> {
        return mockMessageDataSource.clearMessages(chatSettingId, currentProfileId);
    },

    // Realtime integration boundary for future websocket events.
    onIncomingNewMessage(payload: Message, currentProfileId: string): Promise<void> {
        return mockMessageDataSource.applyIncomingNewMessage(payload, currentProfileId);
    },

    // Realtime integration boundary for future websocket events.
    onIncomingMessageRead(payload: MessageReadEvent, currentProfileId: string): Promise<void> {
        return mockMessageDataSource.applyIncomingMessageRead(payload, currentProfileId);
    },
};
