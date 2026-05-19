import { Page } from "@/types/common/page";
import { HistoryContentType } from "@/services/history-service";

type HistoryRequest = Omit<Page<string>, "pageNumber" | "size">;

export const historyQueryKeys = {
    all: ["history"] as const,
    postHistory: (postId: string, request: HistoryRequest) =>
        [...historyQueryKeys.all, "post", postId, request] as const,
    commentHistory: (commentId: string, request: HistoryRequest) =>
        [...historyQueryKeys.all, "comment", commentId, request] as const,
    answerHistory: (answerId: string, request: HistoryRequest) =>
        [...historyQueryKeys.all, "answer", answerId, request] as const,
    qaPostHistory: (qaPostId: string, request: HistoryRequest) =>
        [...historyQueryKeys.all, "qapost", qaPostId, request] as const,
    version: (historyId: string, type: HistoryContentType) =>
        [...historyQueryKeys.all, "version", historyId, type] as const,
};
