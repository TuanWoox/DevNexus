import { Injectable, Scope } from '@nestjs/common';
import { CreateChatDto } from './dto/create-chat.dto';
import { ReturnResult } from 'src/shared/dtos/helper/ReturnResult';
import { Chat, Message, Profile } from 'src/generated/prisma/client';
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

  async getPaging(page: Page<string>) {
    const returnResult = new ReturnResult<PagedData<string, Chat>>();
    try {
      const profileId = this.userContext.getProfileId();

      const chats = await this.prismaService.chat.findMany({
        where: {
          Members: {
            some: {
              MemberId: profileId
            }
          }
        },
        include: {
          Members: true
        },
        skip: page.size * (page.pageNumber - 1),
        take: page.size,
        orderBy: [
          { DateModified: 'desc' },
          { DateCreated: 'desc' }
        ]
      });

      if (chats.length > 0) {
        const profileIds = [
          ...new Set(
            chats
              .filter(chat => !chat.IsGroup)
              .flatMap(chat => chat.Members.map(x => x.MemberId).filter(x => x !== profileId))
          )
        ];

        if (profileIds.length > 0) {
          const profiles = (await this.profileService.findProfiles(profileIds)).Result;

          if (profiles?.length) {
            const profileMap = new Map(profiles.map(p => [p.Id, p]));

            for (const chat of chats) {
              if (!chat.IsGroup) {
                const otherMemberId = chat.Members.find(x => x.MemberId !== profileId)?.MemberId;
                const profile = otherMemberId ? profileMap.get(otherMemberId) : undefined;
                if (profile) {
                  chat.Name = profile.FullName;
                  chat.ChatPictureUrl = profile.AvatarUrl;
                }
              }
            }
          }
        }
      }

      returnResult.Result = { page, data: chats };
    } catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
    }
    return returnResult;
  }

  async getMessagePaging(id: string, page: Page<number>) {
    const returnResult = new ReturnResult<PagedData<number, Message>>();
    try {
      const chat = await this.prismaService.chat.findFirst({
        where: {
          Id: id,
          Members: {
            some: {
              MemberId: this.userContext.getProfileId()
            }
          }
        },
        include: {
          Members: true
        }
      });

      if (!chat) {
        returnResult.Message = "Can't find the chat";
        return returnResult;
      }

      const pageSize = page.size || 30;

      const messages = await this.prismaService.message.findMany({
        where: {
          ChatId: id,
          // If cursor exists, fetch messages OLDER than it
          ...(page.indexPaging && {
            Id: { lt: page.indexPaging }
          })
        },
        include: {
          Sender: {
            select: {
              FullName: true,
              AvatarUrl: true
            }
          }
        },
        take: pageSize,
        orderBy: { DateCreated: 'desc', Id: 'desc' } // latest first
      });

      returnResult.Result = {
        page: { ...page },
        data: messages // ordered latest→oldest, reverse on frontend if needed
      };
    }
    catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
    }
    return returnResult;
  }

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
