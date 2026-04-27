import {
    Chat,
    ChatDetailData,
    ChatListItem,
    ChatSetting,
    CreateMessageDto,
    Message,
    MessageReadEvent,
    MessageReadReceipt,
    Page,
    PagedData,
    ProfileSummary,
    ReturnResult,
    UpdateChatSettingDTO,
} from "@/features/messages/types/contracts";

type Store = {
    chats: Chat[];
    profiles: ProfileSummary[];
    settings: ChatSetting[];
    members: Record<string, string[]>;
    messages: Message[];
    receipts: MessageReadReceipt[];
    messageSeed: number;
};

const storesByProfile = new Map<string, Store>();

const otherProfiles: ProfileSummary[] = [
    { Id: "profile-minh", FullName: "Minh Nguyen", AvatarUrl: null },
    { Id: "profile-lan", FullName: "Lan Tran", AvatarUrl: null },
    { Id: "profile-huy", FullName: "Huy Le", AvatarUrl: null },
    { Id: "profile-mai", FullName: "Mai Vo", AvatarUrl: null },
];

function nowIso(offsetMinutes = 0): string {
    return new Date(Date.now() + offsetMinutes * 60 * 1000).toISOString();
}

function buildStore(currentProfileId: string): Store {
    const self: ProfileSummary = {
        Id: currentProfileId,
        FullName: "You",
        AvatarUrl: null,
    };

    const profiles = [self, ...otherProfiles];

    const chats: Chat[] = [
        {
            Id: "chat-main",
            Name: "Minh Nguyen",
            IsGroup: false,
            ChatPictureUrl: null,
            DateCreated: nowIso(-240),
            DateModified: nowIso(-6),
        },
        {
            Id: "chat-request",
            Name: "Lan Tran",
            IsGroup: false,
            ChatPictureUrl: null,
            DateCreated: nowIso(-180),
            DateModified: nowIso(-55),
        },
        {
            Id: "chat-archived",
            Name: "Huy Le",
            IsGroup: false,
            ChatPictureUrl: null,
            DateCreated: nowIso(-300),
            DateModified: nowIso(-25),
        },
        {
            Id: "chat-group",
            Name: "Frontend Crew",
            IsGroup: true,
            ChatPictureUrl: null,
            DateCreated: nowIso(-400),
            DateModified: nowIso(-10),
        },
    ];

    const members: Record<string, string[]> = {
        "chat-main": [currentProfileId, "profile-minh"],
        "chat-request": [currentProfileId, "profile-lan"],
        "chat-archived": [currentProfileId, "profile-huy"],
        "chat-group": [currentProfileId, "profile-minh", "profile-mai"],
    };

    const settings: ChatSetting[] = [
        {
            Id: "setting-main-self",
            NickName: null,
            MuteUntil: null,
            IsMuted: false,
            IsPinned: true,
            IsArchived: false,
            IsRequested: false,
            Role: "MEMBER",
            DeleteUpToMessageId: null,
            ProfileId: currentProfileId,
            ChatId: "chat-main",
            DateCreated: nowIso(-240),
            DateModified: nowIso(-6),
        },
        {
            Id: "setting-request-self",
            NickName: null,
            MuteUntil: null,
            IsMuted: false,
            IsPinned: false,
            IsArchived: false,
            IsRequested: true,
            Role: "MEMBER",
            DeleteUpToMessageId: null,
            ProfileId: currentProfileId,
            ChatId: "chat-request",
            DateCreated: nowIso(-180),
            DateModified: nowIso(-55),
        },
        {
            Id: "setting-archived-self",
            NickName: null,
            MuteUntil: null,
            IsMuted: true,
            IsPinned: false,
            IsArchived: true,
            IsRequested: false,
            Role: "MEMBER",
            DeleteUpToMessageId: null,
            ProfileId: currentProfileId,
            ChatId: "chat-archived",
            DateCreated: nowIso(-300),
            DateModified: nowIso(-25),
        },
        {
            Id: "setting-group-self",
            NickName: "Core Team",
            MuteUntil: null,
            IsMuted: false,
            IsPinned: false,
            IsArchived: false,
            IsRequested: false,
            Role: "ADMIN",
            DeleteUpToMessageId: 201,
            ProfileId: currentProfileId,
            ChatId: "chat-group",
            DateCreated: nowIso(-400),
            DateModified: nowIso(-10),
        },
        {
            Id: "setting-main-minh",
            NickName: null,
            MuteUntil: null,
            IsMuted: false,
            IsPinned: false,
            IsArchived: false,
            IsRequested: false,
            Role: "MEMBER",
            DeleteUpToMessageId: null,
            ProfileId: "profile-minh",
            ChatId: "chat-main",
            DateCreated: nowIso(-240),
            DateModified: nowIso(-7),
        },
        {
            Id: "setting-request-lan",
            NickName: null,
            MuteUntil: null,
            IsMuted: false,
            IsPinned: false,
            IsArchived: false,
            IsRequested: false,
            Role: "MEMBER",
            DeleteUpToMessageId: null,
            ProfileId: "profile-lan",
            ChatId: "chat-request",
            DateCreated: nowIso(-180),
            DateModified: nowIso(-56),
        },
        {
            Id: "setting-archived-huy",
            NickName: null,
            MuteUntil: null,
            IsMuted: false,
            IsPinned: false,
            IsArchived: false,
            IsRequested: false,
            Role: "MEMBER",
            DeleteUpToMessageId: null,
            ProfileId: "profile-huy",
            ChatId: "chat-archived",
            DateCreated: nowIso(-300),
            DateModified: nowIso(-26),
        },
        {
            Id: "setting-group-minh",
            NickName: null,
            MuteUntil: null,
            IsMuted: false,
            IsPinned: false,
            IsArchived: false,
            IsRequested: false,
            Role: "MEMBER",
            DeleteUpToMessageId: null,
            ProfileId: "profile-minh",
            ChatId: "chat-group",
            DateCreated: nowIso(-400),
            DateModified: nowIso(-10),
        },
        {
            Id: "setting-group-mai",
            NickName: null,
            MuteUntil: null,
            IsMuted: false,
            IsPinned: false,
            IsArchived: false,
            IsRequested: false,
            Role: "MEMBER",
            DeleteUpToMessageId: null,
            ProfileId: "profile-mai",
            ChatId: "chat-group",
            DateCreated: nowIso(-400),
            DateModified: nowIso(-11),
        },
    ];

    const messages: Message[] = [
        {
            Id: 101,
            Content: "Hey, can we sync about the sprint demo?",
            SenderId: "profile-minh",
            ChatId: "chat-main",
            DateCreated: nowIso(-70),
            DateModified: nowIso(-70),
        },
        {
            Id: 102,
            Content: "Sure, I can do 3 PM.",
            SenderId: currentProfileId,
            ChatId: "chat-main",
            DateCreated: nowIso(-60),
            DateModified: nowIso(-60),
        },
        {
            Id: 103,
            Content: "Perfect. I will send the checklist.",
            SenderId: "profile-minh",
            ChatId: "chat-main",
            DateCreated: nowIso(-6),
            DateModified: nowIso(-6),
        },
        {
            Id: 120,
            Content: "Hi, I want to connect with you about AI tasks.",
            SenderId: "profile-lan",
            ChatId: "chat-request",
            DateCreated: nowIso(-55),
            DateModified: nowIso(-55),
        },
        {
            Id: 150,
            Content: "Archived chats should still be searchable.",
            SenderId: "profile-huy",
            ChatId: "chat-archived",
            DateCreated: nowIso(-25),
            DateModified: nowIso(-25),
        },
        {
            Id: 200,
            Content: "Deploy preview succeeded.",
            SenderId: "profile-minh",
            ChatId: "chat-group",
            DateCreated: nowIso(-35),
            DateModified: nowIso(-35),
        },
        {
            Id: 201,
            Content: "I fixed the UI spacing in compose box.",
            SenderId: currentProfileId,
            ChatId: "chat-group",
            DateCreated: nowIso(-12),
            DateModified: nowIso(-12),
        },
        {
            Id: 202,
            Content: "Looks clean on mobile too.",
            SenderId: "profile-mai",
            ChatId: "chat-group",
            DateCreated: nowIso(-10),
            DateModified: nowIso(-10),
        },
    ];

    const receipts: MessageReadReceipt[] = [
        {
            MessageId: 101,
            ReaderId: currentProfileId,
            ReadAt: nowIso(-68),
        },
        {
            MessageId: 102,
            ReaderId: "profile-minh",
            ReadAt: nowIso(-58),
        },
        {
            MessageId: 200,
            ReaderId: currentProfileId,
            ReadAt: nowIso(-34),
        },
    ];

    return {
        chats,
        profiles,
        settings,
        members,
        messages,
        receipts,
        messageSeed: 202,
    };
}

