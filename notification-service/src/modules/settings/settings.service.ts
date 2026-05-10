import { Injectable, Scope } from '@nestjs/common';
import { PrismaService } from '../prisma-database/prisma.service';
import { MuteSettingDto } from './dto/mute-setting.dto';
import { EntityType, NotificationType } from '../../generated/prisma/client';
import { ReturnResult } from '../../shared/dtos/ReturnResult';
import { UserContextService } from '../auth/userContext.service';

@Injectable({ scope: Scope.REQUEST })
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userContext: UserContextService,
  ) {}

  async getGlobalSetting(): Promise<ReturnResult<{ AllNotifications: boolean }>> {
    const returnResult = new ReturnResult<{ AllNotifications: boolean }>();
    const profileId = this.userContext.getProfileId();

    const setting = await this.prisma.notificationGlobalSetting.findUnique({
      where: { ProfileId: profileId },
    });
    returnResult.Result = { AllNotifications: setting?.AllNotifications ?? true };
    return returnResult;
  }

  async updateGlobalSetting(allNotifications: boolean): Promise<ReturnResult<{ AllNotifications: boolean }>> {
    const returnResult = new ReturnResult<{ AllNotifications: boolean }>();
    const profileId = this.userContext.getProfileId();

    const setting = await this.prisma.notificationGlobalSetting.upsert({
      where: { ProfileId: profileId },
      update: { AllNotifications: allNotifications },
      create: { ProfileId: profileId, AllNotifications: allNotifications },
    });
    returnResult.Result = { AllNotifications: setting.AllNotifications };
    return returnResult;
  }

  async getMutes(): Promise<ReturnResult<Array<{ EntityType: EntityType; EntityId: string; Type: NotificationType; DateCreated: Date }>>> {
    const returnResult = new ReturnResult<Array<{ EntityType: EntityType; EntityId: string; Type: NotificationType; DateCreated: Date }>>();
    const profileId = this.userContext.getProfileId();

    returnResult.Result = await this.prisma.notificationMuteSetting.findMany({
      where: { ProfileId: profileId },
      select: { EntityType: true, EntityId: true, Type: true, DateCreated: true },
    });
    return returnResult;
  }

  async addMute(dto: MuteSettingDto): Promise<ReturnResult<boolean>> {
    const returnResult = new ReturnResult<boolean>();
    const profileId = this.userContext.getProfileId();

    await this.prisma.notificationMuteSetting.upsert({
      where: {
        ProfileId_EntityType_EntityId_Type: {
          ProfileId: profileId,
          EntityType: dto.EntityType as EntityType,
          EntityId: dto.EntityId,
          Type: dto.Type as NotificationType,
        },
      },
      update: {},
      create: {
        ProfileId: profileId,
        EntityType: dto.EntityType as EntityType,
        EntityId: dto.EntityId,
        Type: dto.Type as NotificationType,
      },
    });
    returnResult.Result = true;
    return returnResult;
  }

  async removeMute(dto: MuteSettingDto): Promise<ReturnResult<boolean>> {
    const returnResult = new ReturnResult<boolean>();
    const profileId = this.userContext.getProfileId();

    await this.prisma.notificationMuteSetting.deleteMany({
      where: {
        ProfileId: profileId,
        EntityType: dto.EntityType as EntityType,
        EntityId: dto.EntityId,
        Type: dto.Type as NotificationType,
      },
    });
    returnResult.Result = true;
    return returnResult;
  }
}
