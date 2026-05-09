import { PostType } from "./create-post-dto";

export interface SelectPostAuthorDTO {
    id: string;
    fullName: string;
    avatarUrl?: string;
    techStacks: string[];
}

export interface SelectPostCommunityDTO {
    id: string;
    name: string;
    slug: string;
    communityCoverPhotoUrl?: string;
}

export interface SelectPostDTO {
    id: string;
    title: string;
    content: string;
    slug: string;
    postType: PostType;
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
}