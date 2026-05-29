import { PostType } from "./create-post-dto";
import { ModerationStatus } from "./moderation-status";
import { CommunityApprovalStatusValue } from "../enums/community-approval-status";

export interface SelectPostAuthorDTO {
    id: string;
    fullName: string;
    avatarUrl?: string;
    backgroundUrl?: string;
    bio: string;
    reputationPoints: number;
    techStacks: string[];
    isPrivate: boolean;
}

export interface SelectPostCommunityDTO {
    id: string;
    name: string;
    slug: string;
    communityCoverPhotoUrl?: string;
    description?: string | null;
    memberCount?: number;
    isPrivate?: boolean;
}

export enum SharedContentType {
    Post = 0,
    QAPost = 1,
}

export interface SelectSharedPostDTO {
    id: string;
    title: string;
    contentPreview: string;
    communityId?: string | null;
    community?: SelectPostCommunityDTO | null;
    author?: SelectPostAuthorDTO | null;
    contentType: SharedContentType;
    dateCreated: string;
}

export interface SelectPostDTO {
    id: string;
    title: string;
    content: string;
    slug: string;
    postType: PostType;
    moderationStatus: ModerationStatus;
    moderationReason?: string | null;
    communityApprovalStatus?: CommunityApprovalStatusValue | null;
    communityApprovalReason?: string | null;
    authorId: string;
    author?: SelectPostAuthorDTO;
    upvoteCount: number;
    downvoteCount: number;
    commentCount: number;
    tagNames: string[];
    dateCreated: string;
    dateModified: string;
    currentUserVote?: boolean | null; // null = no vote, true = upvoted, false = downvoted
    communityId?: string;
    community?: SelectPostCommunityDTO;
    sharedPostId?: string | null;
    sharedPost?: SelectSharedPostDTO | null;
    isSaved: boolean;
    savedBookMarkedItemId?: string;
}
