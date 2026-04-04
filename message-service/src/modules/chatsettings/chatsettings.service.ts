import { Injectable } from '@nestjs/common';
import { UserContextService } from '../auth/userContext.service';
import { PrismaService } from '../prisma-database/prisma.service';
import { UserfollowsService } from '../userfollows/userfollows.service';
import { ReturnResult } from 'src/shared/dtos/helper/ReturnResult';
import { Chat, ChatRole, ChatSetting } from 'src/generated/prisma/client';

@Injectable()
export class ChatsettingsService {
  constructor(
    private readonly userContext: UserContextService,
    private readonly prismaService: PrismaService,
    private readonly userfollowsService: UserfollowsService
  ) { }

  async initialChatSetting(chat: Chat, profileIds: string[] | string): Promise<ReturnResult<ChatSetting>> {
    const returnResult: ReturnResult<ChatSetting> = new ReturnResult<ChatSetting>();

    try {

      const currentProfileId = this.userContext.getProfileId();
      const allProfileIds = Array.isArray(profileIds) ? [...profileIds, currentProfileId] : [profileIds, currentProfileId];

      //Fetch all followers of current profileId
      const follows = await this.userfollowsService.getFollowersByProfiles(allProfileIds);

      // Create a set of profiles that follow the current user
      const followersSet = new Set(follows.map(f => f.OwnerId));

      // Build ChatSetting records for all participants
      const chatSettingData = allProfileIds.map(profileId => ({
        ChatId: chat.Id,
        ProfileId: profileId,
        IsRequested: profileId === currentProfileId ? false : !followersSet.has(profileId),
        Role: chat.IsGroup ? profileId === currentProfileId ? ChatRole.ADMIN : ChatRole.MEMBER : ChatRole.MEMBER
      }));

      // Create all ChatSetting records in batch
      const chatSettings = await this.prismaService.chatSetting.createManyAndReturn({
        data: chatSettingData
      });

      returnResult.Result = chatSettings.find(x => x.ProfileId == currentProfileId);

    } catch (ex) {
      if (ex instanceof Error) {
        returnResult.Message = ex.message;
      } else {
        returnResult.Message = String(ex);
      }
    }
    return returnResult;
  }
}
