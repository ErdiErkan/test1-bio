'use server';

import { z } from 'zod';
import { redis } from '@/lib/redis';
import { prisma } from '@/lib/db';
import { getPeriodKeys } from '@/lib/date-utils';
import { unstable_cache } from 'next/cache';
import { RedisKeys, Periods } from '@/lib/redis-keys';
import { headers } from 'next/headers';
import { after } from 'next/server'; // Non-blocking writes
import { Language } from '@prisma/client';

// Validation Schema for Interaction
const interactionSchema = z.object({
    celebrityId: z.string().min(1),
    type: z.enum(['view', 'boost']),
    locale: z.string().length(2), // ISO 2-char locale
    categorySlug: z.string().optional(),
    zodiac: z.string().optional(),
    birthYear: z.number().int().optional(),
});

type InteractionInput = z.infer<typeof interactionSchema>;

export type TrendingCelebrity = {
    id: string;
    score: number;
    rank: number;
    name: string;
    slug: string;
    profession?: string | null;
    image?: string | null;
    images?: { url: string; isMain: boolean }[];
};

// Default config values
const DEFAULT_BOOST_COOLDOWN = 60; // seconds
const DEFAULT_BOOST_WEIGHT = 10;

// TTL Constants
const TTL = {
    DAILY: 7 * 24 * 60 * 60, // 7 days
    WEEKLY: 30 * 24 * 60 * 60, // 30 days
    LONG_TERM: 5 * 365 * 24 * 60 * 60, // 5 Years
};

async function getSystemSettings() {
    try {
        const settings = await prisma.systemSetting.findMany({
            where: {
                key: { in: ['BOOST_COOLDOWN', 'BOOST_WEIGHT'] }
            }
        });

        const config = {
            BOOST_COOLDOWN: DEFAULT_BOOST_COOLDOWN,
            BOOST_WEIGHT: DEFAULT_BOOST_WEIGHT,
        };

        settings.forEach(s => {
            if (s.key === 'BOOST_COOLDOWN') config.BOOST_COOLDOWN = s.value as number;
            if (s.key === 'BOOST_WEIGHT') config.BOOST_WEIGHT = s.value as number;
        });

        return config;
    } catch (e) {
        console.error('[Analytics] Failed to fetch system settings:', e);
        return {
            BOOST_COOLDOWN: DEFAULT_BOOST_COOLDOWN,
            BOOST_WEIGHT: DEFAULT_BOOST_WEIGHT,
        };
    }
}

/**
 * Records a user interaction (view or boost) in Redis using a Write-Behind pattern.
 */
