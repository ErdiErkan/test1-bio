'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { TrendingCelebrity } from '@/actions/analytics';
import Image from 'next/image';

interface TrendingSectionProps {
    data: TrendingCelebrity[];
    title: string;
}

export default function TrendingSection({ data, title }: TrendingSectionProps) {
    if (!data || data.length === 0) return null;

    return (
        <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
                <span className="text-3xl animate-pulse">🔥</span>
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-red-600">
                    {title}
                </h2>
            </div>

            {/* Horizontal Scroll Container for Mobile, Grid for Desktop */}
            <div className="flex overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 scrollbar-hide snap-x snap-mandatory">
                {data.map((celebrity, index) => (
                    <TrendingCard key={celebrity.id} celebrity={celebrity} index={index} />
                ))}
            </div>
        </div>
    );
}

function TrendingCard({ celebrity, index }: { celebrity: TrendingCelebrity; index: number }) {
    // Smart Image Handling
    let imageUrl = celebrity.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(celebrity.name)}&background=random`;
    if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:') && !imageUrl.startsWith('/')) {
        imageUrl = `/${imageUrl}`
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="min-w-[280px] sm:min-w-0 snap-center"
        >
            <Link href={`/celebrity/${celebrity.slug}`} className="block h-full">
                <div className="relative group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-orange-100 hover:border-orange-300 overflow-hidden h-full flex flex-row sm:flex-col">

                    {/* Rank Badge */}
                    <div className={`
                        absolute top-0 left-0 z-10 px-3 py-1 text-sm font-bold text-white rounded-br-lg shadow-sm
                        ${celebrity.rank === 1 ? 'bg-gradient-to-r from-yellow-400 to-orange-500 ring-2 ring-yellow-200' :
                            celebrity.rank === 2 ? 'bg-gradient-to-r from-gray-300 to-gray-400' :
                                celebrity.rank === 3 ? 'bg-gradient-to-r from-orange-300 to-orange-400' :
                                    'bg-gray-800/80'}
                    `}>
                        #{celebrity.rank}
                    </div>

                    {/* Image Area - ✅ DÜZELTME: img yerine Image */}
                    <div className="w-1/3 sm:w-full h-auto aspect-[3/4] sm:aspect-[4/3] relative">
                        <Image
                            src={imageUrl}
                            alt={celebrity.name}
                            fill
                            sizes="(max-width: 640px) 280px, (max-width: 1024px) 33vw, 25vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            unoptimized // Harici görseller için
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 sm:block hidden" />
                    </div>

                    {/* Content */}
                    <div className="w-2/3 sm:w-full p-4 flex flex-col justify-center sm:justify-start">
                        <h3 className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-1 text-lg">
                            {celebrity.name}
                        </h3>
                        {celebrity.profession && (
                            <p className="text-sm text-gray-500 font-medium mb-3 uppercase tracking-wide line-clamp-1">
                                {celebrity.profession}
                            </p>
                        )}

                        <div className="flex items-center gap-1.5 text-xs text-orange-600 font-semibold bg-orange-50 px-2 py-1 rounded-full w-fit mt-auto sm:mt-0">
                            <span>🚀</span>
                            <span>{celebrity.score.toLocaleString()} Boost Score</span>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}