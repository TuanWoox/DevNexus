import { bookmarkService } from "@/services/bookmark-service";
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner";
import { bookmarkQueryKeys } from "./use-bookmark-query-keys";

export const useDeleteBookmarkById = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (bookmarkId: string) => bookmarkService.deleteById(bookmarkId),
        onSuccess: (data, bookmarkId) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: bookmarkQueryKeys.lists() });
                queryClient.removeQueries({ queryKey: bookmarkQueryKeys.detail(bookmarkId) });
                toast.success("Bookmark deleted successfully!");
            }
        }
    })
}
