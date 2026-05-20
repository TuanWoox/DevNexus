export interface SelectReportedPostDTO {
    id: string;
    title: string;
    slug: string;
    contentPreview: string;
    authorId: string;
    dateCreated?: string | null;
}

export interface SelectReportedQAPostDTO extends SelectReportedPostDTO {}

export interface SelectReportedAnswerDTO {
    id: string;
    contentPreview: string;
    qaPostId: string;
    qaPostTitle?: string | null;
    authorId: string;
    dateCreated?: string | null;
}

export interface SelectReportedCommentDTO {
    id: string;
    contentPreview: string;
    authorId: string;
    postId?: string | null;
    postTitle?: string | null;
    answerId?: string | null;
    qaPostId?: string | null;
    qaPostTitle?: string | null;
    replyToCommentId?: string | null;
    dateCreated?: string | null;
}
