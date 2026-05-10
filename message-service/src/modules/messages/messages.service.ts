import { Injectable, Scope } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma-database/prisma.service';
import { UserContextService } from '../auth/userContext.service';
import { ReturnResult } from 'src/shared/dtos/helper/ReturnResult';
import { Message, MessageReadReceipt, Media, MessageEditHistory } from 'src/generated/prisma/client';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { ProfileblocksService } from '../profileblocks/profileblocks.service';
import { MediasService } from '../medias/medias.service';
import { MessageChatGateway } from '../message-chat-gateway/message-chat.gateway';
import { Page } from 'src/shared/dtos/paging/page';
import { PagedData } from 'src/shared/dtos/paging/pagedData';
import { ChatsQueryService } from '../chats/chats-query.service';


@Injectable({ scope: Scope.REQUEST })
export class MessagesService {

  constructor(
    private readonly prismaService: PrismaService,
    private readonly userContext: UserContextService,
    private readonly profileBlocksService: ProfileblocksService,
    private readonly mediasService: MediasService,
    private readonly gateway: MessageChatGateway,
    private readonly chatsQueryService: ChatsQueryService,
    @InjectQueue('chatsetting') private readonly chatSettingQueue: Queue,
  ) { }

  private async enqueueMessageNotification(
    chatId: string,
    senderId: string,
    messageContent: string
  ) {
    await this.chatSettingQueue.add(
      'sendMessageNotification',
      {
        chatId,
        senderId,
        messageContent,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      }
    );
  }

