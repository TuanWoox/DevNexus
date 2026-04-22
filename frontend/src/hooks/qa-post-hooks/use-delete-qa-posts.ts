import { Page } from "@/types/common/page";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { qaPostService } from "@/services/qa-post-service";
import { qaPostQueryKeys } from "./use-qa-post-query-key";

export const useDeleteQAPosts = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: Page<string>) => qaPostService.deleteQAPosts(payload),
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: qaPostQueryKeys.lists() });
                toast.success(`Deleted ${data} QA posts successfully!`);
            }
        }
    });
};
