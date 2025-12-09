'use server';

import { z } from 'zod';
import { redis } from '@/lib/redis';
import { getPeriodKeys } from '@/lib/date-utils';
import { unstable_cache } from 'next/cache';

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
    // Minimal data needed for the card
    name: string;
    slug: string;
    profession?: string | null;
    image?: string | null;
    images?: { url: string; isMain: boolean }[];
};

const POINTS = {
    view: 1,
    boost: 10,
} as const;

/**
 * Records a user interaction (view or boost) in Redis using a Write-Behind pattern.
 * Increments multiple ZSET keys concurrently via pipeline.
 */
export async function recordInteraction(input: InteractionInput) {
    try {
        // 1. Validate Input
        const data = interactionSchema.parse(input);
        const score = POINTS[data.type];
        const now = new Date();
        const periods = getPeriodKeys(now);

        // 2. Prepare Pipeline
        const pipeline = redis.pipeline();

        // Helper to add increments to pipeline
        const addIncrements = (keyPrefix: string) => {
            // Temporal Ranks
            pipeline.zincrby(`${keyPrefix}:daily:${periods.daily}`, score, data.celebrityId);
            pipeline.zincrby(`${keyPrefix}:weekly:${periods.weekly}`, score, data.celebrityId);
            pipeline.zincrby(`${keyPrefix}:monthly:${periods.monthly}`, score, data.celebrityId);
            pipeline.zincrby(`${keyPrefix}:yearly:${periods.yearly}`, score, data.celebrityId);

            // All Time Rank
            pipeline.zincrby(`${keyPrefix}:all_time`, score, data.celebrityId);
        };

        // --- STRATEGY: Define Key Patterns ---

        // 1. Global Rank (No Locale)
        addIncrements(`rank:global`);

        // 2. Local Rank (Locale Aware)
        addIncrements(`rank:${data.locale}:global`);

        // 3. Category Rank
        if (data.categorySlug) {
            addIncrements(`rank:${data.locale}:category:${data.categorySlug}`);
        }

        // 4. Zodiac Rank
        if (data.zodiac) {
            addIncrements(`rank:${data.locale}:zodiac:${data.zodiac.toLowerCase()}`);
        }

        // 5. Birth Year Rank
        if (data.birthYear) {
            addIncrements(`rank:${data.locale}:born:${data.birthYear}`);
        }

        await pipeline.exec();
        return { success: true };

    } catch (error) {
        console.error('[Analytics] Failed to record interaction:', error);
        return { success: false, error: 'Analytics Error' };
    }
}

/**
 * Fetches the current real-time rankings for a celebrity.
 * Used for "Dynamic Ranking Badges".
 * CACHED via unstable_cache to protect Redis.
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
    // Create a unique cache key based on inputs
    const cacheKeyParts = [
        'rankings',
        celebrityId,
        locale,
        options?.categorySlug || 'no-cat',
        options?.zodiac || 'no-zodiac',
        String(options?.birthYear || 'no-year')
    ];

    // Wrap the logic in unstable_cache
    const getCachedRankings = unstable_cache(
        async () => {
            const now = new Date();
            const periods = getPeriodKeys(now);

            try {
                const pipeline = redis.pipeline();

                // 1. Global Local Daily/Weekly/Monthly
                pipeline.zrevrank(`rank:${locale}:global:daily:${periods.daily}`, celebrityId);
                pipeline.zrevrank(`rank:${locale}:global:weekly:${periods.weekly}`, celebrityId);
                pipeline.zrevrank(`rank:${locale}:global:monthly:${periods.monthly}`, celebrityId);
                pipeline.zrevrank(`rank:${locale}:global:yearly:${periods.yearly}`, celebrityId);

                // 2. Category Ranks (if provided)
                if (options?.categorySlug) {
                    pipeline.zrevrank(`rank:${locale}:category:${options.categorySlug}:daily:${periods.daily}`, celebrityId);
                    pipeline.zrevrank(`rank:${locale}:category:${options.categorySlug}:weekly:${periods.weekly}`, celebrityId);
                    pipeline.zrevrank(`rank:${locale}:category:${options.categorySlug}:monthly:${periods.monthly}`, celebrityId);
                }

                // 3. Zodiac Ranks (if provided)
                if (options?.zodiac) {
                    pipeline.zrevrank(`rank:${locale}:zodiac:${options.zodiac.toLowerCase()}:monthly:${periods.monthly}`, celebrityId);
                    pipeline.zrevrank(`rank:${locale}:zodiac:${options.zodiac.toLowerCase()}:yearly:${periods.yearly}`, celebrityId);
                }

                // 4. Birth Year Ranks (if provided)
                if (options?.birthYear) {
                    pipeline.zrevrank(`rank:${locale}:born:${options.birthYear}:yearly:${periods.yearly}`, celebrityId);
                    pipeline.zrevrank(`rank:${locale}:born:${options.birthYear}:all_time`, celebrityId);
                }

                const results = await pipeline.exec();

                if (!results) return null;

                const getRank = (index: number) => {
                    const [err, res] = results[index];
                    if (err || res === null) return null;
                    return (res as number) + 1; // Convert 0-index to 1-rank
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
        cacheKeyParts, // Key for the cache
        {
            revalidate: 60, // Cache for 60 seconds
            tags: ['analytics', `analytics:${celebrityId}`]
        }
    );

    return getCachedRankings();
}

/**
 * Fetches "Trending" celebrities for the Homepage.
 * Logic:
 * 1. Try "Weekly" Global Rank (Most relevant).
 * 2. If < 5 items, fallback to "Monthly".
 * 3. Populate details from Postgres.
 * 4. Cache for 5 minutes (300s).
 */
