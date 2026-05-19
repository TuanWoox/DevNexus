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
          // do NOT filter out current user — frontend needs own member entry to emit typing events
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
              // where: { ReaderId: { equals: profileId } },
              include: {
                Reader: { select: { FullName: true, AvatarUrl: true } },
              },
            },
            Medias: true
          },
        },
      };

      const collected: any[] = [];
      let skip = (page.pageNumber - 1) * page.size;
      let iterations = 0;

      while (collected.length < page.size && iterations < 10) {
        iterations++;

        const batchSettings = await this.prismaService.chatSetting.findMany({
          where: chatSettingWhere,
          include: {
            Chat: {
              include: includeClause,
            },
          },
          orderBy: [
            ...(isDefaultType ? [{ IsPinned: "desc" as const }] : []),
            { Chat: { DateModified: "desc" as const } },
            { Chat: { DateCreated: "desc" as const } },
          ],
          skip,
          take: page.size,
        });

        if (batchSettings.length === 0) break;

        for (const chatSetting of batchSettings) {
          const chat = chatSetting.Chat;
          const setting = chat.ChatSettings[0];

          if (setting?.DeleteUpToMessageId != null) {
            const latestMessage = chat.Messages[0];
            if (!latestMessage || latestMessage.Id <= setting.DeleteUpToMessageId) continue;
          }

          collected.push(chat);
          if (collected.length >= page.size) break;
        }

        skip += batchSettings.length;
      }

      returnResult.Result = { page, data: collected };
    } catch (ex) {
      console.log(ex);
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
    }
    return returnResult;
  }

  async getChatById(chatId: string) {
    const returnResult = new ReturnResult<Chat>();
    try {
      const profileId = this.userContext.getProfileId();

      const chat = await this.prismaService.chat.findFirst({
        where: {
          Id: chatId,
          Members: { some: { MemberId: profileId } },
        },
        include: {
          Members: {
            // do NOT filter out current user — frontend needs own member entry to emit typing events
            include: {
              Member: { select: { FullName: true, AvatarUrl: true } },
            },
          },
          ChatSettings: {
            where: { ProfileId: { equals: profileId } },
          },
          Messages: {
            orderBy: { DateCreated: 'desc' as const },
            take: 1,
            include: {
              Sender: { select: { FullName: true, AvatarUrl: true } },
              ReadReceipts: {
                where: { ReaderId: { equals: profileId } },
                include: {
                  Reader: { select: { FullName: true, AvatarUrl: true } },
                },
              },
              Medias: true,
            },
          },
        },
      });

      if (!chat) {
        returnResult.Message = 'Chat not found or access denied';
        return returnResult;
      }

      returnResult.Result = chat;
    } catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
    }
    return returnResult;
  }

  async getChatByProfileId(targetProfileId: string) {
    const returnResult = new ReturnResult<Chat | null>();
    try {
      const currentProfileId = this.userContext.getProfileId();

      if (!targetProfileId || targetProfileId === currentProfileId) {
        returnResult.Result = null;
        return returnResult;
      }

      const chat = await this.prismaService.chat.findFirst({
        where: {
          IsGroup: false,
          Members: {
            every: {
              MemberId: {
                in: [currentProfileId, targetProfileId],
              },
            },
            some: {
              MemberId: currentProfileId,
            },
          },
          AND: [
            {
              Members: {
                some: {
                  MemberId: targetProfileId,
                },
              },
            },
          ],
        },
        include: {
          Members: {
            include: {
              Member: { select: { FullName: true, AvatarUrl: true } },
            },
          },
          ChatSettings: {
            where: { ProfileId: { equals: currentProfileId } },
          },
          Messages: {
            orderBy: { DateCreated: 'desc' as const },
            take: 1,
            include: {
              Sender: { select: { FullName: true, AvatarUrl: true } },
              ReadReceipts: {
                where: { ReaderId: { equals: currentProfileId } },
                include: {
                  Reader: { select: { FullName: true, AvatarUrl: true } },
                },
              },
              Medias: true,
            },
          },
        },
      });

      returnResult.Result = chat;
    } catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
    }
    return returnResult;
  }

  async searchContactsAndGroups(page: Page<string>) {
    const returnResult = new ReturnResult<PagedData<string, Chat>>();

    try {
      const profileId = this.userContext.getProfileId();
      const query = page.selected?.[0]?.trim() ?? '';

      if (!query) {
        returnResult.Result = { page: { ...page, totalElements: 0 }, data: [] };
        return returnResult;
      }

      if (page.size > 30) page.size = 30;

      // Same include as getPaging so frontend gets the full Chat shape
      const includeClause = {
        Members: {
          include: {
            Member: { select: { FullName: true, AvatarUrl: true } },
          },
        },
        ChatSettings: {
          where: { ProfileId: { equals: profileId } },
        },
        Messages: {
          orderBy: { DateCreated: 'desc' as const },
          take: 1,
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
        },
      };

      const contactWhere: any = {
        IsGroup: false,
        AND: [
          { Members: { some: { MemberId: profileId } } },
          {
            Members: {
              some: {
                MemberId: { not: profileId },
                Member: {
                  FullName: { contains: query, mode: 'insensitive' },
                },
              },
            },
          },
        ],
      };

      const groupWhere = {
        IsGroup: true,
        Members: { some: { MemberId: profileId } },
        Name: { contains: query, mode: 'insensitive' as const },
      };

      // Count totals for cross-source pagination
      const contactCount = await this.prismaService.chat.count({ where: contactWhere });
      const groupCount = await this.prismaService.chat.count({ where: groupWhere });
      const totalElements = contactCount + groupCount;

      const offset = ((page.pageNumber ?? 1) - 1) * page.size;
      const allResults: any[] = [];

      // Fetch contacts if offset falls within contact range
      if (offset < contactCount) {
        const take = Math.min(page.size, contactCount - offset);
        const batch = await this.prismaService.chat.findMany({
          where: contactWhere,
          include: includeClause,
          orderBy: [{ DateModified: 'desc' }, { DateCreated: 'desc' }],
          skip: offset,
          take,
        });
        allResults.push(...batch);
      }

      // Fill remaining from groups
      const remaining = page.size - allResults.length;
      if (remaining > 0) {
        const groupOffset = Math.max(0, offset - contactCount);
        const batch = await this.prismaService.chat.findMany({
          where: groupWhere,
          include: includeClause,
          orderBy: [{ DateModified: 'desc' }, { DateCreated: 'desc' }],
          skip: groupOffset,
          take: remaining,
        });
        allResults.push(...batch);
      }

      returnResult.Result = { page: { ...page, totalElements }, data: allResults };
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
