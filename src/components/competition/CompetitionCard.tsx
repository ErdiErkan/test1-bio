'use client';

import { CompetitionType, CompetitionStatus } from '@prisma/client';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface CompetitionDTO {
  id: string;
  name: string;
  slug: string;
  coverImage: string | null;
  type: CompetitionType;
  status: CompetitionStatus;
  year: number;
  viewCount: number;
}

interface CompetitionCardProps {
  competition: CompetitionDTO;
  locale: string;
}

export default function CompetitionCard({ competition, locale }: CompetitionCardProps) {
  const t = useTranslations('competitions');

  return (
    <Link
      href={`/competition/${competition.slug}`}
      className="group block bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        {competition.coverImage ? (
          <Image
            src={competition.coverImage}
            alt={competition.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            unoptimized // Served by Nginx with cache headers
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Status Badge */}
        {competition.status === 'ONGOING' && (
          <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
            LIVE
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
            {competition.type.replace('_', ' ')}
          </span>
          <span className="text-xs text-gray-500 font-medium">
            {competition.year}
          </span>
        </div>

        <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors">
          {competition.name}
        </h3>

        <div className="flex items-center text-xs text-gray-500">
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {competition.viewCount.toLocaleString()} views
        </div>
      </div>
    </Link>
  );
}
