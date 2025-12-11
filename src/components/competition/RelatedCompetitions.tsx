import { getCompetitions } from '@/actions/competitions';
import CompetitionCard from './CompetitionCard';
import { CompetitionType } from '@prisma/client';

interface RelatedCompetitionsProps {
  type: CompetitionType;
  excludeId: string;
  locale: string;
}

export default async function RelatedCompetitions({ type, excludeId, locale }: RelatedCompetitionsProps) {
  // Fetch recent competitions of same type
  const { data } = await getCompetitions({
    locale,
    type,
    limit: 4,
    status: 'COMPLETED'
  });

  const related = data.filter((c: any) => c.id !== excludeId).slice(0, 3);

  if (related.length === 0) return null;

  return (
    <section className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Competitions</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {related.map((comp: any) => (
            <CompetitionCard key={comp.id} competition={comp} locale={locale} />
          ))}
        </div>
      </div>
    </section>
  );
}
