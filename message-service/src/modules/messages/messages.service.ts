import { Injectable, Scope } from '@nestjs/common';
import { PrismaService } from '../prisma-database/prisma.service';
import { UserContextService } from '../auth/userContext.service';
import { ReturnResult } from 'src/shared/dtos/helper/ReturnResult';
import { Message, MessageReadReceipt } from 'src/generated/prisma/client';
import { CreateMessageDto } from './dto/create-message.dto';
import { ProfileblocksService } from '../profileblocks/profileblocks.service';
import { MediasService } from '../medias/medias.service';
import { MessageChatGateway } from '../message-chat-gateway/message-chat.gateway';
import { Page } from 'src/shared/dtos/paging/page';
import { PagedData } from 'src/shared/dtos/paging/pagedData';


@Injectable({ scope: Scope.REQUEST })
export class MessagesService {

  constructor(
    private readonly prismaService: PrismaService,
    private readonly userContext: UserContextService,
    private readonly profileBlocksService: ProfileblocksService,
    private readonly mediasService: MediasService,
    private readonly gateway: MessageChatGateway,
  ) { }

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
          Members: {
            some: { MemberId: profileId }
          }
        },
        include: {
          Members: true,
        }
      });

      if (!chat) {
        returnResult.Message = "Chat can't be found or does not exist";
        return returnResult;
      }

      const otherMemberIds = chat.Members.filter(x => x.MemberId !== profileId).map(x => x.MemberId);
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
          where: {
            Id: createEntity.ChatId
          },
          data: {
            DateModified: new Date()
          }
        })
        if (file) {
          await this.mediasService.handleUpload(file, createMessage.Id);
        }
      }

      const newlyCreatedMessage = await this.prismaService.message.findFirst({
        where: {
          Id: createMessage.Id
        },
        include: {
          Chat: {
            include: {
              ChatSettings: {
                where: {
                  ProfileId: profileId
                }
              }
            }
          },
          Sender: { select: { FullName: true, AvatarUrl: true } },
          ReadReceipts: {
            where: { ReaderId: { not: profileId } },
            include: {
              Reader: { select: { FullName: true, AvatarUrl: true } },
            },
          },
          Medias: true
        }
      })

      // Emit new-message to all other chat members — frontend handles
      // whether to show notification or silently insert (requested vs accepted)
      if (otherMemberIds.length > 0) {
        this.gateway.emitToUsers(otherMemberIds, 'new-message', newlyCreatedMessage);
      }

      returnResult.Result = newlyCreatedMessage!;
    }
    catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
    }
    return returnResult;
  }
  async markMultipleAsRead(messageIdStrings: string[]): Promise<ReturnResult<MessageReadReceipt[]>> {
    const returnResult = new ReturnResult<MessageReadReceipt[]>();
    try {
      const profileId = this.userContext.getProfileId();
      const messageIds = messageIdStrings.map(id => parseInt(id, 10)).filter(id => !isNaN(id));

      if (messageIds.length === 0) {
        returnResult.Message = 'No valid message IDs provided';
        return returnResult;
      }

      // Fetch all messages to verify access and get details
      const messages = await this.prismaService.message.findMany({
        where: {
          Id: { in: messageIds },
          Chat: {
            Members: { some: { MemberId: profileId } },
          },
        },
        select: {
          Id: true,
          SenderId: true,
          ChatId: true,
          Chat: {
            select: {
              ChatSettings: {
                where: { ProfileId: { not: profileId } },
                select: { ProfileId: true, IsRequested: true },
              },
            },
          },
        },
      });

      if (messages.length !== messageIds.length) {
        returnResult.Message = 'Some messages not found or you are not a member of their chats';
        return returnResult;
      }

      // Filter out messages sent by the current user
      const validMessages = messages.filter(msg => msg.SenderId !== profileId);

      if (validMessages.length === 0) {
        returnResult.Message = 'No valid messages to mark as read (cannot mark own messages)';
        return returnResult;
      }

      // Create or update read receipts for all valid messages
      const receipts = await Promise.all(
        validMessages.map(message =>
          this.prismaService.messageReadReceipt.upsert({
            where: {
              MessageId_ReaderId: { MessageId: message.Id, ReaderId: profileId },
            },
            create: { MessageId: message.Id, ReaderId: profileId },
            update: {},
          }),
        ),
      );

      // Notify senders for each message (only if not requested)
      const notificationMap = new Map<string, { messageIds: number[]; isRequested: boolean }>();

      validMessages.forEach(message => {
        const senderSetting = message.Chat.ChatSettings.find(
          s => s.ProfileId === message.SenderId,
        );
        if (senderSetting && !senderSetting.IsRequested) {
          if (!notificationMap.has(message.SenderId)) {
            notificationMap.set(message.SenderId, { messageIds: [], isRequested: false });
          }
          notificationMap.get(message.SenderId)!.messageIds.push(message.Id);
        }
      });

      // Emit notifications by sender
      notificationMap.forEach((data, senderId) => {
        this.gateway.emitToUsers(
          [senderId],
          'messages-read',
          { messageIds: data.messageIds, readerId: profileId },
        );
      });

      returnResult.Result = receipts;
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

      const messages = await this.prismaService.message.findMany({
        where: {
          ChatId: chatId,
          // Cursor-based: only messages older than the cursor
          ...(page.indexPaging && { Id: { lt: page.indexPaging } }),
          // Soft-delete filter: hide messages the user has cleared
          ...(deleteUpTo && { Id: { gt: deleteUpTo } }),
        },
        include: {
          Sender: {
            select: { FullName: true, AvatarUrl: true }
          },
          //We exclude our own
          ReadReceipts: {
            where: {
              ReaderId: {
                not: profileId
              }
            }
          },
          Medias: true
        },
        take: pageSize,
        orderBy: [{ Id: 'desc' }],
      });

      returnResult.Result = { page: { ...page }, data: messages };
    } catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
    }
    return returnResult;
  }
}