export async function getTrendingCelebrities(locale: string) {
    const getTrending = unstable_cache(
        async (): Promise<TrendingCelebrity[]> => {
            const now = new Date();
            const periods = getPeriodKeys(now);

            let results: string[] = [];
            // 1. Try Weekly
            let redisKey = `rank:${locale}:global:weekly:${periods.weekly}`;
            results = await redis.zrevrange(redisKey, 0, 11, 'WITHSCORES'); // Top 12

            // 2. Fallback to Monthly if not enough data
            if (!results || results.length < 10) {
                redisKey = `rank:${locale}:global:monthly:${periods.monthly}`;
                const monthlyResults = await redis.zrevrange(redisKey, 0, 11, 'WITHSCORES');

                // Merge logic: ensure uniqueness if needed, but for fallback usually just replacing is safer/cleaner
                // If weekly was empty, just use monthly.
                if (results.length === 0) {
                    results = monthlyResults;
                } else if (monthlyResults.length > 0) {
                    // Combine? Usually "Trending" falling back to monthly is better than mixing 
                    // because scores are on different scales (weekly vs monthly views).
                    // So if weekly is "too weak" (e.g. < 5 items), purely switch to monthly
                    if (results.length / 2 < 5) results = monthlyResults;
                }
            }

            // 3. Fallback to All Time if still empty (Brand new locale?)
            if (!results || results.length === 0) {
                redisKey = `rank:${locale}:global:all_time`; // Fixed key logic from recordInteraction
                // Wait, recordInteraction uses rank:global:all_time (no locale) 
                // AND rank:{locale}:global:all_time.
                // Let's try locale specific first
                results = await redis.zrevrange(`rank:${locale}:global:all_time`, 0, 11, 'WITHSCORES');

                if (results.length === 0) {
                    // Absolute last resort: Global non-locale
                    results = await redis.zrevrange(`rank:global:all_time`, 0, 11, 'WITHSCORES');
                }
            }

            if (results.length === 0) return [];

            // Parse Redis Results: [id, score, id, score...]
            const trendingItems = [];
            for (let i = 0; i < results.length; i += 2) {
                trendingItems.push({
                    id: results[i],
                    score: parseInt(results[i + 1]),
                    rank: (i / 2) + 1
                });
            }

            // Fetch details from Prisma
            // We import prisma from lib/db inside the function to avoid strict-mode top-level issues if any
            // (Though usually top-level is fine in server actions)
            const { prisma } = await import('@/lib/db');

            const dbCelebrities = await prisma.celebrity.findMany({
                where: { id: { in: trendingItems.map(i => i.id) } },
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
                if (!details) return null; // Should not happen often unless deleted

                const t = details.translations[0];

                return {
                    ...item,
                    name: t?.name || details.name,
                    profession: t?.profession || details.profession,
                    slug: t?.slug || details.slug,
                    // Prefer images relation
                    image: details.images?.[0]?.url || details.image
                };
            }).filter(Boolean) as TrendingCelebrity[];

            return completeList;
        },
        ['trending-celebrities', locale], // Cache Key
        {
            revalidate: 300, // 5 minutes
            tags: ['trending', `trending-${locale}`]
        }
    );

    return getTrending();
}
