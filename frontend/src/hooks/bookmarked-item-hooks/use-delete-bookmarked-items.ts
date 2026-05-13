import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { bookmarkedItemService } from "@/services/bookmarked-item-service";
import { bookmarkedItemQueryKeys } from "./use-bookmarked-item-query-keys";

export const useDeleteBookmarkedItems = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: string[]) => bookmarkedItemService.bulkDelete(payload),
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: bookmarkedItemQueryKeys.lists() });
                toast.success(`Deleted ${data} bookmarked items successfully!`);
            }
        }
    });
};
