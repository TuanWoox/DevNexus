import notificationApi from "@/lib/notificationServiceAxiosConfig";

export interface GlobalSetting {
  AllNotifications: boolean;
}

export interface MuteSetting {
  EntityType: number;
  EntityId: string;
  Type: number;
  DateCreated?: string;
}

export interface MuteSettingDto {
  EntityType: number;
  EntityId: string;
  Type: number;
}

class NotificationSettingsService {
  // Global setting
  async getGlobalSetting(): Promise<GlobalSetting> {
    const response = await notificationApi.get<{ Result: GlobalSetting }>("/settings/global");
    return response.data.Result;
  }

  async updateGlobalSetting(allNotifications: boolean): Promise<GlobalSetting> {
    const response = await notificationApi.patch<{ Result: GlobalSetting }>(
      "/settings/global",
      { AllNotifications: allNotifications }
    );
    return response.data.Result;
  }

  // Mute settings
  async getMutes(): Promise<MuteSetting[]> {
    const response = await notificationApi.get<{ Result: MuteSetting[] }>("/settings/mutes");
    return response.data.Result;
  }

  async addMute(dto: MuteSettingDto): Promise<boolean> {
    const response = await notificationApi.post<{ Result: boolean }>("/settings/mutes", dto);
    return response.data.Result;
  }

  async removeMute(dto: MuteSettingDto): Promise<boolean> {
    const response = await notificationApi.delete<{ Result: boolean }>("/settings/mutes", {
      data: dto,
    });
    return response.data.Result;
  }
}

export const notificationSettingsService = new NotificationSettingsService();
