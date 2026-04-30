import { Injectable, Scope } from '@nestjs/common';
import { CreateChatDto } from './dto/create-chat.dto';
import { ReturnResult } from 'src/shared/dtos/helper/ReturnResult';
import { Chat, Profile, Prisma } from 'src/generated/prisma/client';
import { PrismaService } from '../prisma-database/prisma.service';
import { UserContextService } from '../auth/userContext.service';
import { ProfilesService } from '../profiles/profiles.service';
import { ProfileblocksService } from '../profileblocks/profileblocks.service';
import { ChatsettingsService } from '../chatsettings/chatsettings.service'
import { Page } from 'src/shared/dtos/paging/page';
import { PagedData } from 'src/shared/dtos/paging/pagedData';
import { ProfilechatsService } from '../profilechats/profilechats.service';
import { MessagesService } from '../messages/messages.service';

@Injectable({ scope: Scope.REQUEST })
export class ChatsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly userContext: UserContextService,
    private readonly profileBlocksService: ProfileblocksService,
    private readonly profileService: ProfilesService,
    private readonly chatsSettingService: ChatsettingsService,
    private readonly profileChatsService: ProfilechatsService,
    private readonly messagesService: MessagesService
  ) { }

  async create(createChatDto: CreateChatDto, file?: Express.Multer.File) {
    const returnResult: ReturnResult<Chat> = new ReturnResult<Chat>();
    try {
      const currentProfileId = this.userContext.getProfileId();

      if (createChatDto.profileIds === currentProfileId) {
        returnResult.Message = "You cant create chat with yourself"
        return returnResult
      }

      const profileIds = Array.isArray(createChatDto.profileIds) ? [currentProfileId, ...createChatDto.profileIds] : [currentProfileId, createChatDto.profileIds];

      // Check if 1-on-1 chat already exists or if they make 1-1 chat => they must have message
      if (profileIds.length === 2) {
        if (!createChatDto.message || !createChatDto.message.Content) {
          returnResult.Message = "Forbidden"
          return returnResult
        }

        const existingChat = await this.prismaService.chat.findFirst({
          where: {
            IsGroup: false,
            Members: {
              every: {
                MemberId: {
                  in: profileIds
                }
              }
            }
          }
        });

        if (existingChat) {
          returnResult.Message = "Chat already exists with this user";
          return returnResult;
        }
      }

      // Fetch all profiles
      const findResult = await this.profileService.findProfiles(profileIds);
      if (findResult.Message) {
        returnResult.Message = findResult.Message;
        return returnResult;
      }
      // Check for blocks between profiles
      const profileBlock = await this.profileBlocksService.checkBlocks(profileIds);
      if (profileBlock) {
        returnResult.Message = "Forbidden";
        return returnResult;
      }

      // Create chat
      const newChat = await this.prismaService.chat.create({
        data: {
          IsGroup: profileIds.length > 2,
          Name: profileIds.length > 2
            ? createChatDto.name?.length
              ? createChatDto.name
              : this.getGroupName(findResult.Result || [])
            : null,
        }
      });

      // Initialize profile chats
      await this.profileChatsService.initializeProfileChats(profileIds, newChat.Id);
      // Initialize chat settings
      await this.chatsSettingService.initialChatSettings(newChat, profileIds);
      //Send Message
      if (createChatDto.message) {
        createChatDto.message.ChatId = newChat.Id
        await this.messagesService.createMessage(createChatDto.message, file);
      }

      const chatReturned = await this.prismaService.chat.findFirst({
        where: {
          Id: newChat.Id
        },
        include: {
          ChatSettings: {
            where: {
              ProfileId: currentProfileId
            }
          },
          Messages: {
            take: 5,
            orderBy: { DateCreated: 'desc' }
          }
        }
      });

      if (!chatReturned) {
        returnResult.Message = 'Failed to retrieve created chat';
        return returnResult;
      }

      returnResult.Result = chatReturned
    } catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
    }
    return returnResult;
  }

  async getPaging(page: Page<string>, type: string = "") {
    const returnResult = new ReturnResult<PagedData<string, Chat>>();

    try {
      const profileId = this.userContext.getProfileId();
      if (page.size > 30) page.size = 30;

      const isDefaultType = type !== "archived" && type !== "request";

      const chatSettingWhere: Prisma.ChatSettingWhereInput = {
        ProfileId: profileId,
        ...(type === "archived"
          ? { IsArchived: true }
          : type === "request"
            ? { IsRequested: true }
            : { IsArchived: false, IsRequested: false }),
      };

      const includeClause = {
        Members: {
          where: { MemberId: { not: profileId } },
          include: {
            Member: { select: { FullName: true, AvatarUrl: true } },
          },
        },
        ChatSettings: {
          where: { ProfileId: { equals: profileId } },
        },
        Messages: {
          orderBy: { DateCreated: "desc" } as const,
          take: 1,
          include: {
            Sender: { select: { FullName: true, AvatarUrl: true } },
            ReadReceipts: {
              where: { ReaderId: { not: profileId } },
              include: {
                Reader: { select: { FullName: true, AvatarUrl: true } },
              },
            },
          },
        },
      };

      const collected: any[] = [];
      let pinnedChatId: string | null = null;

      // On page 1 for default type, fetch the pinned chat first
      if (page.pageNumber === 1 && isDefaultType) {
        const pinnedChat = await this.prismaService.chat.findFirst({
          where: {
            Members: { some: { MemberId: profileId } },
            ChatSettings: {
              some: {
                ...chatSettingWhere,
                IsPinned: true,
              },
            },
          },
          include: includeClause,
        });

        if (pinnedChat) {
          collected.push(pinnedChat);
          pinnedChatId = pinnedChat.Id;
        }
      }

      // For page 2+, find the pinned chat ID to exclude it
      if (page.pageNumber > 1 && isDefaultType) {
        const pinnedSetting = await this.prismaService.chatSetting.findFirst({
          where: {
            ProfileId: profileId,
            IsPinned: true,
            IsArchived: false,
            IsRequested: false,
          },
          select: { ChatId: true },
        });
        if (pinnedSetting) pinnedChatId = pinnedSetting.ChatId;
      }

      const remainingSize = page.size - collected.length;
      let skip = page.pageNumber === 1 ? 0 : remainingSize * (page.pageNumber - 2) + page.size - (pinnedChatId ? 1 : 0);
      let iterations = 0;

      while (collected.length < page.size && iterations < 10) {
        iterations++;

        const batch = await this.prismaService.chat.findMany({
          where: {
            Members: { some: { MemberId: profileId } },
            ChatSettings: { some: chatSettingWhere },
            ...(pinnedChatId && { Id: { not: pinnedChatId } }),
          },
          include: includeClause,
          orderBy: [{ DateModified: "desc" }, { DateCreated: "desc" }],
          skip,
          take: page.size,
        });

        if (batch.length === 0) break;

        for (const chat of batch) {
          const setting = chat.ChatSettings[0];

          if (setting?.DeleteUpToMessageId != null) {
            const latestMessage = chat.Messages[0];
            if (!latestMessage || latestMessage.Id <= setting.DeleteUpToMessageId) continue;
          }

          collected.push(chat);
          if (collected.length >= page.size) break;
        }

        skip += batch.length;
      }

      returnResult.Result = { page, data: collected };
    } catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
    }
    return returnResult;
  }

  //Private helper function
  getGroupName(profiles: Profile[]): string {
    const lastNames = profiles
      .map(p => {
        const fullName = p.FullName || '';
        const parts = fullName.trim().split(/\s+/);
        return parts[parts.length - 1];
      })
      .filter(Boolean);

    const maxDisplay = 3;
    const displayNames = lastNames.slice(0, maxDisplay).join(',');
    const remaining = lastNames.length - maxDisplay;

    let groupName = `Group Of ${displayNames}`;
    if (remaining > 0) {
      groupName += ` and ${remaining} Others`;
    }

    return groupName;
  }
}
