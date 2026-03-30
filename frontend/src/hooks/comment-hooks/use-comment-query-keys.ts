import { Page } from "@/types/common/page";

export const commentQueryKeys = {
    all: ['comments'] as const,
    byPost: (postId: string, payload?: Page<string>) => payload 
        ? [...commentQueryKeys.all, 'post', postId, payload] as const 
        : [...commentQueryKeys.all, 'post', postId] as const,
    byAnswer: (answerId: string, payload?: Page<string>) => payload
        ? [...commentQueryKeys.all, 'answer', answerId, payload] as const
        : [...commentQueryKeys.all, 'answer', answerId] as const,
    replies: (commentId: string, payload?: Page<string>) => payload
        ? [...commentQueryKeys.all, 'replies', commentId, payload] as const
        : [...commentQueryKeys.all, 'replies', commentId] as const,
    detail: (commentId: string) => [...commentQueryKeys.all, 'detail', commentId] as const,
    own: (payload?: Page<string>) => payload
        ? [...commentQueryKeys.all, 'own', payload] as const
        : [...commentQueryKeys.all, 'own'] as const,
};
