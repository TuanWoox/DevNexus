import { useQuery } from "@tanstack/react-query";
import { historyService, HistoryContentType } from "@/services/history-service";
import { historyQueryKeys } from "./use-history-query-keys";

export const useGetHistoryVersion = <T,>(
    historyId: string,
    type: HistoryContentType,
    enabled = true
) => {
    return useQuery({
        queryKey: historyQueryKeys.version(historyId, type),
        queryFn: () => historyService.getVersion<T>(historyId, type),
        enabled: enabled && !!historyId && !!type,
    });
};
