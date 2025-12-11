'use client';

import ContestantSearch from '@/components/admin/ContestantSearch';
import { useRouter } from 'next/navigation';

export default function ClientContestantSearch({ competitionId, locale, onAdd }: any) {
    const router = useRouter();

    return (
        <ContestantSearch
            competitionId={competitionId}
            locale={locale}
            onSelect={async (celebrity) => {
                await onAdd(celebrity.id);
                // Router refresh handled in server action revalidate,
                // but client side refresh ensures UI sync if needed.
                // The parent server action calls revalidatePath, so router.refresh() fetches new data.
                router.refresh();
            }}
        />
    );
}
