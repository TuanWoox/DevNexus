import { Page } from "@/types/common/page";

export const answerQueryKeys = {
    all: ['answers'] as const,
    lists: () => [...answerQueryKeys.all, 'list'] as const,
    listByPost: (postId: string, payload?: Page<string>) => payload
        ? [...answerQueryKeys.lists(), postId, { payload }] as const
        : [...answerQueryKeys.lists(), postId] as const,
    details: () => [...answerQueryKeys.all, 'detail'] as const,
    detail: (answerId: string) => [...answerQueryKeys.details(), answerId] as const
}