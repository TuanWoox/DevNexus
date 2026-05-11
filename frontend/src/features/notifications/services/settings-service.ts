import notificationApi from "@/lib/notificationServiceAxiosConfig";
import type { ReturnResult } from "@/types/common/return-result";
import { EntityTypeEnum, NotificationEventEnum } from "../types/enums";
import type { Page } from "@/types/common/page";
import type { PagedData } from "@/types/common/paged-data";

export interface GlobalSetting {
  AllNotifications: boolean;
}

export interface MuteSetting {
  EntityType: EntityTypeEnum;
  EntityId: string;
  Type: NotificationEventEnum;
  DateCreated?: string;
}

export interface MuteSettingDto {
  EntityType: EntityTypeEnum;
  EntityId: string;
  Type: NotificationEventEnum;
}

class NotificationSettingsService {
  // Global setting
  async getGlobalSetting(): Promise<ReturnResult<GlobalSetting>> {
    const { data } = await notificationApi.get<ReturnResult<GlobalSetting>>("/settings/global");
    return data;
  }

  async updateGlobalSetting(allNotifications: boolean): Promise<ReturnResult<GlobalSetting>> {
    const { data } = await notificationApi.patch<ReturnResult<GlobalSetting>>(
      "/settings/global",
      { AllNotifications: allNotifications }
    );
    return data;
  }

  // Mute settings
  async getMutesPaging(page: Page<string>): Promise<ReturnResult<PagedData<MuteSetting, string>>> {
    const { data } = await notificationApi.post<ReturnResult<PagedData<MuteSetting, string>>>(
      "/settings/mutes/paging",
      page
    );
    return data;
  }

  async addMute(dto: MuteSettingDto): Promise<ReturnResult<boolean>> {
    const { data } = await notificationApi.post<ReturnResult<boolean>>("/settings/mutes", dto);
    return data;
  }

  async removeMute(dto: MuteSettingDto): Promise<ReturnResult<boolean>> {
    const { data } = await notificationApi.delete<ReturnResult<boolean>>("/settings/mutes", {
      data: dto,
    });
    return data;
  }
}

export const notificationSettingsService = new NotificationSettingsService();
