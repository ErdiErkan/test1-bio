// src/actions/search.ts
'use server';

import { prisma } from '@/lib/db';
import { z } from 'zod';

export type CategorySearchResult = {
    slug: string;
    name: string;
    language: string;
};

export async function searchCategories(query: string, locale: string): Promise<CategorySearchResult[]> {
    if (!query || query.length < 2) return [];

    try {
        const lang = locale.toUpperCase();

        const results = await prisma.categoryTranslation.findMany({
            where: {
                language: lang as any,
                name: {
                    contains: query,
                    mode: 'insensitive' // Requires Postgres extension or case-insensitive collation, but Prisma 'insensitive' works usually
                }
            },
            take: 10,
            select: {
                slug: true,
                name: true,
                language: true
            }
        });

        return results.map(r => ({ ...r, language: r.language.toString() }));

    } catch (e) {
        console.error('Search categories error:', e);
        return [];
    }
}
