import { SelectPostAuthorDTO } from './admin-post-dto';

export interface AdminQueueEntryDTO {
  id: string;
  targetType: 'Post' | 'Answer' | 'Comment' | 0 | 1 | 2;
  targetId: string;
  postId?: string;
  postTitle: string;
  postContent: string;
  authorId: string;
  author: SelectPostAuthorDTO;
  entityType: string;
  reason: string;
  tier1Score: number;
  tier2Reasoning: string;
  assignedModeratorId?: string;
  resolvedAt?: string;
  resolution?: string;
  createdAt: string;
}

export interface AdminQueueResolveDTO {
  id: string;
  resolution: 'Approved' | 'Rejected';
  moderatorNote?: string;
}
