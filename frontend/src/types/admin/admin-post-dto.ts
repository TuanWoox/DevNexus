export type PostType = 'MarkDown' | 'WYSIWYG';
export type ModerationStatus = 'Pending' | 'Approved' | 'Flagged' | 'InReview';

export interface SelectPostAuthorDTO {
  id: string;
  fullName: string;
  avatarUrl?: string;
  techStacks: string[];
}

export interface AdminPostDTO {
  id: string;
  title: string;
  contentPreview: string;
  slug: string;
  // Backend may return a numeric enum (0=MarkDown, 1=WYSIWYG) or string
  postType: PostType | number;
  // EntityType distinguishes "Post" vs "QA Post"
  entityType: string;
  authorId: string;
  author: SelectPostAuthorDTO;
  // Backend may return a numeric enum (0=Pending, 1=Approved, 2=Flagged, 3=InReview) or string
  moderationStatus: ModerationStatus | number;
  upvoteCount: number;
  downvoteCount: number;
  dateModified?: string;
  dateCreated?: string;
}
