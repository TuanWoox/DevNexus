import { SelectCommentDTO } from '../comment/select-comment-dto';

export interface SelectAnswerAuthorDTO {
    id: string;
    fullName: string;
    avatarUrl?: string;
    backgroundUrl?: string;
    bio: string;
    reputationPoints: number;
    techStacks: string[];
    isPrivate: boolean;
}

export interface SelectAnswerDTO {
    id: string;
    content: string;
    isAccepted: boolean;
    upvoteCount: number;
    downvoteCount: number;
    qaPostId: string;
    authorId: string;
    author?: SelectAnswerAuthorDTO;
    dateCreated: string;
    dateModified?: string;
    currentUserVote?: boolean | null; // null = no vote, true = upvoted, false = downvoted
    replies: SelectCommentDTO[];
}