export async function recordInteraction(input: InteractionInput) {
    try {
        // 1. Validate Input
        const data = interactionSchema.parse(input);
        const locale = data.locale.toLowerCase();

        // 2. Rate Limiting for Boosts (Blocking Check)
        if (data.type === 'boost') {
            const headersList = await headers();
            const ip = headersList.get('x-forwarded-for') || 'unknown';
            const rateLimitKey = RedisKeys.rateLimitBoost(ip, data.celebrityId);

            const settings = await getSystemSettings();
            const isAllowed = await redis.set(rateLimitKey, '1', 'EX', settings.BOOST_COOLDOWN, 'NX');

            if (!isAllowed) {
                return { success: false, error: 'Rate limit exceeded' };
            }
        }

        // 3. Prepare Pipeline inside `after` for non-blocking execution
        after(async () => {
            try {
                const now = new Date();
                const periods = getPeriodKeys(now);
                const pipeline = redis.pipeline();
                const settings = await getSystemSettings();

                let score = 0;
                if (data.type === 'view') {
                    score = 1;
                    // Counters: Views
                    pipeline.zincrby(RedisKeys.statViews(locale, Periods.DAILY, periods.daily), 1, data.celebrityId);
                    pipeline.zincrby(RedisKeys.statViews(locale, Periods.WEEKLY, periods.weekly), 1, data.celebrityId);
                    pipeline.zincrby(RedisKeys.statViews(locale, Periods.MONTHLY, periods.monthly), 1, data.celebrityId);
                    pipeline.zincrby(RedisKeys.statViews(locale, Periods.YEARLY, periods.yearly), 1, data.celebrityId);
                    pipeline.zincrby(RedisKeys.statViews(locale, Periods.ALL_TIME, 'all_time'), 1, data.celebrityId);
                } else {
                    score = settings.BOOST_WEIGHT;
                    // Counters: Boosts
                    pipeline.zincrby(RedisKeys.statBoosts(locale, Periods.DAILY, periods.daily), 1, data.celebrityId);
                    pipeline.zincrby(RedisKeys.statBoosts(locale, Periods.WEEKLY, periods.weekly), 1, data.celebrityId);
                    pipeline.zincrby(RedisKeys.statBoosts(locale, Periods.MONTHLY, periods.monthly), 1, data.celebrityId);
                    pipeline.zincrby(RedisKeys.statBoosts(locale, Periods.YEARLY, periods.yearly), 1, data.celebrityId);
                    pipeline.zincrby(RedisKeys.statBoosts(locale, Periods.ALL_TIME, 'all_time'), 1, data.celebrityId);
                }

                // Helper to add increments and set TTL
                const addRankIncrements = (
                    genKey: (p: string, d: string) => string
                ) => {
                    // Daily
                    const dailyKey = genKey(Periods.DAILY, periods.daily);
                    pipeline.zincrby(dailyKey, score, data.celebrityId);
                    pipeline.expire(dailyKey, TTL.DAILY);

                    // Weekly
                    const weeklyKey = genKey(Periods.WEEKLY, periods.weekly);
                    pipeline.zincrby(weeklyKey, score, data.celebrityId);
                    pipeline.expire(weeklyKey, TTL.WEEKLY);

                    // Monthly
                    const monthlyKey = genKey(Periods.MONTHLY, periods.monthly);
                    pipeline.zincrby(monthlyKey, score, data.celebrityId);
                    pipeline.expire(monthlyKey, TTL.LONG_TERM);

                    // Yearly
                    const yearlyKey = genKey(Periods.YEARLY, periods.yearly);
                    pipeline.zincrby(yearlyKey, score, data.celebrityId);
                    pipeline.expire(yearlyKey, TTL.LONG_TERM);

                    // All Time
                    const allTimeKey = genKey(Periods.ALL_TIME, 'all_time');
                    pipeline.zincrby(allTimeKey, score, data.celebrityId);
                    // No expire for all_time or very long? Let's treat as LONG_TERM
                    pipeline.expire(allTimeKey, TTL.LONG_TERM);
                };

                // --- 4. Rank Updates ---

                // Rank Score (Leaderboards)
                addRankIncrements((p, d) => RedisKeys.rankScore(locale, p, d));

                // Global Rank (Filtered by Locale)
                addRankIncrements((p, d) => RedisKeys.rankGlobal(locale, p, d));

                // Category Rank
                if (data.categorySlug) {
                    addRankIncrements((p, d) => RedisKeys.rankCategory(locale, data.categorySlug!, p, d));
                }

                // Zodiac Rank
                if (data.zodiac) {
                    addRankIncrements((p, d) => RedisKeys.rankZodiac(locale, data.zodiac!.toLowerCase(), p, d));
                }

                // Birth Year Rank
                if (data.birthYear) {
                    addRankIncrements((p, d) => RedisKeys.rankBorn(locale, data.birthYear!, p, d));
                }

                await pipeline.exec();
            } catch (err) {
                console.error('[Analytics] Background interaction recording failed:', err);
            }
        });

        return { success: true };

    } catch (error) {
        console.error('[Analytics] Failed to record interaction:', error);
        return { success: false, error: 'Analytics Error' };
    }
}

/**
 * Fetches the current real-time rankings for a celebrity.
 */
