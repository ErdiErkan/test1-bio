// src/lib/redis-keys.ts

// Helper to normalize inputs (CRITICAL: lowercases everything for consistency)
const k = (...parts: (string | number)[]) => parts.map(p => String(p).toLowerCase().trim()).join(':');

export const RedisKeys = {
  // 1. STAT COUNTERS (Raw Counts for UI Display)
  // Pattern: stat:views:{locale}:{period}:{dateKey} -> ZSET { member: id, score: count }
  // Example: stat:views:tr:weekly:2023-w49
  statViews: (locale: string, period: string, dateKey: string) => k('stat', 'views', locale, period, dateKey),
  statBoosts: (locale: string, period: string, dateKey: string) => k('stat', 'boosts', locale, period, dateKey),

  // 2. LEADERBOARDS (Weighted Score for Trending)
  rankScore: (locale: string, period: string, dateKey: string) => k('rank', 'score', locale, period, dateKey),

  // 3. DIMENSIONAL INDICES (For Admin Filtering)
  // Global Rank
  rankGlobal: (locale: string, period: string, dateKey: string) => k('rank', locale, 'global', period, dateKey),
  
  // Category Rank (Slug based)
  rankCategory: (locale: string, slug: string, period: string, dateKey: string) => k('rank', locale, 'category', slug, period, dateKey),
  
  // Zodiac Rank
  rankZodiac: (locale: string, sign: string, period: string, dateKey: string) => k('rank', locale, 'zodiac', sign, period, dateKey),
  
  // Born Rank (Year)
  rankBorn: (locale: string, year: number | string, period: string, dateKey: string) => k('rank', locale, 'born', year, period, dateKey),

  // 4. UTILITY
  rateLimit: (ip: string, action: string, id: string) => k('limit', action, ip, id),
  indexSlugs: (locale: string) => k('index', locale, 'slugs'),
};

export const Periods = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
  ALL_TIME: 'all_time',
} as const;

export type PeriodKey = typeof Periods[keyof typeof Periods];