  async createMessage(createEntity: CreateMessageDto, file?: Express.Multer.File) {
    const returnResult = new ReturnResult<Message>();
    try {

      if (!createEntity.ChatId) {
        returnResult.Message = "Id cant be empty or blank spaces"
        return returnResult;
      }

      const profileId = this.userContext.getProfileId();

      const chat = await this.prismaService.chat.findFirst({
        where: {
          Id: createEntity.ChatId,
          Members: { some: { MemberId: profileId } }
        },
        include: { Members: true },
      });

      if (!chat) {
        returnResult.Message = "Chat can't be found or does not exist";
        return returnResult;
      }

      const memberIds = chat.Members.map(x => x.MemberId);
      const otherMemberIds = memberIds.filter(id => id !== profileId);
      const profileBlocks = await this.profileBlocksService.checkBlocks(otherMemberIds);
      if (profileBlocks) {
        returnResult.Message = "Forbidden";
        return returnResult;
      }

      const createMessage = await this.prismaService.message.create({
        data: {
          Content: createEntity.Content,
          ChatId: createEntity.ChatId,
          SenderId: profileId,
        },
      });

      if (createMessage) {
        await this.prismaService.chat.update({
          where: { Id: createEntity.ChatId },
          data: { DateModified: new Date() }
        });
        if (file) {
          await this.mediasService.handleUpload(file, createMessage.Id);
        }

        // Only enqueue notification for the FIRST message in a request chat
        // Check if this is a request AND if this is the first message (chat just created)
        const chatSetting = await this.prismaService.chatSetting.findFirst({
          where: {
            ChatId: createEntity.ChatId,
            ProfileId: { not: profileId },
            IsRequested: true  // Only if it's a request
          }
        });

        if (chatSetting) {
          // Check if this is the first message in the chat
          const messageCount = await this.prismaService.message.count({
            where: { ChatId: createEntity.ChatId }
          });

          // Only send notification for the first message (chat creation)
          if (messageCount === 1) {
            await this.enqueueMessageNotification(
              createEntity.ChatId,
              profileId,
              createEntity.Content
            );
          }
        }
      }

      // Query message data and full chat (with ALL ChatSettings) in parallel
      const [messageOnly, chatResult] = await Promise.all([
        this.prismaService.message.findFirst({
          where: { Id: createMessage.Id },
          include: {
            Sender: { select: { FullName: true, AvatarUrl: true } },
            ReadReceipts: {
              where: { ReaderId: { not: profileId } },
              include: {
                Reader: { select: { FullName: true, AvatarUrl: true } },
              },
            },
            Medias: true,
          },
        }),
        this.chatsQueryService.getChatByIdWithAllSettings(createEntity.ChatId, profileId),
      ]);

      if (!messageOnly || !chatResult.Result) {
        returnResult.Message = "Failed to load created message or chat";
        return returnResult;
      }

      const fullChat = chatResult.Result;

      const buildPayloadFor = (targetProfileId: string) => {
        const ownSetting = chatResult?.Result?.ChatSettings?.find(cs => cs.ProfileId === targetProfileId);
        return {
          ...messageOnly,
          Chat: {
            ...fullChat,
            ChatSettings: ownSetting ? [ownSetting] : [],
          },
        };
      };

      // Emit to ALL members including sender for multi-device sync
      for (const memberId of memberIds) {
        this.gateway.emitToUsers([memberId], 'new-message', buildPayloadFor(memberId));
      }

      returnResult.Result = buildPayloadFor(profileId) as unknown as Message;
    }
    catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
    }
    return returnResult;
  }

  // We use a trick here => only update to the latest message, not insert every time to saveDb
  async markAsRead(chatId: string): Promise<ReturnResult<MessageReadReceipt>> {
    const returnResult = new ReturnResult<MessageReadReceipt>();

    try {
      const profileId = this.userContext.getProfileId();

      if (!chatId) {
        returnResult.Message = 'chatId is required';
        return returnResult;
      }

      const chat = await this.prismaService.chat.findFirst({
        where: {
          Id: chatId,
          Members: { some: { MemberId: profileId } },
        },
      });

      if (!chat) {
        returnResult.Message = "Chat not found or you are not a member";
        return returnResult;
      }

      // Get latest message not sent by us
      const latestMessage = await this.prismaService.message.findFirst({
        where: {
          ChatId: chatId,
          SenderId: { not: profileId },
        },
        orderBy: { Id: 'desc' },
        select: { Id: true, SenderId: true, ChatId: true },
      });

      if (!latestMessage) {
        returnResult.Message = 'No messages to mark as read';
        return returnResult;
      }

      // Get our latest read receipt for this chat
      const latestReadMessage = await this.prismaService.messageReadReceipt.findFirst({
        where: {
          ReaderId: { equals: profileId },
          Message: {
            Chat: {
              Id: chatId,
            },
          },
        },
      });

      const includeReader = {
        Reader: { select: { FullName: true, AvatarUrl: true } },
      };

      // Prisma include returns richer type than the base MessageReadReceipt export
      let receipt: any;

      if (latestReadMessage) {
        receipt = await this.prismaService.messageReadReceipt.update({
          where: {
            MessageId_ReaderId: {
              MessageId: latestReadMessage.MessageId,
              ReaderId: profileId,
            },
          },
          data: {
            MessageId: latestMessage.Id,
            ReadAt: new Date(),
          },
          include: includeReader,
        });
      } else {
        receipt = await this.prismaService.messageReadReceipt.create({
          data: {
            MessageId: latestMessage.Id,
            ReaderId: profileId,
            ReadAt: new Date(),
          },
          include: includeReader,
        });
      }

      const chatSettings = await this.prismaService.chatSetting.findMany({
        where: {
          ChatId: chatId,
          ProfileId: { in: [profileId, latestMessage.SenderId] },
        },
        select: { ProfileId: true, IsArchived: true, IsRequested: true },
      });

      const readerSetting = chatSettings.find(s => s.ProfileId === profileId) ?? null;
      const senderSetting = chatSettings.find(s => s.ProfileId === latestMessage.SenderId) ?? null;

      const basePayload = {
        messageId: latestMessage.Id,
        readerId: profileId,
        chatId,
        reader: {
          FullName: receipt.Reader?.FullName ?? 'Unknown',
          AvatarUrl: receipt.Reader?.AvatarUrl ?? null,
        },
      };

      this.gateway.emitToUsers([latestMessage.SenderId], 'message-read', {
        ...basePayload,
        chatSetting: senderSetting ? { IsArchived: senderSetting.IsArchived, IsRequested: senderSetting.IsRequested } : null,
      });

      if (profileId !== latestMessage.SenderId) {
        this.gateway.emitToUsers([profileId], 'message-read', {
          ...basePayload,
          chatSetting: readerSetting ? { IsArchived: readerSetting.IsArchived, IsRequested: readerSetting.IsRequested } : null,
        });
      }

      returnResult.Result = receipt;
    } catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
    }

    return returnResult;
  }

  private maskDeleted<T extends { IsDeleted: boolean; Content: string }>(msg: T): T {
    return msg.IsDeleted ? { ...msg, Content: 'This message has been deleted' } : msg;
  }

  async deleteMessage(messageId: number) {
    const returnResult = new ReturnResult<Message>();
    try {
      const profileId = this.userContext.getProfileId();

      const message = await this.prismaService.message.findFirst({
        where: { Id: messageId, SenderId: profileId },
        include: {
          Chat: {
            include: { Members: true, ChatSettings: true },
          },
        },
      });

      if (!message) {
        returnResult.Message = 'Message not found or you are not the sender';
        return returnResult;
      }

      const updated = await this.prismaService.message.update({
        where: { Id: messageId },
        data: { IsDeleted: true },
        include: {
          Sender: { select: { FullName: true, AvatarUrl: true } },
          ReadReceipts: {
            include: { Reader: { select: { FullName: true, AvatarUrl: true } } },
          },
          Medias: true,
        },
      });

      const memberIds = message.Chat.Members.map(m => m.MemberId);
      for (const memberId of memberIds) {
        const ownSetting = message.Chat.ChatSettings.find(cs => cs.ProfileId === memberId);
        this.gateway.emitToUsers([memberId], 'message-deleted', {
          ...this.maskDeleted(updated),
          Chat: { ...message.Chat, ChatSettings: ownSetting ? [ownSetting] : [] },
        });
      }

      returnResult.Result = this.maskDeleted(updated) as unknown as Message;
    } catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
    }
    return returnResult;
  }

  async undoDeleteMessage(messageId: number) {
    const returnResult = new ReturnResult<Message>();
    try {
      const profileId = this.userContext.getProfileId();

      const message = await this.prismaService.message.findFirst({
        where: { Id: messageId, SenderId: profileId, IsDeleted: true },
        include: {
          Chat: {
            include: { Members: true, ChatSettings: true },
          },
        },
      });

      if (!message) {
        returnResult.Message = 'Message not found, not yours, or not deleted';
        return returnResult;
      }

      const updated = await this.prismaService.message.update({
        where: { Id: messageId },
        data: { IsDeleted: false },
        include: {
          Sender: { select: { FullName: true, AvatarUrl: true } },
          ReadReceipts: {
            include: { Reader: { select: { FullName: true, AvatarUrl: true } } },
          },
          Medias: true,
        },
      });

      const memberIds = message.Chat.Members.map(m => m.MemberId);
      for (const memberId of memberIds) {
        const ownSetting = message.Chat.ChatSettings.find(cs => cs.ProfileId === memberId);
        this.gateway.emitToUsers([memberId], 'message-undeleted', {
          ...updated,
          Chat: { ...message.Chat, ChatSettings: ownSetting ? [ownSetting] : [] },
        });
      }

      returnResult.Result = updated as unknown as Message;
    } catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
    }
    return returnResult;
  }

  async updateMessage(messageId: number, dto: UpdateMessageDto) {
    const returnResult = new ReturnResult<Message>();
    try {
      const profileId = this.userContext.getProfileId();

      if (!dto.Content?.trim()) {
        returnResult.Message = 'Content cannot be empty';
        return returnResult;
      }

      const message = await this.prismaService.message.findFirst({
        where: { Id: messageId, SenderId: profileId, IsDeleted: false },
        include: {
          Chat: {
            include: { Members: true, ChatSettings: true },
          },
        },
      });

      if (!message) {
        returnResult.Message = 'Message not found, deleted, or you are not the sender';
        return returnResult;
      }

      const ageMs = Date.now() - new Date(message.DateCreated!).getTime();
      if (ageMs > 5 * 60 * 1000) {
        returnResult.Message = 'Message can only be edited within 5 minutes of sending';
        return returnResult;
      }

      await this.prismaService.messageEditHistory.create({
        data: { MessageId: messageId, Content: message.Content },
      });

      const updated = await this.prismaService.message.update({
        where: { Id: messageId },
        data: { Content: dto.Content.trim(), IsEdited: true, DateModified: new Date() },
        include: {
          Sender: { select: { FullName: true, AvatarUrl: true } },
          ReadReceipts: {
            include: { Reader: { select: { FullName: true, AvatarUrl: true } } },
          },
          Medias: true,
        },
      });

      const memberIds = message.Chat.Members.map(m => m.MemberId);
      for (const memberId of memberIds) {
        const ownSetting = message.Chat.ChatSettings.find(cs => cs.ProfileId === memberId);
        this.gateway.emitToUsers([memberId], 'message-updated', {
          ...updated,
          Chat: { ...message.Chat, ChatSettings: ownSetting ? [ownSetting] : [] },
        });
      }

      returnResult.Result = updated as unknown as Message;
    } catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
    }
    return returnResult;
  }

  async getMessageEditHistory(messageId: number, page: Page<number>) {
    const returnResult = new ReturnResult<PagedData<number, MessageEditHistory>>();
    try {
      const profileId = this.userContext.getProfileId();

      const message = await this.prismaService.message.findFirst({
        where: {
          Id: messageId,
          Chat: { Members: { some: { MemberId: profileId } } },
        },
        select: { Id: true },
      });

      if (!message) {
        returnResult.Message = 'Message not found or you are not a member';
        return returnResult;
      }

      const pageSize = page.size || 20;
      const idFilter: { lt?: number } = {};
      if (page.indexPaging) idFilter.lt = page.indexPaging;

      const [history, total] = await Promise.all([
        this.prismaService.messageEditHistory.findMany({
          where: {
            MessageId: messageId,
            ...(Object.keys(idFilter).length > 0 && { Id: idFilter }),
          },
          orderBy: { Id: 'desc' },
          take: pageSize,
        }),
        this.prismaService.messageEditHistory.count({
          where: { MessageId: messageId },
        }),
      ]);

      returnResult.Result = { page: { ...page, totalElements: total }, data: history };
    } catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
    }
    return returnResult;
  }

  async getMessagePaging(chatId: string, page: Page<number>) {
    const returnResult = new ReturnResult<PagedData<number, Message>>();
    try {

      const profileId = this.userContext.getProfileId();

      const chat = await this.prismaService.chat.findFirst({
        where: {
          Id: chatId,
          Members: { some: { MemberId: profileId } }
        },
        include: {
          ChatSettings: {
            where: { ProfileId: profileId },
            select: { DeleteUpToMessageId: true },
          },
        },
      });

      if (!chat) {
        returnResult.Message = "Can't find the chat";
        return returnResult;
      }

      const deleteUpTo = chat.ChatSettings[0]?.DeleteUpToMessageId ?? null;
      const pageSize = page.size || 30;

      const idFilter: { lt?: number; gt?: number } = {};
      if (page.indexPaging) idFilter.lt = page.indexPaging;
      if (deleteUpTo) idFilter.gt = deleteUpTo;

      const messages = await this.prismaService.message.findMany({
        where: {
          ChatId: chatId,
          ...(Object.keys(idFilter).length > 0 && { Id: idFilter }),
        },
        include: {
          Sender: {
            select: { FullName: true, AvatarUrl: true }
          },
          ReadReceipts: {
            where: {
              ReaderId: {
                not: profileId
              }
            },
            include: {
              Reader: { select: { FullName: true, AvatarUrl: true } },
            },
          },
          Medias: true
        },
        take: pageSize,
        orderBy: [{ Id: 'desc' }],
      });

      returnResult.Result = { page: { ...page }, data: messages.map(m => this.maskDeleted(m)) };
    } catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
    }
    return returnResult;
  }

  async getMessageReaders(messageId: number, page: Page<number>) {
    const returnResult = new ReturnResult<PagedData<number, MessageReadReceipt>>();
    try {
      const profileId = this.userContext.getProfileId();

      const message = await this.prismaService.message.findFirst({
        where: {
          Id: messageId,
          Chat: {
            Members: { some: { MemberId: profileId } },
          },
        },
        select: { Id: true },
      });

      if (!message) {
        returnResult.Message = "Message not found or you are not a member of its chat";
        return returnResult;
      }

      const pageSize = page.size || 20;
      const pageNumber = page.pageNumber || 1;
      const skip = (pageNumber - 1) * pageSize;

      const [readers, total] = await Promise.all([
        this.prismaService.messageReadReceipt.findMany({
          where: {
            MessageId: messageId,
            ReaderId: { not: profileId },
          },
          include: {
            Reader: { select: { FullName: true, AvatarUrl: true } },
          },
          skip,
          take: pageSize,
          orderBy: { ReadAt: 'desc' },
        }),
        this.prismaService.messageReadReceipt.count({
          where: {
            MessageId: messageId,
            ReaderId: { not: profileId },
          },
        }),
      ]);

      returnResult.Result = {
        page: { ...page, totalElements: total },
        data: readers,
      };
    } catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
    }
    return returnResult;
  }

  async getMediaPaging(chatId: string, page: Page<string>) {
    const returnResult = new ReturnResult<PagedData<string, Media>>();
    try {
      const profileId = this.userContext.getProfileId();

      const chat = await this.prismaService.chat.findFirst({
        where: {
          Id: chatId,
          Members: { some: { MemberId: profileId } },
        },
        include: {
          ChatSettings: {
            where: { ProfileId: profileId },
          },
        },
      });

      if (!chat) {
        returnResult.Message = "Can't find the chat";
        return returnResult;
      }

      const deleteUpTo = chat.ChatSettings[0]?.DeleteUpToMessageId ?? null;
      const pageSize = page.size || 30;
      const pageNumber = page.pageNumber || 1;
      const skip = (pageNumber - 1) * pageSize;

      const mediaTypeFilter = page.selected?.length
        ? page.selected[0] as unknown as string
        : undefined;

      const where: Record<string, unknown> = {
        Deleted: false,
        Message: {
          ChatId: chatId,
          IsDeleted: false,
        },
      };

      // Exclude media from messages the user has cleared (soft-delete)
      if (deleteUpTo != null) {
        where.MessageId = { gt: deleteUpTo };
      }

      if (mediaTypeFilter) {
        where.Type = mediaTypeFilter;
      }

      const [medias, total] = await Promise.all([
        this.prismaService.media.findMany({
          where: where as any,
          include: {
            Message: {
              select: { Id: true, Content: true, DateCreated: true, SenderId: true },
            },
          },
          skip,
          take: pageSize,
          orderBy: { DateCreated: 'desc' },
        }),
        this.prismaService.media.count({
          where: where as any,
        }),
      ]);

      returnResult.Result = {
        page: { ...page, totalElements: total },
        data: medias,
      };
    } catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
    }
    return returnResult;
  }
}
