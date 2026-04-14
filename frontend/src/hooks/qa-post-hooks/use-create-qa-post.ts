import { qaPostService } from "@/services/qa-post-service";
import { CreateQAPostDTO } from "@/types/qa-post/create-qa-post-dto";
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { qaPostQueryKeys } from "./use-qa-post-query-key";
import { toast } from "sonner";

export const useCreateQAPost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateQAPostDTO) => qaPostService.createQAPost(payload),
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: qaPostQueryKeys.lists() });
                toast.success("Post created successfully!");
            }
        }
    })
}