export interface TagStatDTO {
  tagName: string;
  postCount: number;
}

export interface AdminDashboardDTO {
  totalPosts: number;
  pendingPosts: number;
  approvedPosts: number;
  rejectedPosts: number;
  postsToday: number;
  queueEntries: number;
  totalUsers: number;
  topTags: TagStatDTO[];
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  totalQuestionPosts: number;
  totalNormalPosts: number;
  postsThisWeek: number;
  postsThisMonth: number;
  inReviewPosts: number;
  flaggedPosts: number;
}
