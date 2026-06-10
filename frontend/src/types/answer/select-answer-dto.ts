import { SelectCommentDTO } from '../comment/select-comment-dto';
import { ModerationStatus } from '../post/moderation-status';

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
    moderationStatus?: ModerationStatus;
    moderationReason?: string | null;
    upvoteCount: number;
    downvoteCount: number;
    qaPostId: string;
    authorId: string;
    isSystemAnswer: boolean;
    author?: SelectAnswerAuthorDTO;
    dateCreated: string;
    dateModified?: string;
    currentUserVote?: boolean | null; // null = no vote, true = upvoted, false = downvoted
    replies: SelectCommentDTO[];
}
