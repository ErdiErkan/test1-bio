'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db';
import { redis } from '@/lib/redis';
import { unstable_cache, revalidateTag } from 'next/cache';
import { Language, CompetitionType, CompetitionScope, CompetitionStatus } from '@prisma/client';
import { getPeriodKeys } from '@/lib/date-utils';
import { auth } from '@/lib/auth';
import { CompetitionRedisKeys } from '@/lib/redis-keys';
import {
  CreateCompetitionInput,
  createCompetitionSchema,
  AddContestantInput,
  addContestantSchema,
  UpdateRankingsInput,
  updateRankingsSchema
} from '@/lib/validations/competition';

// ============================================
// TYPES
// ============================================

export type CompetitionWithEntries = Awaited<ReturnType<typeof getCompetitionBySlugInternal>>;
export type PopularCompetition = {
  id: string;
  name: string;
  slug: string;
  coverImage: string | null;
  type: CompetitionType;
  year: number;
  viewCount: number;
};

// ============================================
// HELPER: Language Normalization (match existing pattern)
// ============================================

function getLanguage(locale: string): Language {
  const normalized = locale.toUpperCase();
  if (Object.values(Language).includes(normalized as Language)) {
    return normalized as Language;
  }
  const short = normalized.substring(0, 2) as Language;
  if (Object.values(Language).includes(short)) {
    return short;
  }
  return Language.EN;
}

// ============================================
// HELPER: DTO Mapper
// ============================================

function mapCompetitionToDTO(competition: any, locale: string) {
  const lang = getLanguage(locale);
  const translations = competition.translations || [];

  // Priority: Requested → EN → TR → First
  let t = translations.find((t: any) => t.language === lang);
  if (!t) t = translations.find((t: any) => t.language === 'EN');
  if (!t) t = translations.find((t: any) => t.language === 'TR');
  if (!t) t = translations[0];

  // Safe date serialization for Client Components
  const serializeDate = (d: Date | null) => d ? d.toISOString() : null;

  return {
    ...competition,
    eventDate: serializeDate(competition.eventDate),
    createdAt: serializeDate(competition.createdAt),
    updatedAt: serializeDate(competition.updatedAt),
    name: t?.name || competition.name,
    slug: t?.slug || competition.slug,
    description: t?.description || competition.description,
    seoContent: t?.seoContent || competition.seoContent,
    metaTitle: t?.metaTitle || null,
    metaDescription: t?.metaDescription || null,
  };
}

// ============================================
// READ OPERATIONS (CACHED)
// ============================================

/**
 * Get competition by slug - HEAVILY CACHED
 * This is the most critical function for performance
 */
async function getCompetitionBySlugInternal(slug: string, locale: string) {
  const lang = getLanguage(locale);

  // First try to find by translation slug
  const translation = await prisma.competitionTranslation.findFirst({
    where: { slug, language: lang },
    select: { competitionId: true }
  });

  let competitionId = translation?.competitionId;

  // Fallback to root slug
  if (!competitionId) {
    const competition = await prisma.competition.findUnique({
      where: { slug },
      select: { id: true }
    });
    competitionId = competition?.id;
  }

  if (!competitionId) return null;

  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
    include: {
      translations: true,
      categories: {
        include: { translations: true }
      },
      entries: {
        orderBy: { rank: 'asc' },
        include: {
          celebrity: {
            include: {
              translations: true,
              images: {
                where: { isMain: true },
                take: 1
              }
            }
          }
        }
      }
    }
  });

  if (!competition) return null;

  // Language availability check
  if (competition.publishedLanguages.length > 0) {
    if (!competition.publishedLanguages.includes(lang)) {
      return null;
    }
  }

  return mapCompetitionToDTO(competition, locale);
}

// CACHED VERSION - Use this in pages
export const getCompetitionBySlug = unstable_cache(
  getCompetitionBySlugInternal,
  ['competition-detail'],
  {
    revalidate: 300, // 5 minutes
    tags: ['competitions']
  }
);

/**
 * Get popular competitions - For homepage widget
 */
async function getPopularCompetitionsInternal(locale: string, limit: number = 10) {
  const lang = getLanguage(locale);

  const competitions = await prisma.competition.findMany({
    where: {
      status: { in: ['COMPLETED', 'ONGOING'] },
      publishedLanguages: { has: lang }
    },
    orderBy: { viewCount: 'desc' },
    take: limit,
    include: {
      translations: {
        where: { language: lang }
      }
    }
  });

  return competitions.map(c => mapCompetitionToDTO(c, locale));
}

