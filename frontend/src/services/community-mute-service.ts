import api from "@/lib/axiosConfig";
import { ReturnResult } from "@/types/common/return-result";
import { MuteStatusDTO } from "@/types/community-mute/mute-status-dto";

export const communityMuteService = {
    getMuteStatus: async (communityId: string): Promise<MuteStatusDTO> => {
        const { data } = await api.get<ReturnResult<MuteStatusDTO>>(
            `/community-mute/${communityId}`,
            { suppressToast: true }
        );
        return data.result ?? { isMuted: false };
    },
    getProfileMuteStatus: async (
        communityId: string,
        profileId: string
    ): Promise<MuteStatusDTO> => {
        const { data } = await api.get<ReturnResult<MuteStatusDTO>>(
            `/community-mute/${communityId}/profiles/${profileId}`,
            { suppressToast: true }
        );
        return data.result ?? { isMuted: false };
    },
};
