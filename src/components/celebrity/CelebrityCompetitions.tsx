import { prisma } from '@/lib/db';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface CelebrityCompetitionsProps {
  celebrityId: string;
  locale: string;
}

export default async function CelebrityCompetitions({ celebrityId, locale }: CelebrityCompetitionsProps) {
  // Fetch competitions for this celebrity
  const entries = await prisma.competitionEntry.findMany({
    where: { celebrityId },
    include: {
        competition: {
            include: {
                translations: true
            }
        }
    },
    orderBy: {
        competition: {
            eventDate: 'desc'
        }
    }
  });

  if (entries.length === 0) return null;

  return (
    <section className="bg-white py-8 border-t border-gray-100">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Competition History</h3>

      <div className="space-y-4">
        {entries.map(entry => {
            const comp = entry.competition;
            // Translation fallback
            const t = comp.translations.find((tr: any) => tr.language === locale.toUpperCase())
                     || comp.translations[0];
            const name = t?.name || comp.name;
            const description = t?.description || comp.description;

            return (
                <div key={entry.id} className="flex items-start p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    {/* Logo */}
                    <div className="flex-shrink-0 h-16 w-16 relative mr-4 bg-gray-100 rounded-md overflow-hidden">
                        {comp.logoImage ? (
                            <Image src={comp.logoImage} alt={name} fill className="object-contain p-1" unoptimized />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xs">
                                LOGO
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-semibold text-gray-900">
                            <Link href={`/competition/${t?.slug || comp.slug}`} className="hover:text-indigo-600">
                                {name}
                            </Link>
                        </h4>
                        <div className="text-sm text-gray-500 mb-1">
                            {comp.year} • {entry.placement || `Rank: ${entry.rank}`}
                            {entry.isWinner && <span className="ml-2 text-yellow-600 font-bold">🏆 WINNER</span>}
                        </div>
                        {entry.specialAwards.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                                {entry.specialAwards.map((award, i) => (
                                    <span key={i} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                                        {award}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            );
        })}
      </div>
    </section>
  );
}
