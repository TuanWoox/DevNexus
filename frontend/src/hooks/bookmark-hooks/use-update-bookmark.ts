import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UpdateBookmarkDTO } from "@/types/bookmark/update-bookmark-dto";
import { bookmarkService } from "@/services/bookmark-service";
import { bookmarkQueryKeys } from "./use-bookmark-query-keys";

export const useUpdateBookmark = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: UpdateBookmarkDTO) => bookmarkService.updateBookmark(payload),
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: bookmarkQueryKeys.lists() });
                queryClient.invalidateQueries({ queryKey: bookmarkQueryKeys.detail(data.id) });
                toast.success("Bookmark updated successfully!");
            }
        }
    });
};
