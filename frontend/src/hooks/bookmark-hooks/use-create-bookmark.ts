import { bookmarkService } from "@/services/bookmark-service";
import { CreateBookmarkDTO } from "@/types/bookmark/create-bookmark-dto";
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { bookmarkQueryKeys } from "./use-bookmark-query-keys";
import { toast } from "sonner";

export const useCreateBookmark = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateBookmarkDTO) => bookmarkService.createBookmark(payload),
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: bookmarkQueryKeys.lists() });
                toast.success("Bookmark collection created successfully!");
            }
        }
    })
}