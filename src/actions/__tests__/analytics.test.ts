import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { recordInteraction } from '../analytics';
import { redis } from '@/lib/redis';
import Redis from 'ioredis-mock';

// Mock Redis module
vi.mock('@/lib/redis', () => {
    const RedisMock = require('ioredis-mock');
    return {
        redis: new RedisMock()
    };
});

// Mock headers
vi.mock('next/headers', () => ({
    headers: () => ({
        get: (key: string) => {
            if (key === 'x-forwarded-for') return '127.0.0.1';
            return null;
        }
    })
}));

// Mock DB
vi.mock('@/lib/db', () => ({
    prisma: {
        systemSetting: {
            findMany: vi.fn().mockResolvedValue([])
        }
    }
}));

describe('Analytics Action', () => {
    beforeEach(() => {
        // Clear redis data
        (redis as any).flushall();
    });

    it('should record a view interaction correctly', async () => {
        const input = {
            celebrityId: 'cel_123',
            type: 'view' as const,
            locale: 'en',
            categorySlug: 'actor'
        };

        const result = await recordInteraction(input);
        expect(result.success).toBe(true);

        // Verify keys
        // We need to know the current period keys to verify exact keys,
        // but let's check if *some* keys are created.
        const keys = await redis.keys('*');
        expect(keys.length).toBeGreaterThan(0);

        // Check Global Rank
        const globalRank = await redis.zscore('rank:global:all_time', 'cel_123');
        expect(globalRank).toBe('1');

        // Check Locale Rank
        const localeRank = await redis.zscore('rank:en:global:all_time', 'cel_123');
        expect(localeRank).toBe('1');

        // Check Category Rank
        const catRank = await redis.zscore('rank:en:category:actor:all_time', 'cel_123');
        expect(catRank).toBe('1');
    });

    it('should record a boost interaction correctly with default weight', async () => {
        const input = {
            celebrityId: 'cel_456',
            type: 'boost' as const,
            locale: 'tr'
        };

        const result = await recordInteraction(input);
        expect(result.success).toBe(true);

        // Default weight is 10
        const globalRank = await redis.zscore('rank:global:all_time', 'cel_456');
        expect(globalRank).toBe('10');
    });

    it('should rate limit boosts from same IP', async () => {
        const input = {
            celebrityId: 'cel_789',
            type: 'boost' as const,
            locale: 'en'
        };

        // First boost: Success
        const res1 = await recordInteraction(input);
        expect(res1.success).toBe(true);

        // Second boost immediately: Fail
        const res2 = await recordInteraction(input);
        expect(res2.success).toBe(false);
        expect(res2.error).toBe('Rate limit exceeded');
    });
});
