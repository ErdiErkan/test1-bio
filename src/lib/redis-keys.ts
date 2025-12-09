// src/lib/redis-keys.ts

// Key patterns for Redis to avoid typos and ensure consistency

export const RedisKeys = {
  // Rate limiting
  rateLimitBoost: (ip: string, celebrityId: string) => `limit:boost:${ip}:${celebrityId}`,

  // Analytics - Views
  statViews: (locale: string, period: string) => `stat:views:${locale}:${period}`,

  // Analytics - Boosts
  statBoosts: (locale: string, period: string) => `stat:boosts:${locale}:${period}`,

  // Rankings
  rankScore: (locale: string, period: string) => `rank:score:${locale}:${period}`,

  // Caching
  cacheRank: (celebrityId: string, period: string) => `cache:rank:${celebrityId}:${period}`,

  // Indices
  indexSlugs: (locale: string) => `index:${locale}:slugs`,
};

export const Periods = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
  ALL_TIME: 'all_time',
} as const;

export type PeriodKey = typeof Periods[keyof typeof Periods];
