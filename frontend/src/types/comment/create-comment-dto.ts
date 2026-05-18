export interface CreateCommentDTO {
    content: string;
    postId?: string;
    answerId?: string;
    replyToCommentId?: string;
    mediaIds?: string[];
}
