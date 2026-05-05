export type PostType = 'MarkDown' | 'WYSIWYG';
export type ModerationStatus = 'Pending' | 'Approved' | 'Flagged' | 'InReview';

export interface AdminPostDTO {
  id: string;
  title: string;
  contentPreview: string;
  slug: string;
  postType: PostType;
  authorId: string;
  authorName?: string;
  moderationStatus: ModerationStatus;
  upvoteCount: number;
  downvoteCount: number;
  dateModified?: string;
  dateCreated?: string;
}
