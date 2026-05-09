import { ReturnResult } from "@/types/common/return-result";
import messageApi from "../../../lib/messageServiceAxiosConfig";
import type { ChatSetting, UpdateChatSettingDTO, UpdateNickName } from "@/features/messages/types/contracts";

export const chatSettingService = {
    updateChatSetting: async (updateInfo: UpdateChatSettingDTO): Promise<ReturnResult<ChatSetting>> => {
        const { data } = await messageApi.patch<ReturnResult<ChatSetting>>("/chatsettings", updateInfo);
        return data;
    },

    updateNickName: async (updateNickName: UpdateNickName): Promise<ReturnResult<ChatSetting>> => {
        const { data } = await messageApi.patch<ReturnResult<ChatSetting>>(
            "/chatsettings/nickname",
            updateNickName
        );
        return data;
    },

    deleteAllMessages: async (chatSettingId: string): Promise<ReturnResult<ChatSetting>> => {
        const { data } = await messageApi.delete<ReturnResult<ChatSetting>>(
            `/chatsettings/${chatSettingId}/messages`
        );
        return data;
    },
};
