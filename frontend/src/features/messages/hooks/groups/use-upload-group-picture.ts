import { useMutation, useQueryClient } from "@tanstack/react-query";
import { groupService } from "../../services/group-service";
import { messagingQueryKeys } from "../messaging-query-keys";
import { toast } from "sonner";

export function useUploadGroupPicture(chatId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (file: File) => groupService.uploadGroupPicture(chatId, file),
        onSuccess: (data) => {
            if (data.message) {
                toast.error(data.message);
            } else {
                queryClient.invalidateQueries({ queryKey: ["messages", "chats"] });
                queryClient.invalidateQueries({ queryKey: messagingQueryKeys.groupMembers(chatId) });
            }
        },
    });
}
