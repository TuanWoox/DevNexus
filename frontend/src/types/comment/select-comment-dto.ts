export interface SelectCommentAuthorDTO {
    id: string;
    fullName: string;
    avatarUrl?: string;
    backgroundUrl?: string;
    bio: string;
    reputationPoints: number;
    techStacks: string[];
    isPrivate: boolean;
}

export interface SelectCommentDTO {
    id: string;
    content: string;
    authorId: string;
    postId?: string;
    answerId?: string;
    replyToCommentId?: string;
    upvoteCount: number;
    downvoteCount: number;
    dateCreated: string; // Khuyên dùng string (ISO 8601) cho DateTimeOffset
    dateModified?: string;
    author?: SelectCommentAuthorDTO;

    currentUserVote?: boolean | null; // null = no vote, true = upvoted, false = downvoted

    // Thuộc tính đệ quy: Một comment có thể chứa nhiều comment con (replies)
    replies: SelectCommentDTO[];
}