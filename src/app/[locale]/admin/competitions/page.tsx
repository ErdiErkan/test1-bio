import Link from 'next/link';
import { getCompetitions } from '@/actions/competitions';
import CompetitionsTable from '@/components/admin/CompetitionsTable';
import { CompetitionType, CompetitionStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function CompetitionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  const search = await searchParams;

  const page = typeof search.page === 'string' ? parseInt(search.page) : 1;
  const type = typeof search.type === 'string' ? (search.type as CompetitionType) : undefined;
  const status = typeof search.status === 'string' ? (search.status as CompetitionStatus) : undefined;
  const year = typeof search.year === 'string' ? parseInt(search.year) : undefined;

  const { data: competitions, pagination } = await getCompetitions({
    locale,
    page,
    limit: 20,
    type,
    status,
    year,
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Competitions</h1>
            <p className="text-gray-600 mt-2">Manage competitions, pageants, and awards.</p>
          </div>
          <Link
            href={`/admin/competitions/create`}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 min-h-[44px]"
          >
            + Create Competition
          </Link>
        </div>

        {/* Filter Bar could go here (reusing AdminFilterBar or creating custom) */}

        <CompetitionsTable competitions={competitions} locale={locale} />

        {/* Simple Pagination */}
        <div className="flex justify-between items-center bg-white px-4 py-3 border-t border-gray-200 sm:px-6 rounded-lg shadow-sm">
          <div className="text-sm text-gray-700">
            Showing page <span className="font-medium">{pagination.page}</span> of{' '}
            <span className="font-medium">{pagination.totalPages}</span> ({pagination.total} total)
          </div>
          <div className="flex gap-2">
            <Link
              href={{
                query: { ...search, page: Math.max(1, page - 1) },
              }}
              className={`px-3 py-1 border rounded hover:bg-gray-50 ${
                page <= 1 ? 'pointer-events-none opacity-50' : ''
              }`}
            >
              Previous
            </Link>
            <Link
              href={{
                query: { ...search, page: Math.min(pagination.totalPages, page + 1) },
              }}
              className={`px-3 py-1 border rounded hover:bg-gray-50 ${
                page >= pagination.totalPages ? 'pointer-events-none opacity-50' : ''
              }`}
            >
              Next
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
