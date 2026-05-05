export interface AdminQueueEntryDTO {
  id: string;
  postId: string;
  postTitle: string;
  postContent: string;
  authorId: string;
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
