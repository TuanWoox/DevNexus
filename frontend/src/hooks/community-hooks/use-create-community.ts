import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner";
import { CreateCommunityDTO } from "@/types/community/create-community-dto";
import { communityService } from "@/services/community-service";
import { communityQueryKeys } from "./use-community-query-key";

export const useCreateCommunity = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateCommunityDTO) => communityService.createCommunity(payload),
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: communityQueryKeys.lists() });
                toast.success("Communnity created successfully!");
            }
        }
    })
}