import { qaPostService } from "@/services/qa-post-service";
import { CreateQAPostDTO } from "@/types/qa-post/create-qa-post-dto";
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { qaPostQueryKeys } from "./use-qa-post-query-key";
import { toast } from "sonner";
import { postQueryKeys } from "../post-hooks";

export const useCreateQAPost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateQAPostDTO) => qaPostService.createQAPost(payload),
        onSuccess: (data) => {
            if (data) {
                // Hiện tại do feed đang xài API của getPostsWithPaging nên ta sẽ làm mới cache của nó
                // Mốt khi trang feed xài 1 API mới thì sẽ sửa lại theo cache của trang feed 
                // vì khi tạo mới 1 qapost thì data của trang feed hiện tại đã cũ và cần làm mới lại
                queryClient.invalidateQueries({ queryKey: postQueryKeys.lists() });
                queryClient.invalidateQueries({ queryKey: qaPostQueryKeys.lists() });
                toast.success("Post created successfully!");
            }
        }
    })
}