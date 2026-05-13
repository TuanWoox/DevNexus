import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { bookmarkService } from "@/services/bookmark-service";
import { bookmarkQueryKeys } from "./use-bookmark-query-keys";

export const useDeleteBookmarks = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: string[]) => bookmarkService.bulkDelete(payload),
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: bookmarkQueryKeys.lists() });
                toast.success(`Deleted ${data} bookmarks successfully!`);
            }
        }
    });
};
