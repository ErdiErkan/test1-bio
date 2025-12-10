// src/lib/redis-keys.ts

// Helper to normalize inputs (CRITICAL: lowercases everything)
const k = (...parts: (string | number)[]) => parts.map(p => String(p).toLowerCase()).join(':');

export const RedisKeys = {
  // 1. STAT COUNTERS (Views/Boosts) -> ZSET { member: celebrityId, score: count }
  // Pattern: stat:{type}:{locale}:{period}:{dateKey}
  // Example: stat:views:tr:weekly:2023-w49
  statViews: (locale: string, period: string, dateKey: string) => k('stat', 'views', locale, period, dateKey),
  statBoosts: (locale: string, period: string, dateKey: string) => k('stat', 'boosts', locale, period, dateKey),

  // 2. LEADERBOARDS (Weighted Score) -> ZSET { member: celebrityId, score: weightedScore }
  rankScore: (locale: string, period: string, dateKey: string) => k('rank', 'score', locale, period, dateKey),

  // 3. DIMENSIONAL INDICES (For Filtering) -> ZSET { member: celebrityId, score: weightedScore }
  // Global
  rankGlobal: (locale: string, period: string, dateKey: string) => k('rank', locale, 'global', period, dateKey),
  // Category
  rankCategory: (locale: string, slug: string, period: string, dateKey: string) => k('rank', locale, 'category', slug, period, dateKey),
  // Zodiac
  rankZodiac: (locale: string, sign: string, period: string, dateKey: string) => k('rank', locale, 'zodiac', sign, period, dateKey),
  // Born
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
