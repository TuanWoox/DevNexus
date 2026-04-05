import { Injectable } from '@nestjs/common';
import { UserContextService } from '../auth/userContext.service';
import { PrismaService } from '../prisma-database/prisma.service';
import { UserfollowsService } from '../userfollows/userfollows.service';
import { ReturnResult } from 'src/shared/dtos/helper/ReturnResult';
import { Chat, ChatRole, ChatSetting } from 'src/generated/prisma/client';
import { UpdateChatSettingDTO } from './dto/update-chatsetting-dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
@Injectable()
export class ChatsettingsService {
  constructor(
    private readonly userContext: UserContextService,
    private readonly prismaService: PrismaService,
    private readonly userfollowsService: UserfollowsService,
    @InjectQueue('chatsetting') private chatSettingQueue: Queue
  ) { }

  async initialChatSettings(chat: Chat, profileIds: string[] | string): Promise<ReturnResult<ChatSetting>> {
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

  async updateChatSetting(updateInfo: UpdateChatSettingDTO) {
    const returnResult = new ReturnResult<ChatSetting>();
    try {
      const chatSetting = await this.prismaService.chatSetting.findFirst({
        where: {
          ProfileId: this.userContext.getProfileId(),
          Id: updateInfo.Id,
        },
        include: {
          Chat: true
        }
      })
      if (!chatSetting) {
        returnResult.Message = "Chat setting cant be found or does not exist";
        return returnResult;
      }

      // Convert null to undefined so Prisma ignores those fields
      const updatedData = Object.fromEntries(
        Object.entries(updateInfo).map(([key, value]) => [key, value ?? undefined])
      );

      const updatedEntity = await this.prismaService.chatSetting.update({
        where: {
          Id: updateInfo.Id,
          ProfileId: this.userContext.getProfileId()
        },
        data: { ...updatedData },
        include: {
          Chat: true
        }
      })

      //If it pinned => 
      if (updateInfo.IsPinned) {
        await this.unpinOtherChatSettings(updateInfo.Id);
      }

      if (updateInfo.MuteUntil) {
        const delay = updateInfo.MuteUntil.getTime() - Date.now();

        if (delay > 0) {
          await this.chatSettingQueue.add(
            'unMute',
            { chatSettingId: updateInfo.Id },
            { delay }
          );
        }
      }

      returnResult.Result = updatedEntity;

    }
    catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
    }
    return returnResult;
  }

  private async unpinOtherChatSettings(chatSettingId: string): Promise<void> {
    await this.prismaService.chatSetting.updateMany({
      where: {
        ProfileId: this.userContext.getProfileId(),
        Id: {
          not: chatSettingId,
        },
      },
      data: {
        IsPinned: false
      },
    });
  }
}
