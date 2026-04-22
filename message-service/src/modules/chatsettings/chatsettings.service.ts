import { Injectable } from '@nestjs/common';
import { UserContextService } from '../auth/userContext.service';
import { PrismaService } from '../prisma-database/prisma.service';
import { UserfollowsService } from '../userfollows/userfollows.service';
import { ReturnResult } from 'src/shared/dtos/helper/ReturnResult';
import { Chat, ChatRole, ChatSetting } from 'src/generated/prisma/client';
import { UpdateChatSettingDTO, UpdateNickName } from './dto/update-chatsetting-dto';
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

  async initialChatSettings(chat: Chat, profileIds: string[]): Promise<ReturnResult<ChatSetting>> {
    const returnResult: ReturnResult<ChatSetting> = new ReturnResult<ChatSetting>();

    try {

      const currentProfileId = this.userContext.getProfileId();


      //Fetch all followers of current profileId
      const follows = await this.userfollowsService.getFollowersByProfiles(profileIds);

      // Create a set of profiles that follow the current user
      const followersSet = new Set(follows.map(f => f.OwnerId));

      // Build ChatSetting records for all participants
      const chatSettingData = profileIds.map(profileId => ({
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

  async updateNickName({ Id, ProfileIdToUpdate, NickName }: UpdateNickName) {
    const res = new ReturnResult<ChatSetting>();
    try {
      const target = await this.prismaService.chatSetting.findFirst({
        where: { Id, ProfileId: ProfileIdToUpdate }
      });

      if (!target) {
        res.Message = "Chat setting not found";
        return res;
      }

      const isMember = await this.prismaService.chatSetting.count({
        where: { ChatId: target.ChatId, ProfileId: this.userContext.getProfileId() }
      });

      if (!isMember) {
        res.Message = "You are not in this chat";
        return res;
      }

      res.Result = await this.prismaService.chatSetting.update({
        where: { Id },
        data: { NickName },
        include: { Chat: true }
      });
    } catch (ex) {
      res.Message = ex instanceof Error ? ex.message : String(ex);
    }
    return res;
  }

  async deleteAllMessage(id: string) {
    const returnResult = new ReturnResult<ChatSetting>()
    try {
      const chatSetting = await this.prismaService.chatSetting.findFirst({
        where: {
          Id: id
        },
      })
      if (!chatSetting) {
        returnResult.Message = "Does not exist"
        return returnResult
      }

      const latestMessageId = await this.prismaService.message.findFirst({
        where: {
          ChatId: chatSetting.ChatId
        },
        orderBy: {
          Id: 'desc'
        }
      })

      if (latestMessageId && chatSetting.DeleteUpToMessageId != latestMessageId.Id) {
        returnResult.Result = await this.prismaService.chatSetting.update({
          where: { Id: id },
          data: { DeleteUpToMessageId: latestMessageId.Id },
          include: { Chat: true }
        });
      } else if (chatSetting.DeleteUpToMessageId == latestMessageId?.Id) {
        returnResult.Message = "You have already deleted up to the newest message"
      } else returnResult.Message = "Cant find"
    }
    catch (ex) {
      returnResult.Message = ex instanceof Error ? ex.message : String(ex);
    }
    return returnResult;
  }
}
