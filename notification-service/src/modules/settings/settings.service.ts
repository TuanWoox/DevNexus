import { Injectable, Scope } from '@nestjs/common';
import { PrismaService } from '../prisma-database/prisma.service';
import { MuteSettingDto } from './dto/mute-setting.dto';
import { ReturnResult } from '../../shared/dtos/ReturnResult';
import { UserContextService } from '../auth/userContext.service';
import { PagedData } from '../../shared/dtos/PagedData';
import { Page } from '../../shared/dtos/Page';

@Injectable({ scope: Scope.REQUEST })
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userContext: UserContextService,
  ) { }

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

  async getMutesPaging(page: Page<string>): Promise<ReturnResult<PagedData<string, any>>> {
    const returnResult = new ReturnResult<PagedData<string, any>>();
    const profileId = this.userContext.getProfileId();

    if (page.size > 50) page.size = 50;
    const skip = (page.pageNumber - 1) * page.size;

    const where = { ProfileId: profileId };

    const [mutes, totalElements] = await Promise.all([
      this.prisma.notificationMuteSetting.findMany({
        where,
        skip,
        take: page.size,
        orderBy: { DateCreated: 'desc' },
        select: { EntityType: true, EntityId: true, Type: true, DateCreated: true },
      }),
      this.prisma.notificationMuteSetting.count({ where }),
    ]);

    returnResult.Result = {
      page: {
        size: page.size,
        pageNumber: page.pageNumber,
        totalElements,
        selected: page.selected,
        indexPaging: mutes.length > 0 ? mutes[mutes.length - 1].DateCreated.toISOString() : null,
      },
      data: mutes,
    };

    return returnResult;
  }

  async addMute(dto: MuteSettingDto): Promise<ReturnResult<boolean>> {
    const returnResult = new ReturnResult<boolean>();
    const profileId = this.userContext.getProfileId();

    await this.prisma.notificationMuteSetting.upsert({
      where: {
        ProfileId_EntityType_EntityId_Type: {
          ProfileId: profileId,
          EntityType: dto.EntityType,
          EntityId: dto.EntityId,
          Type: dto.Type,
        },
      },
      update: {},
      create: {
        ProfileId: profileId,
        EntityType: dto.EntityType,
        EntityId: dto.EntityId,
        Type: dto.Type,
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
        EntityType: dto.EntityType,
        EntityId: dto.EntityId,
        Type: dto.Type,
      },
    });
    returnResult.Result = true;
    return returnResult;
  }
}
