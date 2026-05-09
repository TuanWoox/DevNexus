import type {
    Chat,
    GroupMember,
    UpdateGroupDto,
    AddMembersDto,
    UpdateRoleDto,
    TransferOwnershipDto,
} from "../types/contracts";
import messageApi from "../../../lib/messageServiceAxiosConfig";
import type { ReturnResult } from "@/types/common/return-result";

export const groupService = {
    getMembers: async (chatId: string): Promise<ReturnResult<GroupMember[]>> => {
        const { data } = await messageApi.get<ReturnResult<GroupMember[]>>(
            `/chats/${chatId}/members`
        );
        return data;
    },

    updateGroup: async (
        chatId: string,
        dto: UpdateGroupDto
    ): Promise<ReturnResult<Chat>> => {
        const { data } = await messageApi.patch<ReturnResult<Chat>>(
            `/chats/${chatId}/group`,
            dto
        );
        return data;
    },

    uploadGroupPicture: async (
        chatId: string,
        file: File
    ): Promise<ReturnResult<Chat>> => {
        const formData = new FormData();
        formData.append("file", file);
        const { data } = await messageApi.post<ReturnResult<Chat>>(
            `/chats/${chatId}/group/picture`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
        );
        return data;
    },

    addMembers: async (
        chatId: string,
        dto: AddMembersDto
    ): Promise<ReturnResult<GroupMember[]>> => {
        const { data } = await messageApi.post<ReturnResult<GroupMember[]>>(
            `/chats/${chatId}/members`,
            dto
        );
        return data;
    },

    removeMember: async (
        chatId: string,
        profileId: string
    ): Promise<ReturnResult<boolean>> => {
        const { data } = await messageApi.delete<ReturnResult<boolean>>(
            `/chats/${chatId}/members/${profileId}`
        );
        return data;
    },

    leaveGroup: async (chatId: string): Promise<ReturnResult<boolean>> => {
        const { data } = await messageApi.post<ReturnResult<boolean>>(
            `/chats/${chatId}/leave`
        );
        return data;
    },

    updateMemberRole: async (
        chatId: string,
        profileId: string,
        dto: UpdateRoleDto
    ): Promise<ReturnResult<unknown>> => {
        const { data } = await messageApi.patch<ReturnResult<unknown>>(
            `/chats/${chatId}/members/${profileId}/role`,
            dto
        );
        return data;
    },

    transferOwnership: async (
        chatId: string,
        dto: TransferOwnershipDto
    ): Promise<ReturnResult<Chat>> => {
        const { data } = await messageApi.post<ReturnResult<Chat>>(
            `/chats/${chatId}/transfer`,
            dto
        );
        return data;
    },
};
