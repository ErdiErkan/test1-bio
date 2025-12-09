import { getDynamicRankings } from '@/actions/analytics';
import { useTranslations } from 'next-intl';

// Define the shape of the data returned by our server action
type Rankings = Awaited<ReturnType<typeof getDynamicRankings>>;

interface RankingBadgeListProps {
    rankings: Rankings;
    locale: string;
}

export function RankingBadgeList({ rankings, locale }: RankingBadgeListProps) {
    // Simple heuristic to pick the Best Badge
    // We want to show at most 1-2 badges to avoid clutter
    if (!rankings) return null;

    const badges = [];

    // 1. Local Rank (Most Relevant)
    if (rankings.local.daily && rankings.local.daily <= 3) {
        badges.push({ type: 'local', period: 'daily', rank: rankings.local.daily, label: 'Trending Today' });
    } else if (rankings.local.weekly && rankings.local.weekly <= 3) {
        badges.push({ type: 'local', period: 'weekly', rank: rankings.local.weekly, label: 'Top This Week' });
    }

    // 2. Global Rank (Prestige) - Only if not already showing a better local rank
    if (rankings.local.daily && rankings.local.daily === 1) {
        // Already showing #1 Global/Local likely
    } else {
        // Check categories or Zodiac
        if (rankings.category?.daily && rankings.category.daily === 1) {
            badges.push({ type: 'category', period: 'daily', rank: 1, label: 'Top in Category' });
        }
        else if (rankings.zodiac?.monthly && rankings.zodiac.monthly === 1) {
            badges.push({ type: 'zodiac', period: 'monthly', rank: 1, label: 'Zodiac of the Month' });
        }
    }

    // Fallback: If simply high traffic
    if (badges.length === 0 && rankings.local.weekly && rankings.local.weekly <= 10) {
        badges.push({ type: 'local', period: 'weekly', rank: rankings.local.weekly, label: 'Trending' });
    }

    if (badges.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2 mt-2 mb-4">
            {badges.map((badge, idx) => (
                <Badge key={idx} rank={badge.rank} label={badge.label} />
            ))}
        </div>
    );
}

function Badge({ rank, label }: { rank: number; label: string }) {
    let styleClass = 'bg-gray-100 text-gray-800 border-gray-200';
    let icon = '📈';

    if (rank === 1) {
        styleClass = 'bg-yellow-100 text-yellow-800 border-yellow-200 shadow-sm';
        icon = '🏆';
    } else if (rank === 2) {
        styleClass = 'bg-slate-100 text-slate-800 border-slate-200';
        icon = '🥈';
    } else if (rank === 3) {
        styleClass = 'bg-orange-50 text-orange-800 border-orange-200';
        icon = '🥉';
    } else if (rank <= 10) {
        styleClass = 'bg-blue-50 text-blue-800 border-blue-200';
        icon = '🔥';
    }

    return (
        <span className={`
      inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border
      ${styleClass}
    `}>
            <span>{icon}</span>
            <span>{label} #{rank}</span>
        </span>
    );
}