export async function getDynamicRankings(
    celebrityId: string,
    locale: string,
    options?: {
        categorySlug?: string;
        zodiac?: string;
        birthYear?: number;
    }
) {
    const normalizedLocale = locale.toLowerCase();

    // Create a unique cache key based on inputs
    const cacheKeyParts = [
        'rankings',
        celebrityId,
        normalizedLocale,
        options?.categorySlug || 'no-cat',
        options?.zodiac || 'no-zodiac',
        String(options?.birthYear || 'no-year')
    ];

    const getCachedRankings = unstable_cache(
        async () => {
            const now = new Date();
            const periods = getPeriodKeys(now);

            try {
                const pipeline = redis.pipeline();

                // 1. Global Local Daily/Weekly/Monthly
                pipeline.zrevrank(RedisKeys.rankGlobal(normalizedLocale, Periods.DAILY, periods.daily), celebrityId);
                pipeline.zrevrank(RedisKeys.rankGlobal(normalizedLocale, Periods.WEEKLY, periods.weekly), celebrityId);
                pipeline.zrevrank(RedisKeys.rankGlobal(normalizedLocale, Periods.MONTHLY, periods.monthly), celebrityId);
                pipeline.zrevrank(RedisKeys.rankGlobal(normalizedLocale, Periods.YEARLY, periods.yearly), celebrityId);

                // 2. Category Ranks
                if (options?.categorySlug) {
                    pipeline.zrevrank(RedisKeys.rankCategory(normalizedLocale, options.categorySlug, Periods.DAILY, periods.daily), celebrityId);
                    pipeline.zrevrank(RedisKeys.rankCategory(normalizedLocale, options.categorySlug, Periods.WEEKLY, periods.weekly), celebrityId);
                    pipeline.zrevrank(RedisKeys.rankCategory(normalizedLocale, options.categorySlug, Periods.MONTHLY, periods.monthly), celebrityId);
                }

                // 3. Zodiac Ranks
                if (options?.zodiac) {
                    pipeline.zrevrank(RedisKeys.rankZodiac(normalizedLocale, options.zodiac.toLowerCase(), Periods.MONTHLY, periods.monthly), celebrityId);
                    pipeline.zrevrank(RedisKeys.rankZodiac(normalizedLocale, options.zodiac.toLowerCase(), Periods.YEARLY, periods.yearly), celebrityId);
                }

                // 4. Birth Year Ranks
                if (options?.birthYear) {
                    pipeline.zrevrank(RedisKeys.rankBorn(normalizedLocale, options.birthYear, Periods.YEARLY, periods.yearly), celebrityId);
                    pipeline.zrevrank(RedisKeys.rankBorn(normalizedLocale, options.birthYear, Periods.ALL_TIME, 'all_time'), celebrityId);
                }

                const results = await pipeline.exec();

                if (!results) return null;

                const getRank = (index: number) => {
                    const [err, res] = results[index];
                    if (err || res === null) return null;
                    return (res as number) + 1;
                };

                let idx = 0;
                return {
                    local: {
                        daily: getRank(idx++),
                        weekly: getRank(idx++),
                        monthly: getRank(idx++),
                        yearly: getRank(idx++),
                    },
                    category: options?.categorySlug ? {
                        daily: getRank(idx++),
                        weekly: getRank(idx++),
                        monthly: getRank(idx++),
                    } : null,
                    zodiac: options?.zodiac ? {
                        monthly: getRank(idx++),
                        yearly: getRank(idx++),
                    } : null,
                    born: options?.birthYear ? {
                        yearly: getRank(idx++),
                        allTime: getRank(idx++),
                    } : null
                };

            } catch (error) {
                console.error('[Analytics] Failed to fetch rankings:', error);
                return null;
            }
        },
        cacheKeyParts,
        {
            revalidate: 60,
            tags: ['analytics', `analytics:${celebrityId}`]
        }
    );

    return getCachedRankings();
}

/**
 * Fetches "Trending" celebrities for the Homepage.
 * Source of Truth: rank:score:{locale}:weekly:{current_week}
 */
