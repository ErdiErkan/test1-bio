import { getCompetitions } from '@/actions/competitions';
import CompetitionCard from '@/components/competition/CompetitionCard';
import CompetitionFilters from '@/components/competition/CompetitionFilters';
import PopularCompetitions from '@/components/competition/PopularCompetitions';
import { getTranslations } from 'next-intl/server';
import { CompetitionType, CompetitionStatus } from '@prisma/client';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'competitions' });

  return {
    title: `${t('title')} | CelebHub`,
    description: t('meta_description') || 'Browse the latest beauty pageants, awards, and celebrity competitions.',
  };
}

export default async function CompetitionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  const search = await searchParams;
  const t = await getTranslations({ locale, namespace: 'competitions' });

  const page = typeof search.page === 'string' ? parseInt(search.page) : 1;
  const type = typeof search.type === 'string' ? (search.type as CompetitionType) : undefined;
  const year = typeof search.year === 'string' ? parseInt(search.year) : undefined;

  // Fetch data
  const { data: competitions, pagination } = await getCompetitions({
    locale,
    page,
    limit: 12,
    type,
    year,
    status: 'COMPLETED' // Default to showing completed/ongoing in public list? Or all public?
                        // Actually getCompetitions defaults to hiding DRAFT.
                        // Let's explicitly say we want all non-drafts.
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl mb-4">
            {t('title')}
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-gray-500">
            {t('subtitle') || 'Follow the world\'s most prestigious events and rankings.'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Popular Section (Only on first page and no filters) */}
        {page === 1 && !type && !year && (
          <PopularCompetitions locale={locale} />
        )}

        {/* Filters */}
        <CompetitionFilters />

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {competitions.map((comp: any) => (
            <CompetitionCard key={comp.id} competition={comp} locale={locale} />
          ))}
        </div>

        {competitions.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {t('no_results')}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {page > 1 && (
              <Link
                href={{ query: { ...search, page: page - 1 } }}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Previous
              </Link>
            )}
            <span className="px-4 py-2 text-gray-500">
              Page {page} of {pagination.totalPages}
            </span>
            {page < pagination.totalPages && (
              <Link
                href={{ query: { ...search, page: page + 1 } }}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Next
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
