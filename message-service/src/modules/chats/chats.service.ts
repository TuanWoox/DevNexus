import { Injectable, Scope } from '@nestjs/common';
import { CreateChatDto } from './dto/create-chat.dto';
import { ReturnResult } from 'src/shared/dtos/ReturnResult';
import { Profile } from 'src/generated/prisma/client';
import { PrismaService } from '../prisma-database/prisma.service';
import { UserContextService } from '../auth/userContext.service';
import { ProfilesService } from '../profiles/profiles.service';
import { ProfileblocksService } from '../profileblocks/profileblocks.service';
import { ChatsettingsService } from '../chatsettings/chatsettings.service'
import { ReturnChat } from './dto/return-chat.dto';

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
