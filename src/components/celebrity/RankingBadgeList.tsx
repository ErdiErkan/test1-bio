// src/components/celebrity/RankingBadgeList.tsx
import { getTranslations } from 'next-intl/server';

type Rankings = {
    local: { daily: number | null, weekly: number | null, monthly: number | null, yearly: number | null } | null;
    category: { daily: number | null, weekly: number | null, monthly: number | null } | null;
    zodiac: { monthly: number | null, yearly: number | null } | null;
    born: { yearly: number | null, allTime: number | null } | null;
} | null;

export async function RankingBadgeList({ rankings, locale }: { rankings: Rankings, locale: string }) {
    if (!rankings) return null;

    const t = await getTranslations('common'); // Needs badges translation? Assuming common or custom

    // Helper to format ordinal (1st, 2nd, 3rd) - Basic version, better use intl
    const formatRank = (rank: number) => {
        return `#${rank}`;
    };

    // Decide which badges to show.
    // We don't want to clutter. Show top performance.
    // Priority: Weekly > Monthly > Yearly

    const badges = [];

    // 1. Global Weekly
    if (rankings.local?.weekly && rankings.local.weekly <= 10) {
        badges.push({
            label: "Global Weekly",
            rank: rankings.local.weekly,
            color: "bg-blue-100 text-blue-800 border-blue-200"
        });
    }

    // 2. Category Weekly
    if (rankings.category?.weekly && rankings.category.weekly <= 5) {
        badges.push({
            label: "Category Top",
            rank: rankings.category.weekly,
            color: "bg-purple-100 text-purple-800 border-purple-200"
        });
    }

    // 3. Zodiac Monthly
    if (rankings.zodiac?.monthly && rankings.zodiac.monthly <= 3) {
        badges.push({
            label: "Zodiac Star",
            rank: rankings.zodiac.monthly,
            color: "bg-yellow-100 text-yellow-800 border-yellow-200"
        });
    }

    if (badges.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2 mb-3">
            {badges.map((b, idx) => (
                <span key={idx} className={`px-2 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${b.color}`}>
                    <span className="text-sm">{formatRank(b.rank)}</span>
                    <span className="uppercase opacity-80">{b.label}</span>
                </span>
            ))}
        </div>
    );
}
