import Image from 'next/image';
import { CompetitionWithEntries } from '@/actions/competitions';
import { useTranslations } from 'next-intl';

interface CompetitionHeroProps {
  competition: CompetitionWithEntries;
}

export default function CompetitionHero({ competition }: CompetitionHeroProps) {
  const t = useTranslations('competitions');

  if (!competition) return null;

  return (
    <div className="relative bg-gray-900 text-white overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        {competition.coverImage && (
          <Image
            src={competition.coverImage}
            alt={competition.name}
            fill
            className="object-cover opacity-50"
            priority
            unoptimized
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8">

          {/* Logo */}
          {competition.logoImage && (
            <div className="relative h-32 w-32 md:h-40 md:w-40 flex-shrink-0 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <Image
                src={competition.logoImage}
                alt={`${competition.name} Logo`}
                fill
                className="object-contain p-2"
                unoptimized
              />
            </div>
          )}

          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
               <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-600/80 text-white backdrop-blur-sm">
                  {competition.type.replace('_', ' ')}
               </span>
               {competition.status === 'ONGOING' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-red-600 text-white animate-pulse">
                     LIVE EVENT
                  </span>
               )}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 text-white drop-shadow-md">
              {competition.name}
            </h1>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 text-lg text-gray-200">
              {competition.year && (
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-2 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {competition.eventDate
                    ? new Date(competition.eventDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
                    : competition.year}
                </span>
              )}

              {(competition.city || competition.country) && (
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-2 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {[competition.city, competition.country].filter(Boolean).join(', ')}
                </span>
              )}
            </div>

            {competition.description && (
                <p className="mt-6 text-xl text-gray-300 max-w-3xl">
                    {competition.description}
                </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
