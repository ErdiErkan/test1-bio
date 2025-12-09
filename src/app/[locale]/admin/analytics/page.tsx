import { redis } from '@/lib/redis';
import { getPeriodKeys, parsePeriodKey } from '@/lib/date-utils';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/db';
import Image from 'next/image';
import AnalyticsToolbar from '@/components/admin/AnalyticsToolbar';

export const dynamic = 'force-dynamic';

export default async function AdminAnalyticsPage({ searchParams, params }: { searchParams: Promise<{ [key: string]: string | undefined }>, params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const query = await searchParams;
    const t = await getTranslations('analytics');

    const now = new Date();
    const periods = getPeriodKeys(now);

    // Filter Params
    const period = query.period || 'weekly';
    const dimension = query.dimension || 'global';
    const value = query.value || '';

    // Construct Redis Key dynamically
    let leaderboardKey = '';

    // Base time suffix (e.g., ":weekly:2023-W48" or ":monthly:2023-10")
    // "all_time" has no date suffix in our schema usually, or just ":all_time"
    let timeSuffix = '';
    let displayPeriodValue = '';

    switch (period) {
        case 'daily':
            timeSuffix = `:daily:${periods.daily}`;
            displayPeriodValue = periods.daily;
            break;
        case 'weekly':
            timeSuffix = `:weekly:${periods.weekly}`;
            displayPeriodValue = periods.weekly;
            break;
        case 'monthly':
            timeSuffix = `:monthly:${periods.monthly}`;
            displayPeriodValue = periods.monthly;
            break;
        case 'yearly':
            timeSuffix = `:yearly:${periods.yearly}`;
            displayPeriodValue = periods.yearly;
            break;
        case 'all_time':
            timeSuffix = `:all_time`;
            displayPeriodValue = "∞";
            break;
        default:
            timeSuffix = `:weekly:${periods.weekly}`;
            displayPeriodValue = periods.weekly;
    }

    // Construct full key based on dimension
    if (dimension === 'global') {
        // e.g. rank:en:global:weekly:2023-W48
        leaderboardKey = `rank:${locale}:global${timeSuffix}`;
    } else if (dimension === 'category' && value) {
        // e.g. rank:en:category:actor:weekly:2023-W48
        leaderboardKey = `rank:${locale}:category:${value}${timeSuffix}`;
    } else if (dimension === 'zodiac' && value) {
        // e.g. rank:en:zodiac:scorpio:monthly:2023-11
        // Note: Zodiac usually only had monthly/yearly in recordInteraction? Check implementation.
        // Assuming we want to try fetching whatever is requested.
        leaderboardKey = `rank:${locale}:zodiac:${value.toLowerCase()}${timeSuffix}`;
    } else if (dimension === 'born' && value) {
        leaderboardKey = `rank:${locale}:born:${value}${timeSuffix}`;
    } else {
        // Fallback or empty state if value missing for required dim
        leaderboardKey = `rank:${locale}:global${timeSuffix}`;
    }

    const leaderboard = await redis.zrevrange(leaderboardKey, 0, 49, 'WITHSCORES');

    // Parse Leaderboard
    const parsedLeaderboard = [];
    if (leaderboard && leaderboard.length > 0) {
        for (let i = 0; i < leaderboard.length; i += 2) {
            parsedLeaderboard.push({
                id: leaderboard[i],
                score: parseInt(leaderboard[i + 1]),
                rank: (i / 2) + 1
            });
        }
    }

    // Hydrate Names from DB
    const celebrities = await prisma.celebrity.findMany({
        where: { id: { in: parsedLeaderboard.map(i => i.id) } },
        select: {
            id: true,
            name: true,
            images: { where: { isMain: true }, take: 1, select: { url: true } },
            image: true
        }
    });

    const hydratedLeaderboard = parsedLeaderboard.map(item => {
        const cel = celebrities.find(c => c.id === item.id);
        let img = cel?.images[0]?.url || cel?.image || null;
        if (img && !img.startsWith('http') && !img.startsWith('/')) img = `/${img}`;

        return { ...item, name: cel?.name || 'Unknown', image: img };
    });

    return (
        <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-800">{t('title')}</h1>
                <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 text-sm text-gray-600">
                    Redis Key: <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{leaderboardKey}</code>
                </div>
            </div>

            {/* Filter Toolbar */}
            <AnalyticsToolbar />

            {/* Visual Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-32">
                    <div>
                        <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">{t('period')}</h3>
                        <p className="text-3xl font-bold text-blue-600 mt-1">{displayPeriodValue}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-32">
                    <div>
                        <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">{t('dimension')}</h3>
                        <p className="text-3xl font-bold text-purple-600 mt-1 capitalize">
                            {dimension} {value ? `(${value})` : ''}
                        </p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-32">
                    <div>
                        <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Top Celebrity</h3>
                        <p className="text-2xl font-bold text-green-600 mt-1 truncate">
                            {hydratedLeaderboard[0]?.name || '-'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Leaderboard Table */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="font-bold text-gray-800 text-lg">
                        {dimension === 'global' ? t('dimensions.global') : `${t('dimensions.' + dimension)}: ${value}`}
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
                                <th className="px-6 py-4 text-right">{t('views')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {hydratedLeaderboard.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
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
                                        <td className="px-6 py-4 text-right font-mono text-blue-600 font-medium bg-blue-50/30">
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
