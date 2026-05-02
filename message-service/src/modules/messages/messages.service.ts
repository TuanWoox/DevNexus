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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      this.gateway.emitToUsers(
        [latestMessage.SenderId],
        'message-read',
        {
          messageId: latestMessage.Id,
          readerId: profileId,
          chatId,
          reader: {
            FullName: receipt.Reader?.FullName ?? 'Unknown',
            AvatarUrl: receipt.Reader?.AvatarUrl ?? null,
          },
        },
      );

      returnResult.Result = receipt;
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

      returnResult.Result = { page: { ...page }, data: messages };
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
}
