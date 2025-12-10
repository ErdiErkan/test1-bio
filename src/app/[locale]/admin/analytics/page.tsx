import { redis } from '@/lib/redis';
import { getPeriodKeys } from '@/lib/date-utils';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/db';
import Image from 'next/image';
import AnalyticsToolbar from '@/components/admin/AnalyticsToolbar';
import { RedisKeys, Periods } from '@/lib/redis-keys';

export const dynamic = 'force-dynamic';

type Props = {
    searchParams: Promise<{ [key: string]: string | undefined }>;
    params: Promise<{ locale: string }>;
};

export default async function AdminAnalyticsPage({ searchParams, params }: Props) {
    const { locale: rawLocale } = await params;
    const locale = rawLocale.toLowerCase();
    const query = await searchParams;
    const t = await getTranslations('analytics');

    const now = new Date();
    const periods = getPeriodKeys(now);

    // Filter Params
    const period = (query.period || 'weekly').toLowerCase();
    const dimension = query.dimension || 'global';
    const value = query.value || '';

    // --- HELPER: Fetch Stats for a Period (For Top Cards) ---
    const fetchTopStats = async (periodType: string, periodKey: string) => {
        // Ensure dateKey is 'all_time' if period is 'all_time'
        const dateKey = periodType === Periods.ALL_TIME ? 'all_time' : periodKey;

        let key = '';
        if (dimension === 'global') {
            key = RedisKeys.rankGlobal(locale, periodType, dateKey);
        } else if (dimension === 'category' && value) {
            key = RedisKeys.rankCategory(locale, value, periodType, dateKey);
        } else if (dimension === 'zodiac' && value) {
            key = RedisKeys.rankZodiac(locale, value.toLowerCase(), periodType, dateKey);
        } else if (dimension === 'born' && value) {
            key = RedisKeys.rankBorn(locale, value, periodType, dateKey);
        } else {
             return null;
        }

        const res = await redis.zrevrange(key, 0, 0, 'WITHSCORES'); // Top 1 only for summary cards
        if (res && res.length > 0) {
            return { id: res[0], score: parseInt(res[1]) };
        }
        return null;
    };

    // Parallel Fetching for Dashboard Cards
    const results = await Promise.allSettled([
        fetchTopStats(Periods.WEEKLY, periods.weekly),
        fetchTopStats(Periods.MONTHLY, periods.monthly),
        fetchTopStats(Periods.YEARLY, periods.yearly)
    ]);

    const weeklyTop = results[0].status === 'fulfilled' ? results[0].value : null;
    const monthlyTop = results[1].status === 'fulfilled' ? results[1].value : null;
    const yearlyTop = results[2].status === 'fulfilled' ? results[2].value : null;

    // --- MAIN LEADERBOARD ---

    // Determine DateKey for the selected period
    let mainDateKey = 'all_time';
    if (period !== 'all_time' && period in periods) {
        mainDateKey = periods[period as keyof typeof periods];
    } else if (period !== 'all_time') {
        // Fallback to weekly if invalid
        mainDateKey = periods.weekly;
    }

    let mainListKey = '';

    if (dimension === 'global') {
        mainListKey = RedisKeys.rankGlobal(locale, period, mainDateKey);
    } else if (dimension === 'category' && value) {
        mainListKey = RedisKeys.rankCategory(locale, value, period, mainDateKey);
    } else if (dimension === 'zodiac' && value) {
        mainListKey = RedisKeys.rankZodiac(locale, value.toLowerCase(), period, mainDateKey);
    } else if (dimension === 'born' && value) {
        mainListKey = RedisKeys.rankBorn(locale, value, period, mainDateKey);
    }

    const leaderboard = await redis.zrevrange(mainListKey, 0, 49, 'WITHSCORES');

    // Parse Leaderboard IDs and Scores
    const parsedLeaderboard: { id: string; score: number; rank: number; views?: number; boosts?: number }[] = [];
    if (leaderboard && leaderboard.length > 0) {
        for (let i = 0; i < leaderboard.length; i += 2) {
            parsedLeaderboard.push({
                id: leaderboard[i],
                score: parseInt(leaderboard[i + 1]),
                rank: (i / 2) + 1
            });
        }
    }

    // ENRICHMENT: Fetch View and Boost Counts specifically using stat:views/stat:boosts keys
    if (parsedLeaderboard.length > 0) {
        const statsPipeline = redis.pipeline();
        parsedLeaderboard.forEach(item => {
            const viewKey = RedisKeys.statViews(locale, period, mainDateKey);
            const boostKey = RedisKeys.statBoosts(locale, period, mainDateKey);
            statsPipeline.zscore(viewKey, item.id);
            statsPipeline.zscore(boostKey, item.id);
        });

        const statsResults = await statsPipeline.exec();

        if (statsResults) {
            let resultIdx = 0;
            parsedLeaderboard.forEach(item => {
                const [errV, viewCount] = statsResults[resultIdx++] || [null, 0];
                const [errB, boostCount] = statsResults[resultIdx++] || [null, 0];

                item.views = viewCount ? parseInt(viewCount as string) : 0;
                item.boosts = boostCount ? parseInt(boostCount as string) : 0;
            });
        }
    }

    // Collect all IDs to fetch
    const allIds = new Set<string>();
    parsedLeaderboard.forEach(i => allIds.add(i.id));
    if (weeklyTop) allIds.add(weeklyTop.id);
    if (monthlyTop) allIds.add(monthlyTop.id);
    if (yearlyTop) allIds.add(yearlyTop.id);

    // Hydrate Names from DB
    const celebrities = await prisma.celebrity.findMany({
        where: { id: { in: Array.from(allIds) } },
        select: {
            id: true,
            name: true,
            images: { where: { isMain: true }, take: 1, select: { url: true } },
            image: true,
            translations: {
                where: { language: locale.toUpperCase() as any },
                select: { name: true }
            }
        }
    });

    const getCelebName = (id: string) => {
        const cel = celebrities.find(c => c.id === id);
        return cel?.translations[0]?.name || cel?.name || 'Unknown';
    };
    
    const getCelebImage = (id: string) => {
         const cel = celebrities.find(c => c.id === id);
         let img = cel?.images[0]?.url || cel?.image || null;
         if (img && !img.startsWith('http') && !img.startsWith('/')) img = `/${img}`;
         return img;
    };

    const hydratedLeaderboard = parsedLeaderboard.map(item => ({
        ...item,
        name: getCelebName(item.id),
        image: getCelebImage(item.id)
    }));

    return (
        <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-800">{t('title')}</h1>
            </div>

            {/* Filter Toolbar */}
            <AnalyticsToolbar />

            {/* Visual Cards (3-Column Layout) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {[
                    { title: 'Top Weekly', period: periods.weekly, data: weeklyTop, color: 'text-blue-600' },
                    { title: 'Top Monthly', period: periods.monthly, data: monthlyTop, color: 'text-purple-600' },
                    { title: 'Top Yearly', period: periods.yearly, data: yearlyTop, color: 'text-green-600' }
                ].map((card, i) => (
                    <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-40">
                        <div>
                            <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">{card.title}</h3>
                            <p className="text-xs text-gray-400">{card.period}</p>
                        </div>
                        {card.data ? (
                             <div>
                                <p className={`text-xl font-bold mt-2 truncate ${card.color}`}>
                                    {getCelebName(card.data.id)}
                                </p>
                                <p className="text-sm text-gray-500">Score: {card.data.score.toLocaleString()}</p>
                             </div>
                        ) : (
                            <p className="text-gray-400 italic">No data</p>
                        )}
                    </div>
                ))}
            </div>

            {/* Leaderboard Table */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="font-bold text-gray-800 text-lg">
                        {dimension === 'global' ? t('dimensions.global') : `${t('dimensions.' + dimension)}: ${value}`}
                        <span className="text-sm font-normal text-gray-500 ml-2">({period})</span>
                    </h2>
                    <span className="flex items-center gap-2 text-xs font-medium bg-green-100 text-green-800 px-3 py-1 rounded-full">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        {t('live_data')}
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4 w-20">Rank</th>
                                <th className="px-6 py-4">Celebrity</th>
                                <th className="px-6 py-4 text-right">Views</th>
                                <th className="px-6 py-4 text-right">Boosts</th>
                                <th className="px-6 py-4 text-right text-xs text-gray-400">Total Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {hydratedLeaderboard.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="text-4xl">📉</span>
                                            <p>No data found for this filter.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                hydratedLeaderboard.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4 font-bold text-gray-400 group-hover:text-gray-600">
                                            #{item.rank}
                                        </td>
                                        <td className="px-6 py-4 flex items-center gap-4">
                                            <div className="w-10 h-10 relative rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                                                {item.image ? (
                                                    <Image
                                                        src={item.image}
                                                        alt={item.name}
                                                        fill
                                                        className="object-cover"
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold bg-gray-200">
                                                        {item.name.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="font-semibold text-gray-800">{item.name}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-blue-600 font-medium bg-blue-50/30 rounded">
                                            {item.views?.toLocaleString()} 
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-purple-600 font-bold bg-purple-50/30 rounded">
                                            {item.boosts?.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-xs text-gray-400">
                                            {item.score.toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}