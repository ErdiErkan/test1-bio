import { getTrendingCelebrities } from '@/actions/analytics';
import CelebrityCard from '@/components/ui/CelebrityCard';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

export const revalidate = 300; // 5 minutes

export default async function TrendingPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations('common'); // Assuming common has some titles

    // Fetch Trending
    const trending = await getTrendingCelebrities(locale);

    if (!trending) {
        // Should not happen as it returns empty array
        return notFound();
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-2">
                <span className="text-yellow-500">🔥</span>
                Trending Celebrities
            </h1>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {trending.map((celeb, index) => (
                    <div key={celeb.id} className="relative">
                        {/* Rank Badge */}
                        <div className="absolute top-2 left-2 z-10 bg-yellow-400 text-white font-bold w-8 h-8 flex items-center justify-center rounded-full shadow-md border-2 border-white">
                            #{celeb.rank}
                        </div>
                        <CelebrityCard celebrity={celeb} />
                    </div>
                ))}
            </div>

            {trending.length === 0 && (
                <div className="text-center py-20 text-gray-500">
                    <p className="text-xl">Not enough data to show trending profiles yet.</p>
                </div>
            )}
        </div>
    );
}
