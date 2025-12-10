// src/lib/redis-keys.ts

// DEFINITIVE REDIS KEY SCHEMA
// As per "Ultra-Detailed Architect Specification"

export const RedisKeys = {
  // VARIABLES:
  // {locale} -> always lowercase (e.g., 'en', 'tr')
  // {period} -> 'daily', 'weekly', 'monthly', 'yearly', 'all_time'
  // {dateKey} -> '2023-12-09', '2023-W49', '2023-12', '2023'

  // 1. COUNTERS (Pure counts for UI display)
  statViews: (locale: string, period: string, dateKey: string) =>
    `stat:views:${locale}:${period}:${dateKey}`,

  statBoosts: (locale: string, period: string, dateKey: string) =>
    `stat:boosts:${locale}:${period}:${dateKey}`,

  // 2. LEADERBOARDS (Weighted Score: View=1, Boost=X)
  rankScore: (locale: string, period: string, dateKey: string) =>
    `rank:score:${locale}:${period}:${dateKey}`,

  // 3. DIMENSIONAL RANKINGS (For specific filters)
  rankGlobal: (locale: string, period: string, dateKey: string) =>
    `rank:${locale}:global:${period}:${dateKey}`,

  rankCategory: (locale: string, slug: string, period: string, dateKey: string) =>
    `rank:${locale}:category:${slug}:${period}:${dateKey}`,

  rankZodiac: (locale: string, sign: string, period: string, dateKey: string) =>
    `rank:${locale}:zodiac:${sign}:${period}:${dateKey}`,

  rankBorn: (locale: string, year: number | string, period: string, dateKey: string) =>
    `rank:${locale}:born:${year}:${period}:${dateKey}`,

  // 4. UTILITY
  indexSlugs: (locale: string) => `index:${locale}:slugs`,

  rateLimitBoost: (ip: string, celebrityId: string) => `limit:boost:${ip}:${celebrityId}`,
};

export const Periods = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
  ALL_TIME: 'all_time',
} as const;

export type PeriodKey = typeof Periods[keyof typeof Periods];