export const getPopularCompetitions = unstable_cache(
  getPopularCompetitionsInternal,
  ['competitions-popular'],
  {
    revalidate: 3600, // 1 hour
    tags: ['competitions', 'competitions-popular']
  }
);

/**
 * Get competitions list with filters
 */
async function getCompetitionsInternal(params: {
  locale: string;
  type?: CompetitionType;
  scope?: CompetitionScope;
  year?: number;
  status?: CompetitionStatus | 'ALL_PUBLIC';
  limit?: number;
  page?: number;
}) {
  const { locale, type, scope, year, status, limit = 12, page = 1 } = params;
  const lang = getLanguage(locale);
  const skip = (page - 1) * limit;

  const where: any = {
    publishedLanguages: { has: lang }
  };

  if (type) where.type = type;
  if (scope) where.scope = scope;
  if (year) where.year = year;

  if (status === 'ALL_PUBLIC') {
     where.status = { in: ['UPCOMING', 'ONGOING', 'COMPLETED', 'ARCHIVED'] };
  } else if (status) {
     where.status = status;
  } else {
     where.status = { not: 'DRAFT' }; // Hide drafts by default
  }

  const [competitions, total] = await Promise.all([
    prisma.competition.findMany({
      where,
      orderBy: [
        { isFeatured: 'desc' },
        { eventDate: 'desc' }
      ],
      skip,
      take: limit,
      include: {
        translations: { where: { language: lang } }
      }
    }),
    prisma.competition.count({ where })
  ]);

  return {
    data: competitions.map(c => mapCompetitionToDTO(c, locale)),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export const getCompetitions = unstable_cache(
  getCompetitionsInternal,
  ['competitions-list'],
  {
    revalidate: 300,
    tags: ['competitions']
  }
);

// ============================================
// WRITE OPERATIONS (ADMIN)
// ============================================

// Helper for auth check
async function checkAdmin() {
  const session = await auth();
  if (!session || session.user.role !== 'admin') {
    throw new Error('Unauthorized');
  }
  return session;
}

/**
 * Create new competition
 */
export async function createCompetition(data: CreateCompetitionInput) {
  try {
    await checkAdmin();

    // Validate input with Zod
    const validated = createCompetitionSchema.parse(data);
    const { common, translations } = validated;

    // Get primary translation (EN or first available)
    const primaryLang = translations['EN'] ? 'EN' : Object.keys(translations)[0];
    const primaryData = translations[primaryLang];

    if (!primaryData?.name) {
      return { success: false, error: 'Name is required' };
    }

    const competition = await prisma.$transaction(async (tx) => {
      // Create main competition
      const created = await tx.competition.create({
        data: {
          name: primaryData.name,
          slug: primaryData.slug || createSlug(primaryData.name),
          description: primaryData.description,
          seoContent: primaryData.seoContent,
          type: common.type,
          scope: common.scope,
          year: common.year,
          edition: common.edition,
          eventDate: common.eventDate ? new Date(common.eventDate) : null,
          country: common.country,
          city: common.city,
          venue: common.venue,
          coverImage: common.coverImage,
          logoImage: common.logoImage,
          publishedLanguages: common.publishedLanguages || [],
          status: common.status || CompetitionStatus.DRAFT,
          isFeatured: common.isFeatured || false,
          categories: common.categoryIds ? {
            connect: common.categoryIds.map(id => ({ id }))
          } : undefined
        }
      });

      // Create translations
      for (const [lang, transData] of Object.entries(translations)) {
        if (!transData) continue;

        const language = lang.toUpperCase() as Language;
        if (!Object.values(Language).includes(language)) continue;

        const slug = transData.slug || createSlug(transData.name);

        await tx.competitionTranslation.create({
          data: {
            competitionId: created.id,
            language,
            name: transData.name,
            slug,
            description: transData.description,
            seoContent: transData.seoContent,
            metaTitle: transData.metaTitle,
            metaDescription: transData.metaDescription
          }
        });
      }

      return created;
    });

    revalidateTag('competitions');
    return { success: true, data: competition };

  } catch (error) {
    console.error('Create Competition Error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: (error as any).errors[0].message };
      return { success: false, error: (error as any).errors[0].message };
      return { success: false, error: (error as any).errors[0].message };
      return { success: false, error: (error as any).errors[0].message };
    }
    return { success: false, error: 'Failed to create competition' };
  }
}

/**
 * Update competition
 */
export async function updateCompetition(id: string, data: CreateCompetitionInput) {
  try {
    await checkAdmin();

    const validated = createCompetitionSchema.parse(data);
    const { common, translations } = validated;

    await prisma.$transaction(async (tx) => {
      // Update main fields
      await tx.competition.update({
        where: { id },
        data: {
          type: common.type,
          scope: common.scope,
          year: common.year,
          edition: common.edition,
          eventDate: common.eventDate ? new Date(common.eventDate) : null,
          country: common.country,
          city: common.city,
          venue: common.venue,
          coverImage: common.coverImage,
          logoImage: common.logoImage,
          publishedLanguages: common.publishedLanguages || [],
          isFeatured: common.isFeatured,
          status: common.status,
          categories: common.categoryIds ? {
            set: common.categoryIds.map((cid: string) => ({ id: cid }))
          } : undefined
        }
      });

      // Upsert translations
      for (const [lang, transData] of Object.entries(translations)) {
        if (!transData) continue;

        const language = lang.toUpperCase() as Language;
        const tData = transData as any;
        const slug = tData.slug || createSlug(tData.name);

        await tx.competitionTranslation.upsert({
          where: {
            competitionId_language: { competitionId: id, language }
          },
          update: {
            name: tData.name,
            slug,
            description: tData.description,
            seoContent: tData.seoContent,
            metaTitle: tData.metaTitle,
            metaDescription: tData.metaDescription
          },
          create: {
            competitionId: id,
            language,
            name: tData.name,
            slug,
            description: tData.description,
            seoContent: tData.seoContent,
            metaTitle: tData.metaTitle,
            metaDescription: tData.metaDescription
          }
        });

        // Sync to root if EN
        if (language === 'EN') {
          await tx.competition.update({
            where: { id },
            data: {
              name: tData.name,
              slug,
              description: tData.description,
              seoContent: tData.seoContent
            }
          });
        }
      }
    });

    revalidateTag('competitions');
    return { success: true };

  } catch (error) {
    console.error('Update Competition Error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: (error as any).errors[0].message };
      return { success: false, error: (error as any).errors[0].message };
      return { success: false, error: (error as any).errors[0].message };
      return { success: false, error: (error as any).errors[0].message };
    }
    return { success: false, error: 'Failed to update competition' };
  }
}

/**
 * Delete competition
 */
export async function deleteCompetition(id: string) {
  try {
    await checkAdmin();

    await prisma.competition.delete({
      where: { id }
    });

    revalidateTag('competitions');
    return { success: true };
  } catch (error) {
    console.error('Delete Competition Error:', error);
    return { success: false, error: 'Failed to delete competition' };
  }
}

/**
 * Add contestant to competition
 */
export async function addContestant(competitionId: string, data: AddContestantInput) {
  try {
    await checkAdmin();

    const validated = addContestantSchema.parse(data);

    // Check if already exists
    const existing = await prisma.competitionEntry.findUnique({
      where: {
        competitionId_celebrityId: {
          competitionId,
          celebrityId: validated.celebrityId
        }
      }
    });

    if (existing) {
      return { success: false, error: 'Celebrity already in this competition' };
    }

    const entry = await prisma.competitionEntry.create({
      data: {
        competitionId,
        celebrityId: validated.celebrityId,
        rank: validated.rank,
        placement: validated.placement,
        representingCountry: validated.representingCountry,
        specialAwards: validated.specialAwards || [],
        isWinner: validated.rank === 1,
        notes: validated.notes
      }
    });

    revalidateTag('competitions');
    return { success: true, data: entry };

  } catch (error) {
    console.error('Add Contestant Error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: (error as any).errors[0].message };
      return { success: false, error: (error as any).errors[0].message };
      return { success: false, error: (error as any).errors[0].message };
      return { success: false, error: (error as any).errors[0].message };
    }
    return { success: false, error: 'Failed to add contestant' };
  }
}

/**
 * Update rankings (bulk update for drag-drop)
 */
export async function updateRankings(competitionId: string, rankings: UpdateRankingsInput) {
  try {
    await checkAdmin();

    const validated = updateRankingsSchema.parse(rankings);

    await prisma.$transaction(async (tx) => {
      for (const item of validated) {
        await tx.competitionEntry.update({
          where: { id: item.entryId },
          data: {
            rank: item.rank,
            placement: item.placement,
            isWinner: item.rank === 1
          }
        });
      }
    });

    revalidateTag('competitions');
    return { success: true };

  } catch (error) {
    console.error('Update Rankings Error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: (error as any).errors[0].message };
      return { success: false, error: (error as any).errors[0].message };
      return { success: false, error: (error as any).errors[0].message };
      return { success: false, error: (error as any).errors[0].message };
    }
    return { success: false, error: 'Failed to update rankings' };
  }
}

/**
 * Remove contestant from competition
 */
export async function removeContestant(competitionId: string, celebrityId: string) {
  try {
    await checkAdmin();

    await prisma.competitionEntry.delete({
      where: {
        competitionId_celebrityId: { competitionId, celebrityId }
      }
    });

    revalidateTag('competitions');
    return { success: true };

  } catch (error) {
    console.error('Remove Contestant Error:', error);
    return { success: false, error: 'Failed to remove contestant' };
  }
}

/**
 * Search celebrities for adding to competition
 * Reuses existing search logic but excludes already-added ones
 */
export async function searchCelebritiesForCompetition(
  query: string,
  competitionId: string,
  locale: string,
  limit: number = 10
) {
  // Read-only, no admin check strictly required for search, but context is admin.
  // We'll leave it open for now or add checkAdmin if this is sensitive.
  // Given it returns public data (celebrity names), it's fine.

  const lang = getLanguage(locale);

  // Get already added celebrity IDs
  const existingEntries = await prisma.competitionEntry.findMany({
    where: { competitionId },
    select: { celebrityId: true }
  });
  const excludeIds = existingEntries.map(e => e.celebrityId);

  const celebrities = await prisma.celebrity.findMany({
    where: {
      id: { notIn: excludeIds },
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        {
          translations: {
            some: {
              name: { contains: query, mode: 'insensitive' }
            }
          }
        }
      ]
    },
    take: limit,
    include: {
      translations: { where: { language: lang } },
      images: { where: { isMain: true }, take: 1 }
    }
  });

  return celebrities.map(c => {
    const t = c.translations[0];
    return {
      id: c.id,
      name: t?.name || c.name,
      profession: t?.profession || c.profession,
      nationality: c.nationality,
      image: c.images[0]?.url || c.image
    };
  });
}

// ============================================
// ANALYTICS (REDIS)
// ============================================

/**
 * Record competition view - Write-Behind pattern
 */
export async function recordCompetitionView(competitionId: string, locale: string) {
  try {
    const now = new Date();
    const periods = getPeriodKeys(now);
    const pipeline = redis.pipeline();

    // Increment view counters using centralized keys
    pipeline.zincrby(CompetitionRedisKeys.views(locale, `daily:${periods.daily}`), 1, competitionId);
    pipeline.zincrby(CompetitionRedisKeys.views(locale, `weekly:${periods.weekly}`), 1, competitionId);
    pipeline.zincrby(CompetitionRedisKeys.views(locale, `monthly:${periods.monthly}`), 1, competitionId);
    pipeline.zincrby(CompetitionRedisKeys.viewsAllTime(), 1, competitionId);

    // Popular ranking (decay-adjusted would be better, but simple count for now)
    pipeline.zincrby(CompetitionRedisKeys.popular(), 1, competitionId);

    await pipeline.exec();

    // Background sync to DB (every 100 views or on cron)
    const totalViews = await redis.zscore(CompetitionRedisKeys.viewsAllTime(), competitionId);
    if (totalViews && parseInt(totalViews) % 100 === 0) {
      await prisma.competition.update({
        where: { id: competitionId },
        data: { viewCount: parseInt(totalViews) }
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Record Competition View Error:', error);
    return { success: false };
  }
}

// ============================================
// HELPERS
// ============================================

function createSlug(text: string): string {
  const turkishMap: Record<string, string> = {
    'ç': 'c', 'Ç': 'C', 'ğ': 'g', 'Ğ': 'G', 'ı': 'i', 'I': 'I',
    'İ': 'I', 'ö': 'o', 'Ö': 'O', 'ş': 's', 'Ş': 'S', 'ü': 'u', 'Ü': 'U',
  };

  return text
    .split('')
    .map(char => turkishMap[char] || char)
    .join('')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}
