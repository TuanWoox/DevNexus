import api from "@/lib/axiosConfig";
import { Page } from "@/types/common/page";
import { PagedData } from "@/types/common/paged-data";
import { ReturnResult } from "@/types/common/return-result";
import {
    AnswerHistoryDTO,
    CommentHistoryDTO,
    PostHistoryDTO,
    QAPostHistoryDTO,
} from "@/types/history";

export type HistoryContentType = "post" | "comment" | "answer" | "qapost";
export type HistoryVersionDTO = PostHistoryDTO | CommentHistoryDTO | AnswerHistoryDTO | QAPostHistoryDTO;

export const historyService = {
    getPostHistory: async (
        postId: string,
        payload: Page<string>
    ): Promise<PagedData<PostHistoryDTO, string>> => {
        const { data } = await api.post<ReturnResult<PagedData<PostHistoryDTO, string>>>(
            `/ContentHistory/posts/${postId}`,
            payload
        );
        return data.result ?? { data: [], page: payload };
    },

    getCommentHistory: async (
        commentId: string,
        payload: Page<string>
    ): Promise<PagedData<CommentHistoryDTO, string>> => {
        const { data } = await api.post<ReturnResult<PagedData<CommentHistoryDTO, string>>>(
            `/ContentHistory/comments/${commentId}`,
            payload
        );
        return data.result ?? { data: [], page: payload };
    },

    getAnswerHistory: async (
        answerId: string,
        payload: Page<string>
    ): Promise<PagedData<AnswerHistoryDTO, string>> => {
        const { data } = await api.post<ReturnResult<PagedData<AnswerHistoryDTO, string>>>(
            `/ContentHistory/answers/${answerId}`,
            payload
        );
        return data.result ?? { data: [], page: payload };
    },

    getQAPostHistory: async (
        qaPostId: string,
        payload: Page<string>
    ): Promise<PagedData<QAPostHistoryDTO, string>> => {
        const { data } = await api.post<ReturnResult<PagedData<QAPostHistoryDTO, string>>>(
            `/ContentHistory/qaposts/${qaPostId}`,
            payload
        );
        return data.result ?? { data: [], page: payload };
    },

    getVersion: async <T = HistoryVersionDTO>(
        historyId: string,
        type: HistoryContentType
    ): Promise<T> => {
        const { data } = await api.get<ReturnResult<T>>(
            `/ContentHistory/${historyId}?type=${type}`
        );

        if (!data.result) {
            throw new Error(data.message ?? "Version not found");
        }

        return data.result;
    },
};
