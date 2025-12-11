import RankingEntry from './RankingEntry';
import { useTranslations } from 'next-intl';

interface RankingsSectionProps {
  entries: any[];
  locale: string;
}

export default function RankingsSection({ entries, locale }: RankingsSectionProps) {
  const t = useTranslations('competitions');

  if (!entries || entries.length === 0) return null;

  // Split entries for layout: Top 3 separate from the rest
  const top3 = entries.filter(e => e.rank <= 3);
  const others = entries.filter(e => e.rank > 3);

  return (
    <section className="bg-white py-12 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Official Ranking
        </h2>

        {/* Top 3 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
             {/* Winner (Rank 1) takes full width on mobile, specialized layout */}
             {top3.find(e => e.rank === 1) && (
                <RankingEntry entry={top3.find(e => e.rank === 1)} locale={locale} />
             )}

             {/* Rank 2 & 3 */}
             {top3.filter(e => e.rank > 1).sort((a,b) => a.rank - b.rank).map(entry => (
                <RankingEntry key={entry.id} entry={entry} locale={locale} />
             ))}
        </div>

        {/* Rest of the list */}
        {others.length > 0 && (
            <div className="max-w-4xl mx-auto space-y-3">
                {others.map(entry => (
                    <RankingEntry key={entry.id} entry={entry} locale={locale} />
                ))}
            </div>
        )}
      </div>
    </section>
  );
}
