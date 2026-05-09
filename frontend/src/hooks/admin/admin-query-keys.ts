import { Page } from "@/types/common/page";

export const adminQueryKeys = {
  dashboard: () => ['admin', 'dashboard'] as const,

  moderation: {
    all: ['admin', 'moderation'] as const,
    paging: (payload: Page<string>) => ['admin', 'moderation', 'paging', payload] as const,
  },

  posts: {
    all: ['admin', 'posts'] as const,
    paging: (payload: Page<string>) => ['admin', 'posts', 'paging', payload] as const,
  },

  users: {
    all: ['admin', 'users'] as const,
    paging: (payload: Page<string>) => ['admin', 'users', 'paging', payload] as const,
  },

  tags: {
    all: ['admin', 'tags'] as const,
    paging: (payload: Page<string>) => ['admin', 'tags', 'paging', payload] as const,
  },

  aiUsage: {
    all: ['admin', 'ai-usage'] as const,
    summary: (from: string, to: string) => ['admin', 'ai-usage', 'summary', from, to] as const,
    paging: (payload: Page<string>) => ['admin', 'ai-usage', 'paging', payload] as const,
  },

  settings: {
    all: ['admin', 'settings'] as const,
    bannedKeywords: ['admin', 'settings', 'banned-keywords'] as const,
  },
};
