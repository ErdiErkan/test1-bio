import { getCompetitionBySlug, addContestant } from '@/actions/competitions';
import ContestantSearch from '@/components/admin/ContestantSearch';
import RankingManager from '@/components/admin/RankingManager';
import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export default async function EditCompetitionPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  // Note: Since we don't have getCompetitionById exposed, we might need to
  // expose it or fetch via Prisma directly here since it's an admin page.
  // For now, let's assume we can add a helper or import prisma.
  // BUT the prompt said "Use existing code patterns".
  // Let's import prisma directly as it's a server component.
  const { prisma } = await import('@/lib/db');

  const competition = await prisma.competition.findUnique({
    where: { id },
    include: {
        translations: true,
        entries: {
            orderBy: { rank: 'asc' },
            include: {
                celebrity: {
                    select: { id: true, name: true, image: true, translations: true }
                }
            }
        }
    }
  });

  if (!competition) notFound();

  // Handle Add Contestant Action (Server Action Wrapper)
  async function handleAddContestant(celebrityId: string) {
    'use server';
    await addContestant(id, {
        celebrityId,
        rank: (competition?.entries.length || 0) + 1,
        notes: ''
    });
    revalidatePath(`/admin/competitions/edit/${id}`);
  }

  // Format entries for RankingManager
  const rankingEntries = competition.entries.map(entry => {
     // Translation fallback for celebrity name
     const t = entry.celebrity.translations.find((tr: any) => tr.language === locale.toUpperCase())
            || entry.celebrity.translations[0];

     return {
        id: entry.id,
        rank: entry.rank,
        placement: entry.placement,
        representingCountry: entry.representingCountry,
        specialAwards: entry.specialAwards,
        celebrity: {
            id: entry.celebrity.id,
            name: t?.name || entry.celebrity.name,
            image: entry.celebrity.image
        }
     };
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Edit Competition</h1>
                <p className="text-gray-600 mt-2">{competition.name}</p>
            </div>
            <div className="text-sm text-gray-500">
                Status: <span className="font-semibold">{competition.status}</span>
            </div>
        </div>

        {/* Add Contestant Section */}
        <div className="bg-white p-6 rounded-lg shadow">
             <ContestantSearchWrapper
                competitionId={id}
                locale={locale}
                onAdd={handleAddContestant}
             />
        </div>

        {/* Ranking Manager */}
        <RankingManager
            competitionId={id}
            initialEntries={rankingEntries}
        />
      </div>
    </div>
  );
}

// Client Wrapper for Search to handle the server action callback
// This is needed because we can't pass server actions directly to client components easily in all cases
// without serialization boundaries, but let's try a simple client wrapper pattern.
import ClientContestantSearch from '@/components/admin/ClientContestantSearch';

function ContestantSearchWrapper({ competitionId, locale, onAdd }: any) {
    return (
        <ClientContestantSearch
            competitionId={competitionId}
            locale={locale}
            onAdd={onAdd}
        />
    );
}
