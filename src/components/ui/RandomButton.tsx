'use client';

import { getRandomCelebrity } from '@/actions/analytics';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useLocale } from 'next-intl';

export function RandomButton() {
    const router = useRouter();
    const locale = useLocale();
    const [isPending, startTransition] = useTransition();

    const handleRandom = () => {
        startTransition(async () => {
            const slug = await getRandomCelebrity(locale);
            if (slug) {
                router.push(`/${locale}/celebrity/${slug}`);
            }
        });
    };

    return (
        <button
            onClick={handleRandom}
            disabled={isPending}
            className="text-gray-600 hover:text-purple-600 px-3 py-2 rounded-md transition-colors flex items-center gap-1 font-medium"
        >
            {isPending ? (
                <span className="animate-spin">🎲</span>
            ) : (
                <span>🎲</span>
            )}
            <span className="hidden sm:inline">Random</span>
        </button>
    );
}
