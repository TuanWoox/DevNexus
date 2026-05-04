import { useQuery } from "@tanstack/react-query";
import { messagingQueryKeys } from "../messaging-query-keys";
import { groupService } from "../../services/group-service";
import type { GroupMember } from "../../types/contracts";

export function useGroupMembers(chatId: string) {
    return useQuery({
        queryKey: messagingQueryKeys.groupMembers(chatId),
        queryFn: async () => {
            const result = await groupService.getMembers(chatId);
            if (result.message) throw new Error(result.message);
            return result.result as GroupMember[];
        },
        enabled: !!chatId,
    });
}