function getStore(currentProfileId: string): Store {
    const key = currentProfileId || "mock-self";
    const existing = storesByProfile.get(key);
    if (existing) {
        return existing;
    }

    const seeded = buildStore(key);
    storesByProfile.set(key, seeded);
    return seeded;
}

function clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
}

function getProfile(store: Store, profileId: string): ProfileSummary {
    const profile = store.profiles.find((item) => item.Id === profileId);
    return (
        profile ?? {
            Id: profileId,
            FullName: "Unknown",
            AvatarUrl: null,
        }
    );
}

function getCurrentSetting(store: Store, chatId: string, profileId: string): ChatSetting | null {
    return (
        store.settings.find((setting) => setting.ChatId === chatId && setting.ProfileId === profileId) ?? null
    );
}

function getVisibleMessages(store: Store, chatId: string, currentProfileId: string): Message[] {
    const setting = getCurrentSetting(store, chatId, currentProfileId);
    const all = store.messages.filter((message) => message.ChatId === chatId);

    if (!setting?.DeleteUpToMessageId) {
        return all;
    }

    return all.filter((message) => message.Id > setting.DeleteUpToMessageId!);
}

function mapChatItem(store: Store, chat: Chat, currentProfileId: string): ChatListItem | null {
    const setting = getCurrentSetting(store, chat.Id, currentProfileId);
    if (!setting) {
        return null;
    }

    const participantIds = (store.members[chat.Id] ?? []).filter((id) => id !== currentProfileId);
    const participants = participantIds.map((id) => getProfile(store, id));

    const visible = getVisibleMessages(store, chat.Id, currentProfileId).sort(
        (a, b) => new Date(b.DateCreated).getTime() - new Date(a.DateCreated).getTime(),
    );

    const lastMessage = visible[0] ?? null;
    const lastSender = lastMessage ? getProfile(store, lastMessage.SenderId) : null;

    const unreadCount = visible.filter((message) => {
        if (message.SenderId === currentProfileId) {
            return false;
        }

        return !store.receipts.some(
            (receipt) => receipt.MessageId === message.Id && receipt.ReaderId === currentProfileId,
        );
    }).length;

    return {
        Chat: chat,
        CurrentSetting: setting,
        Participants: participants,
        LastMessage: lastMessage,
        LastMessageSender: lastSender,
        UnreadCount: unreadCount,
    };
}

