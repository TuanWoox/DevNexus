import { qaPostService } from "@/services/qa-post-service";
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { qaPostQueryKeys } from "./use-qa-post-query-key";
import { toast } from "sonner";
import { postQueryKeys } from "../post-hooks";

export const useDeleteQAPostById = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (qaPostId: string) => qaPostService.deleteQAPostById(qaPostId),
        onSuccess: (data, qaPostId) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: qaPostQueryKeys.lists() });
                // Tương tự như bên create qa post, đây chỉ là queryKey tạm thời để test vì hiện
                // chưa có API cho feed. Khi có API cho feed thì sẽ đổi postQueryKeys -> feedQueryKeys
                queryClient.invalidateQueries({ queryKey: postQueryKeys.lists() });
                queryClient.removeQueries({ queryKey: qaPostQueryKeys.detail(qaPostId) });
                toast.success("QA post deleted successfully!");
            }
        }
    })
}