import { getPopularCompetitions } from '@/actions/competitions';
import CompetitionCard from './CompetitionCard';
import { useTranslations } from 'next-intl';

interface PopularCompetitionsProps {
  locale: string;
}

export default async function PopularCompetitions({ locale }: PopularCompetitionsProps) {
  const competitions = await getPopularCompetitions(locale, 8); // Top 8

  if (competitions.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Popular Competitions</h2>
        {/* View All link could go here */}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {competitions.map((comp: any) => (
          <CompetitionCard key={comp.id} competition={comp} locale={locale} />
        ))}
      </div>
    </section>
  );
}