function updateChatModified(chat: Chat): void {
    chat.DateModified = nowIso();
}

export const mockMessageDataSource = {
    async getChatsPage(
        page: Page<string>,
        currentProfileId: string,
    ): Promise<ReturnResult<PagedData<string, ChatListItem>>> {
        const store = getStore(currentProfileId);

        const sorted = [...store.chats].sort(
            (a, b) => new Date(b.DateModified).getTime() - new Date(a.DateModified).getTime(),
        );

        const items = sorted
            .map((chat) => mapChatItem(store, chat, currentProfileId))
            .filter((item): item is ChatListItem => Boolean(item));

        const size = page.size > 0 ? page.size : items.length;
        const pageNumber = page.pageNumber > 0 ? page.pageNumber : 1;
        const start = (pageNumber - 1) * size;

        const paged = items.slice(start, start + size);

        return {
            Result: {
                page: {
                    ...page,
                    totalElements: items.length,
                    pageNumber,
                },
                data: clone(paged),
            },
        };
    },

    async getChatDetail(
        chatId: string,
        currentProfileId: string,
        page: Page<number>,
    ): Promise<ReturnResult<PagedData<number, ChatDetailData>>> {
        const store = getStore(currentProfileId);

        const chat = store.chats.find((item) => item.Id === chatId);
        const setting = getCurrentSetting(store, chatId, currentProfileId);

        if (!chat || !setting) {
            return {
                Message: "Chat not found",
                Result: {
                    page,
                    data: [],
                },
            };
        }

        const messages = getVisibleMessages(store, chatId, currentProfileId)
            .sort((a, b) => b.Id - a.Id)
            .filter((message) => {
                if (!page.indexPaging) {
                    return true;
                }

                return message.Id < page.indexPaging;
            })
            .slice(0, page.size > 0 ? page.size : 40)
            .sort((a, b) => a.Id - b.Id);

        const participants = (store.members[chatId] ?? [])
            .filter((id) => id !== currentProfileId)
            .map((id) => getProfile(store, id));

        const receipts = store.receipts.filter((receipt) =>
            messages.some((message) => message.Id === receipt.MessageId),
        );

        return {
            Result: {
                page,
                data: [
                    clone({
                        Chat: chat,
                        CurrentSetting: setting,
                        Participants: participants,
                        Messages: messages,
                        Receipts: receipts,
                    }),
                ],
            },
        };
    },

    async sendMessage(
        payload: CreateMessageDto,
        currentProfileId: string,
    ): Promise<ReturnResult<Message>> {
        const store = getStore(currentProfileId);
        const chat = store.chats.find((item) => item.Id === payload.ChatId);
        if (!chat) {
            return { Message: "Chat not found", Result: null };
        }

        store.messageSeed += 1;
        const created: Message = {
            Id: store.messageSeed,
            Content: payload.Content,
            ChatId: payload.ChatId,
            SenderId: currentProfileId,
            DateCreated: nowIso(),
            DateModified: nowIso(),
        };

        store.messages.push(created);
        updateChatModified(chat);

        return {
            Result: clone(created),
        };
    },

    async markMessageRead(
        messageId: number,
        currentProfileId: string,
    ): Promise<ReturnResult<MessageReadReceipt>> {
        const store = getStore(currentProfileId);

        const target = store.messages.find((item) => item.Id === messageId);
        if (!target) {
            return {
                Message: "Message not found",
                Result: null,
            };
        }

        if (target.SenderId === currentProfileId) {
            return {
                Message: "Sender cannot mark their own message as read",
                Result: null,
            };
        }

        const existing = store.receipts.find(
            (receipt) => receipt.MessageId === messageId && receipt.ReaderId === currentProfileId,
        );

        if (existing) {
            return {
                Result: clone(existing),
            };
        }

        const receipt: MessageReadReceipt = {
            MessageId: messageId,
            ReaderId: currentProfileId,
            ReadAt: nowIso(),
        };

        store.receipts.push(receipt);

        return {
            Result: clone(receipt),
        };
    },

    async updateChatSetting(
        payload: UpdateChatSettingDTO,
        currentProfileId: string,
    ): Promise<ReturnResult<ChatSetting>> {
        const store = getStore(currentProfileId);
        const setting = store.settings.find(
            (item) => item.Id === payload.Id && item.ProfileId === currentProfileId,
        );

        if (!setting) {
            return {
                Message: "Chat setting cant be found or does not exist",
                Result: null,
            };
        }

        if (payload.MuteUntil !== null) {
            setting.MuteUntil = payload.MuteUntil;
        }
        if (payload.IsMuted !== null) {
            setting.IsMuted = payload.IsMuted;
        }
        if (payload.IsPinned !== null) {
            setting.IsPinned = payload.IsPinned;
        }
        if (payload.IsArchived !== null) {
            setting.IsArchived = payload.IsArchived;
        }
        if (payload.IsRequested !== null) {
            setting.IsRequested = payload.IsRequested;
        }

        setting.DateModified = nowIso();

        const chat = store.chats.find((item) => item.Id === setting.ChatId);
        if (chat) {
            updateChatModified(chat);
        }

        return {
            Result: clone(setting),
        };
    },

    async clearMessages(chatSettingId: string, currentProfileId: string): Promise<ReturnResult<ChatSetting>> {
        const store = getStore(currentProfileId);
        const setting = store.settings.find(
            (item) => item.Id === chatSettingId && item.ProfileId === currentProfileId,
        );

        if (!setting) {
            return {
                Message: "Does not exist",
                Result: null,
            };
        }

        const latest = store.messages
            .filter((item) => item.ChatId === setting.ChatId)
            .sort((a, b) => b.Id - a.Id)[0];

        if (!latest) {
            return {
                Message: "Cant find",
                Result: null,
            };
        }

        if (setting.DeleteUpToMessageId === latest.Id) {
            return {
                Message: "You have already deleted up to the newest message",
                Result: clone(setting),
            };
        }

        setting.DeleteUpToMessageId = latest.Id;
        setting.DateModified = nowIso();

        return {
            Result: clone(setting),
        };
    },

    async applyIncomingNewMessage(payload: Message, currentProfileId: string): Promise<void> {
        const store = getStore(currentProfileId);
        if (store.messages.some((item) => item.Id === payload.Id)) {
            return;
        }

        store.messages.push(clone(payload));
        const chat = store.chats.find((item) => item.Id === payload.ChatId);
        if (chat) {
            chat.DateModified = payload.DateCreated;
        }
    },

    async applyIncomingMessageRead(payload: MessageReadEvent, currentProfileId: string): Promise<void> {
        const store = getStore(currentProfileId);
        const exists = store.receipts.some(
            (item) => item.MessageId === payload.messageId && item.ReaderId === payload.readerId,
        );

        if (exists) {
            return;
        }

        store.receipts.push({
            MessageId: payload.messageId,
            ReaderId: payload.readerId,
            ReadAt: nowIso(),
        });
    },
};
