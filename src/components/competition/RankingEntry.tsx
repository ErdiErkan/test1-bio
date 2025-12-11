import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface RankingEntryProps {
  entry: any; // Using any to avoid complex nested type duplication, practically it's CompetitionEntry with includes
  locale: string;
}

export default function RankingEntry({ entry, locale }: RankingEntryProps) {
  const t = useTranslations('competitions');

  // Style variations based on rank
  const isWinner = entry.rank === 1;
  const isTop3 = entry.rank <= 3;

  // Translation fallback
  const translation = entry.celebrity.translations.find((tr: any) => tr.language === locale.toUpperCase())
                     || entry.celebrity.translations[0];
  const name = translation?.name || entry.celebrity.name;
  const image = entry.celebrity.images?.[0]?.url || entry.celebrity.image;

  if (isWinner) {
    return (
      <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-gradient-to-br from-yellow-50 to-white border border-yellow-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
        {/* Winner Badge */}
        <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 font-bold px-4 py-1 rounded-bl-xl shadow-sm z-10">
          WINNER
        </div>

        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative h-48 w-48 md:h-64 md:w-64 flex-shrink-0">
             <div className="absolute inset-0 rounded-full border-4 border-yellow-400 shadow-xl overflow-hidden">
                {image ? (
                    <Image
                        src={image}
                        alt={name}
                        fill
                        className="object-cover"
                        unoptimized
                    />
                ) : (
                    <div className="w-full h-full bg-gray-200" />
                )}
             </div>
             <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-white w-12 h-12 flex items-center justify-center rounded-full font-bold text-xl border-4 border-white shadow">
                1
             </div>
          </div>

          <div className="text-center md:text-left flex-1">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                <Link href={`/celebrity/${entry.celebrity.slug}`} className="hover:text-indigo-600 transition-colors">
                    {name}
                </Link>
            </h3>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-4">
                {entry.representingCountry && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                        Rep: {entry.representingCountry}
                    </span>
                )}
                {entry.placement && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        {entry.placement}
                    </span>
                )}
            </div>

            {entry.specialAwards.length > 0 && (
                <div className="mt-4">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Special Awards</h4>
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                        {entry.specialAwards.map((award: string, idx: number) => (
                            <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                🏆 {award}
                            </span>
                        ))}
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Runner Ups (2 & 3)
  if (isTop3) {
    return (
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col items-center">
                <div className="relative h-32 w-32 mb-4">
                    <div className={`absolute inset-0 rounded-full border-4 ${entry.rank === 2 ? 'border-gray-300' : 'border-orange-300'} overflow-hidden shadow-lg`}>
                        {image ? (
                            <Image src={image} alt={name} fill className="object-cover" unoptimized />
                        ) : <div className="w-full h-full bg-gray-200" />}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-8 h-8 flex items-center justify-center rounded-full font-bold text-white border-2 border-white shadow ${entry.rank === 2 ? 'bg-gray-400' : 'bg-orange-400'}`}>
                        {entry.rank}
                    </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 text-center mb-1">
                    <Link href={`/celebrity/${entry.celebrity.slug}`} className="hover:text-indigo-600">
                        {name}
                    </Link>
                </h3>

                <div className="text-sm text-gray-500 mb-3">{entry.placement || `${entry.rank}. Place`}</div>

                {entry.representingCountry && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                        {entry.representingCountry}
                    </span>
                )}

                 {entry.specialAwards.length > 0 && (
                    <div className="mt-3 flex flex-wrap justify-center gap-1">
                        {entry.specialAwards.map((award: string, idx: number) => (
                             <span key={idx} className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100">
                                {award}
                             </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
  }

  // Standard List Item
  return (
    <div className="bg-white border border-gray-100 rounded-lg p-4 flex items-center hover:bg-gray-50 transition-colors">
        <div className="w-8 font-bold text-gray-400 text-lg mr-4 text-center">{entry.rank}</div>

        <div className="relative h-12 w-12 flex-shrink-0 mr-4">
            {image ? (
                <Image src={image} alt={name} fill className="rounded-full object-cover border border-gray-200" unoptimized />
            ) : <div className="w-full h-full rounded-full bg-gray-200" />}
        </div>

        <div className="flex-1 min-w-0">
            <h4 className="text-base font-semibold text-gray-900 truncate">
                 <Link href={`/celebrity/${entry.celebrity.slug}`} className="hover:text-indigo-600">
                    {name}
                </Link>
            </h4>
            <div className="flex items-center text-sm text-gray-500">
                {entry.placement && <span className="mr-2">{entry.placement}</span>}
                {entry.representingCountry && (
                    <span className="before:content-['•'] before:mr-2">{entry.representingCountry}</span>
                )}
            </div>
        </div>

        {entry.specialAwards.length > 0 && (
             <div className="hidden sm:flex flex-wrap justify-end gap-1 max-w-[40%]">
                {entry.specialAwards.map((award: string, idx: number) => (
                        <span key={idx} className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100 whitespace-nowrap">
                        {award}
                        </span>
                ))}
            </div>
        )}
    </div>
  );
}
