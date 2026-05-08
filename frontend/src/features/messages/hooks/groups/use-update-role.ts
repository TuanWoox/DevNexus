import { useMutation, useQueryClient } from "@tanstack/react-query";
import { groupService } from "../../services/group-service";
import type { UpdateRoleDto } from "../../types/contracts";
import { messagingQueryKeys } from "../messaging-query-keys";
import { toast } from "sonner";

export function useUpdateRole(chatId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ profileId, dto }: { profileId: string; dto: UpdateRoleDto }) =>
            groupService.updateMemberRole(chatId, profileId, dto),
        onSuccess: (data) => {
            if (data.message) {
                toast.error(data.message);
            } else {
                queryClient.invalidateQueries({ queryKey: messagingQueryKeys.groupMembers(chatId) });
            }
        },
    });
}
