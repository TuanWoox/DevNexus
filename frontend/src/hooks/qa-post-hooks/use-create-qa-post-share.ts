import { postQueryKeys } from "@/hooks/post-hooks";
import { qaPostService } from "@/services/qa-post-service";
import { CreateQAPostShareDTO } from "@/types/qa-post/create-qa-post-dto";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { qaPostQueryKeys } from "./use-qa-post-query-key";

export const useCreateQAPostShare = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateQAPostShareDTO) => qaPostService.createShare(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: postQueryKeys.lists() });
            queryClient.invalidateQueries({ queryKey: qaPostQueryKeys.lists() });
            toast.success("Question shared successfully!");
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Question could not be shared.");
        },
    });
};
