import { qaPostService } from "@/services/qa-post-service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { qaPostQueryKeys } from "./use-qa-post-query-key";

export const useApproveCommunityQAPost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (postId: string) => qaPostService.approveCommunityQAPost(postId),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: qaPostQueryKeys.lists() });
            queryClient.invalidateQueries({ queryKey: qaPostQueryKeys.detail(data.id) });
            toast.success("Question approved.");
        }
    });
};
