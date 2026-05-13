export interface SearchPostAuthor {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  backgroundUrl?: string | null;
  bio?: string | null;
  reputationPoints: number;
  techStacks: string[];
  isPrivate: boolean;
}

export interface SearchPostResult {
  id: string;
  title: string;
  content: string;
  slug: string;
  authorId: string;
  author?: SearchPostAuthor | null;
  upvoteCount: number;
  commentCount: number;
  dateCreated?: string | null;
  communityId?: string | null;
  communityName?: string | null;
}

export interface SearchQAPostResult extends SearchPostResult {
  answerCount: number;
}

export interface SearchCommunityResult {
  id: string;
  name: string;
  description?: string | null;
  slug: string;
  communityCoverPhotoUrl?: string | null;
  memberCount: number;
  isPrivate: boolean;
}

export interface SearchProfileResult {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  reputationPoints: number;
  techStacks: string[];
  isPrivate: boolean;
}

export interface GlobalSearchResult {
  posts: SearchPostResult[];
  qaPosts: SearchQAPostResult[];
  communities: SearchCommunityResult[];
  profiles: SearchProfileResult[];
}
