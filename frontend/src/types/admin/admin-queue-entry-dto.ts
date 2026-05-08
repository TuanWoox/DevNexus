import { SelectPostAuthorDTO } from './admin-post-dto';

export interface AdminQueueEntryDTO {
  id: string;
  postId: string;
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
  resolution: 'Approved' | 'Flagged' | 'Rejected';
  moderatorNote?: string;
}
