import { qaPostService } from "@/services/qa-post-service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { qaPostQueryKeys } from "./use-qa-post-query-key";
import { toast } from "sonner";
import { postQueryKeys } from "@/hooks/post-hooks";
import { recommendationQueryKeys } from "@/hooks/recommendation-hooks/use-recommendation-query-keys";

export const useDeleteQAPostById = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (qaPostId: string) => qaPostService.deleteQAPostById(qaPostId),
        onSuccess: (data, qaPostId) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: qaPostQueryKeys.lists() });
                queryClient.invalidateQueries({ queryKey: postQueryKeys.lists() });
                queryClient.invalidateQueries({ queryKey: recommendationQueryKeys.all });
                queryClient.removeQueries({ queryKey: qaPostQueryKeys.detail(qaPostId) });
                toast.success("QA post deleted successfully!");
            }
        },
    });
};