export async function getTrendingCelebrities(locale: string) {
    const normalizedLocale = locale.toLowerCase();

    const getTrending = unstable_cache(
        async (): Promise<TrendingCelebrity[]> => {
            const now = new Date();
            const periods = getPeriodKeys(now);

            let results: string[] = [];

            // 1. Try Weekly Score
            let redisKey = RedisKeys.rankScore(normalizedLocale, Periods.WEEKLY, periods.weekly);
            results = await redis.zrevrange(redisKey, 0, 11, 'WITHSCORES');

            // 2. Fallback to Monthly if < 5 items
            if (!results || (results.length / 2) < 5) {
                redisKey = RedisKeys.rankScore(normalizedLocale, Periods.MONTHLY, periods.monthly);
                results = await redis.zrevrange(redisKey, 0, 11, 'WITHSCORES');
            }

            // 3. Fallback to All Time Score if < 5 items
            if (!results || (results.length / 2) < 5) {
                 redisKey = RedisKeys.rankScore(normalizedLocale, Periods.ALL_TIME, 'all_time');
                 results = await redis.zrevrange(redisKey, 0, 11, 'WITHSCORES');
            }

            if (!results || results.length === 0) return [];

            const trendingItems = [];
            for (let i = 0; i < results.length; i += 2) {
                trendingItems.push({
                    id: results[i],
                    score: parseInt(results[i + 1]),
                    rank: (i / 2) + 1
                });
            }

            try {
                // Fetch details from Prisma with STRICT Language Filtering
                const dbCelebrities = await prisma.celebrity.findMany({
                    where: {
                        id: { in: trendingItems.map(i => i.id) },
                        publishedLanguages: { has: locale.toUpperCase() }
                    },
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        profession: true,
                        image: true,
                        images: { where: { isMain: true }, take: 1, select: { url: true, isMain: true } },
                        translations: {
                            where: { language: locale.toUpperCase() as any },
                            select: { name: true, profession: true, slug: true }
                        }
                    }
                });

                // Map DB details back to Rank Order
                const completeList = trendingItems.map(item => {
                    const details = dbCelebrities.find(c => c.id === item.id);
                    if (!details) return null;

                    const t = details.translations[0];

                    return {
                        ...item,
                        name: t?.name || details.name,
                        profession: t?.profession || details.profession,
                        slug: t?.slug || details.slug,
                        image: details.images?.[0]?.url || details.image
                    };
                }).filter(Boolean) as TrendingCelebrity[];

                return completeList;

            } catch (error) {
                console.error('[Analytics] Failed to fetch trending details:', error);
                return [];
            }
        },
        ['trending-celebrities', normalizedLocale],
        {
            revalidate: 300, // 5 minutes
            tags: ['trending', `trending-${normalizedLocale}`]
        }
    );

    return getTrending();
}

/**
 * Gets a random celebrity slug for instant redirection.
 */
export async function getRandomCelebrity(locale: string): Promise<string | null> {
    const normalizedLocale = locale.toLowerCase();
    try {
        // 1. Try Redis Set
        const slug = await redis.srandmember(RedisKeys.indexSlugs(normalizedLocale));
        if (slug) return slug;

        // 2. Fallback to DB
        const count = await prisma.celebrity.count({
            where: {
                publishedLanguages: { has: locale.toUpperCase() }
            }
        });

        if (count === 0) return null;

        const skip = Math.floor(Math.random() * count);
        const randomCeleb = await prisma.celebrity.findFirst({
            where: {
                publishedLanguages: { has: locale.toUpperCase() }
            },
            skip: skip,
            select: {
                slug: true,
                translations: {
                    where: { language: locale.toUpperCase() as any },
                    select: { slug: true }
                }
            }
        });

        if (!randomCeleb) return null;

        const t = randomCeleb.translations[0];
        return t?.slug || randomCeleb.slug;

    } catch (error) {
        console.error('[Analytics] Failed to get random celebrity:', error);
        return null;
    }
}

/**
 * Gets the Monthly Boost Rank for a badge.
 * Returns rank + 1 if in top 100, else null.
 */
export async function getMonthlyBoostRank(celebrityId: string, locale: string) {
    const normalizedLocale = locale.toLowerCase();
    // Cache this? Badges don't need to be realtime instant, but unstable_cache is good.
    // Let's cache for 5 mins similar to trending.
    const getRank = unstable_cache(async () => {
        const now = new Date();
        const periods = getPeriodKeys(now);
        // Spec says: "Logic: zrevrank on rank:{locale}:global:monthly:{current_month}"
        // But wait, the prompt says "Monthly Rank Badge" ... "Logic: zrevrank on rank:{locale}:global:monthly:{current_month}"
        // Is this Boost Rank or Global Rank? Prompt title says "Monthly Rank Badge" and logic refers to "rank:{locale}:global:monthly".
        // "rank:{locale}:global" uses Score (Views + Boosts).
        // The prompt description says "Show a badge... if... in the top 100".
        // OK, so it's based on the Global Rank Score.

        const key = RedisKeys.rankGlobal(normalizedLocale, Periods.MONTHLY, periods.monthly);
        const rank = await redis.zrevrank(key, celebrityId);

        if (rank !== null && rank < 100) {
            return rank + 1;
        }
        return null;
    }, ['monthly-rank', celebrityId, normalizedLocale], {
        revalidate: 300,
        tags: [`monthly-rank-${celebrityId}`]
    });

    return getRank();
}
