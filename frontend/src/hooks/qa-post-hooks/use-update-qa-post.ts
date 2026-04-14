import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { qaPostService } from "@/services/qa-post-service";
import { qaPostQueryKeys } from "./use-qa-post-query-key";
import { UpdateQAPostDTO } from "@/types/qa-post/update-qa-post-dto";

export const useUpdateQAPost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: UpdateQAPostDTO) => qaPostService.updateQAPost(payload),
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: qaPostQueryKeys.lists() });
                queryClient.invalidateQueries({ queryKey: qaPostQueryKeys.detail(data.id) });
                toast.success("QA post updated successfully!");
            }
        }
    });
};
