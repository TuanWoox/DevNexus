import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { communityModeratorsService } from "@/services/community-moderators-service";
import { communityModeratorsQueryKeys } from "./use-community-moderators-query-keys";
import { CreateCommunityModeratorDTO } from "@/types/community-moderator/create-community-moderator-dto";

export const useAddCommunityModerator = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateCommunityModeratorDTO) => communityModeratorsService.addModerator(payload),
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: communityModeratorsQueryKeys.lists() });
                toast.success("Moderator added successfully.");
            }
        }
    });
};
