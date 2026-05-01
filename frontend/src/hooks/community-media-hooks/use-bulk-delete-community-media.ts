import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { communityMediaService } from "@/services/community-media-service";
import { communityMediaQueryKeys } from "./use-community-media-query-keys";

export const useBulkDeleteCommunityMedia = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (ids: string[]) => communityMediaService.bulkDeleteCommunityMedia(ids),
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: communityMediaQueryKeys.lists() });
                toast.success(`${data} items deleted successfully.`);
            }
        }
    });
};
