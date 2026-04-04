import { Injectable, Scope } from '@nestjs/common';
import { CreateChatDto } from './dto/create-chat.dto';
import { ReturnResult } from 'src/shared/dtos/helper/ReturnResult';
import { Chat, Message, Profile } from 'src/generated/prisma/client';
import { PrismaService } from '../prisma-database/prisma.service';
import { UserContextService } from '../auth/userContext.service';
import { ProfilesService } from '../profiles/profiles.service';
import { ProfileblocksService } from '../profileblocks/profileblocks.service';
import { ChatsettingsService } from '../chatsettings/chatsettings.service'
import { ReturnChat } from './dto/return-chat.dto';
import { Page } from 'src/shared/dtos/paging/page';
import { PagedData } from 'src/shared/dtos/paging/pagedData';
@Injectable({ scope: Scope.REQUEST })
export class ChatsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly userContext: UserContextService,
    private readonly profileBlocksService: ProfileblocksService,
    private readonly profileService: ProfilesService,
    private readonly chatsSettingService: ChatsettingsService
  ) { }

  async create(createChatDto: CreateChatDto) {
    const returnResult: ReturnResult<ReturnChat> = new ReturnResult<ReturnChat>();
    try {
      const currentProfileId = this.userContext.getProfileId();
      const findResult = await this.profileService.findProfiles(createChatDto.profileIds);
      if (findResult.Message) {
        returnResult.Message = findResult.Message;
        return returnResult;
      }

      const profileBlock = await this.profileBlocksService.checkBlocks(createChatDto.profileIds);
      if (profileBlock) {
        returnResult.Message = "Forbidden";
        return returnResult;
      }

      // Get current user's profile
      const currentUserProfile = await this.prismaService.profile.findUnique({
        where: { Id: currentProfileId }
      });

      // Build profiles list with current user first
      const profilesForName = currentUserProfile && findResult.Result ? [currentUserProfile, ...findResult.Result] : findResult.Result || [];

      const newChat = await this.prismaService.chat.create({
        data: {
          Members: [...createChatDto.profileIds, currentProfileId],
          IsGroup: createChatDto.profileIds.length > 1 ? true : false,
          Name: createChatDto.profileIds.length > 1 ? createChatDto.name?.length ? createChatDto.name : this.getGroupName(profilesForName) : null,
        }
      })

      const initialChatSettingResult = await this.chatsSettingService.initialChatSetting(newChat, createChatDto.profileIds);

      if (!initialChatSettingResult.Result) {
        returnResult.Message = initialChatSettingResult.Message ?? 'Failed to initialize chat setting';
        return returnResult;
      }

      returnResult.Result = {
        chat: newChat,
        chatSetting: initialChatSettingResult.Result
      };

    } catch (ex) {
      if (ex instanceof Error) {
        returnResult.Message = ex.message;
      } else {
        returnResult.Message = String(ex);
      }
    }
    return returnResult;
  }

  async getPaging(page: Page<string>) {
    const returnResult = new ReturnResult<PagedData<string, Chat>>();
    try {
      const profileId = this.userContext.getProfileId();

      const chats = await this.prismaService.chat.findMany({
        where: {
          Members: { has: profileId }
        },
        skip: page.size * (page.pageNumber - 1),
        take: page.size,
        orderBy: [
          { DateModified: 'desc' },
          { DateCreated: 'desc' }
        ]
      });

      if (chats.length > 0) {
        // Deduplicate profile IDs before fetching — avoids redundant network calls
        const profileIds = [
          ...new Set(
            chats
              .filter(chat => !chat.IsGroup)
              .flatMap(chat => chat.Members.filter(x => x !== profileId))
          )
        ];

        if (profileIds.length > 0) {
          const profiles = (await this.profileService.findProfiles(profileIds)).Result;

          if (profiles?.length) {
            // O(1) lookup map instead of O(n) Array.find() per chat
            const profileMap = new Map(profiles.map(p => [p.Id, p]));

            for (const chat of chats) {
              if (!chat.IsGroup) {
                const otherMemberId = chat.Members.find(x => x !== profileId);
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
          Members: { has: this.userContext.getProfileId() }
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
