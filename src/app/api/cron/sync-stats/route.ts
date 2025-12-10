import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { prisma } from '@/lib/db';
import { Period } from '@prisma/client';
import { getPeriodKeys, parsePeriodKey } from '@/lib/date-utils';
import { RedisKeys } from '@/lib/redis-keys';
import { Language } from '@prisma/client';

export const dynamic = 'force-dynamic';

async function syncSlugs() {
    // Populate Redis Set index:{locale}:slugs with all valid slugs
    // Required for O(1) Random Celebrity feature
    const languages = Object.values(Language);
    let totalSlugs = 0;

    for (const lang of languages) {
        const slugs = await prisma.celebrityTranslation.findMany({
            where: { language: lang },
            select: { slug: true }
        });

        if (slugs.length > 0) {
            const redisKey = RedisKeys.indexSlugs(lang.toLowerCase());
            // Replace the set entirely to ensure freshness?
            // SADD adds. DEL + SADD is safer to remove stale ones.
            const pipeline = redis.pipeline();
            pipeline.del(redisKey);
            pipeline.sadd(redisKey, ...slugs.map(s => s.slug));
            await pipeline.exec();
            totalSlugs += slugs.length;
        }
    }
    return totalSlugs;
}

async function processPeriod(period: Period, redisKeySuffix: string, dateKeyVal: string) {
    const BATCH_SIZE = 100; // Smaller batch for transaction safety
    let cursor = 0;
    let totalSynced = 0;

    // Use the shared helper to parse the date correctly
    const recordDate = parsePeriodKey(period, dateKeyVal);

    while (true) {
        // Fetch chunk of leaderboard
        const start = cursor;
        const end = cursor + BATCH_SIZE - 1;

        // ZREVRANGE returns ordered by high score.
        const results = await redis.zrevrange(
            `rank:global:${redisKeySuffix}`,
            start,
            end,
            'WITHSCORES'
        );

        if (results.length === 0) break;

        // Prepare standard upsert data
        // results is [id1, score1, id2, score2, ...]
        const operations = [];

        for (let i = 0; i < results.length; i += 2) {
            const celebrityId = results[i];
            const score = parseInt(results[i + 1]);
            const rank = start + (i / 2) + 1; // 1-based rank

            // Create Prisma Upsert Promise
            const op = prisma.celebrityStats.upsert({
                where: {
                    celebrityId_period_date: {
                        celebrityId,
                        period,
                        date: recordDate
                    }
                },
                create: {
                    celebrityId,
                    period,
                    date: recordDate,
                    views: score,
                    rankGlobal: rank,
                    rankLocal: 0 // Default until we process local ranks
                },
                update: {
                    views: score,
                    rankGlobal: rank,
                    updatedAt: new Date()
                }
            });

            operations.push(op);
        }

        if (operations.length > 0) {
            // Execute as a transaction
            await prisma.$transaction(operations);
            totalSynced += operations.length;
        }

        cursor += BATCH_SIZE;
        // Safety break
        if (cursor > 100000) break;
    }

    return totalSynced;
}

export async function GET(req: NextRequest) {
    // 1. Auth Check
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const now = new Date();
        const periods = getPeriodKeys(now); // { daily: '2023-12-08', ... }

        const results = {
            daily: await processPeriod('DAILY', `daily:${periods.daily}`, periods.daily),
            weekly: await processPeriod('WEEKLY', `weekly:${periods.weekly}`, periods.weekly),
            monthly: await processPeriod('MONTHLY', `monthly:${periods.monthly}`, periods.monthly),
            yearly: await processPeriod('YEARLY', `yearly:${periods.yearly}`, periods.yearly),
            allTime: await processPeriod('ALL_TIME', 'all_time', 'all_time'),
        };

        // 2. Sync Slugs for Random Feature
        const syncedSlugs = await syncSlugs();

        return NextResponse.json({ success: true, synced: results, syncedSlugs });
    } catch (error) {
        console.error('Sync Error:', error);
        return NextResponse.json({ error: 'Sync failed', details: String(error) }, { status: 500 });
    }
}
