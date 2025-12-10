'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import type { SocialPlatform } from '@/lib/types'
import { Language } from '@prisma/client'
import { z } from 'zod'

// --- Zod Schemas ---

const ImageInputSchema = z.object({
  url: z.string(),
  isMain: z.boolean().optional(),
  displayOrder: z.number().optional()
})

const SocialLinkInputSchema = z.object({
  platform: z.enum(['INSTAGRAM', 'TWITTER', 'YOUTUBE', 'TIKTOK', 'FACEBOOK', 'LINKEDIN', 'WEBSITE', 'IMDB', 'SPOTIFY']),
  url: z.string(),
  displayOrder: z.number().optional()
})

const FAQInputSchema = z.object({
  question: z.string(),
  answer: z.string(),
  displayOrder: z.number().optional()
})

const TranslationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  // .nullable() ekleyerek null değerlerin geçmesine izin veriyoruz
  bio: z.string().nullable().optional().or(z.literal('')),
  profession: z.string().nullable().optional().or(z.literal('')),
  slug: z.string().nullable().optional().or(z.literal('')),
  nickname: z.string().nullable().optional().or(z.literal('')),
  birthPlace: z.string().nullable().optional().or(z.literal('')),
  nationality: z.string().nullable().optional().or(z.literal('')),
  zodiac: z.string().nullable().optional().or(z.literal('')),
  altText: z.string().nullable().optional().or(z.literal('')),
  faqs: z.array(FAQInputSchema).optional()
})

const CelebritySchema = z.object({
  common: z.object({
    birthDate: z.string().optional().nullable().or(z.literal('')), // YYYY-MM-DD
    gender: z.string().optional(),
    categoryIds: z.array(z.string()),
    publishedLanguages: z.array(z.string()).optional(),
    images: z.array(ImageInputSchema),
    socialLinks: z.array(SocialLinkInputSchema).optional(),
    // faqs removed from common
  }),
  // RELAXED SCHEMA: Allow keys to be strings and values to be optional/nullable
  translations: z.record(z.string(), TranslationSchema.optional().nullable())
})

type CelebrityInput = z.infer<typeof CelebritySchema>

// --- Helpers ---

const ZODIAC_SIGNS = [
  { name: 'capricorn', start: { month: 1, day: 1 }, end: { month: 1, day: 19 } },
  { name: 'aquarius', start: { month: 1, day: 20 }, end: { month: 2, day: 18 } },
  { name: 'pisces', start: { month: 2, day: 19 }, end: { month: 3, day: 20 } },
  { name: 'aries', start: { month: 3, day: 21 }, end: { month: 4, day: 19 } },
  { name: 'taurus', start: { month: 4, day: 20 }, end: { month: 5, day: 20 } },
  { name: 'gemini', start: { month: 5, day: 21 }, end: { month: 6, day: 20 } },
  { name: 'cancer', start: { month: 6, day: 21 }, end: { month: 7, day: 22 } },
  { name: 'leo', start: { month: 7, day: 23 }, end: { month: 8, day: 22 } },
  { name: 'virgo', start: { month: 8, day: 23 }, end: { month: 9, day: 22 } },
  { name: 'libra', start: { month: 9, day: 23 }, end: { month: 10, day: 22 } },
  { name: 'scorpio', start: { month: 10, day: 23 }, end: { month: 11, day: 21 } },
  { name: 'sagittarius', start: { month: 11, day: 22 }, end: { month: 12, day: 21 } },
  { name: 'capricorn', start: { month: 12, day: 22 }, end: { month: 12, day: 31 } },
]

function getZodiacSign(date: Date): string {
  const month = date.getMonth() + 1
  const day = date.getDate()

  const sign = ZODIAC_SIGNS.find(s =>
    (month === s.start.month && day >= s.start.day) ||
    (month === s.end.month && day <= s.end.day)
  )

  return sign ? sign.name : ''
}

function createSlug(text: string): string {
  const turkishMap: Record<string, string> = {
    'ç': 'c', 'Ç': 'C', 'ğ': 'g', 'Ğ': 'G', 'ı': 'i', 'I': 'I',
    'İ': 'I', 'ö': 'o', 'Ö': 'O', 'ş': 's', 'Ş': 'S', 'ü': 'u', 'Ü': 'U',
  }

  return text
    .split('')
    .map(char => turkishMap[char] || char)
    .join('')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function generateUniqueSlug(baseText: string, language: Language, existingId?: string) {
  let slug = createSlug(baseText)
  let suffix = 0

  while (true) {
    const checkSlug = suffix > 0 ? `${slug}-${suffix}` : slug

    // Check collision in Translation table for this language
    const existing = await prisma.celebrityTranslation.findFirst({
      where: {
        slug: checkSlug,
        language: language,
        ...(existingId ? { celebrityId: { not: existingId } } : {})
      }
    })

    if (!existing) {
      return checkSlug
    }
    suffix++
  }
}

// Helper: Normalize Locale to Enum
function getLanguage(locale: string): Language {
  const normalized = locale.toUpperCase();
  // Robust check: try exact match, then substring match (e.g. TR-TR -> TR)
  if (Object.values(Language).includes(normalized as Language)) {
    return normalized as Language;
  }
  const short = normalized.substring(0, 2) as Language;
  if (Object.values(Language).includes(short)) {
    return short;
  }
  return Language.EN;
}

// Helper: DTO Mapper
function mapCelebrityToDTO(celebrity: any, locale: string) {
  const lang = getLanguage(locale);
  const translations = celebrity.translations || [];

  // Order of preference: Requested Lang -> EN -> TR -> First Available
  let t = translations.find((t: any) => t.language === lang);
  if (!t) t = translations.find((t: any) => t.language === 'EN');
  if (!t) t = translations.find((t: any) => t.language === 'TR');
  if (!t) t = translations[0];

  const categories = celebrity.categories?.map((cat: any) => {
    const catTrans = cat.translations || [];
    let ct = catTrans.find((t: any) => t.language === lang);
    if (!ct) ct = catTrans.find((t: any) => t.language === 'EN');
    if (!ct) ct = catTrans.find((t: any) => t.language === 'TR');
    if (!ct) ct = catTrans[0];

    return {
      ...cat,
      name: ct?.name || cat.name,
      slug: ct?.slug || cat.slug,
      description: ct?.description || cat.description
    };
  }) || [];

  // Localized FAQs Filtering
  const localizedFaqs = (celebrity.faqs || []).filter((f: any) => f.language === lang);
  // Fallback: If no localized FAQs, try EN (if lang != EN)
  const finalFaqs = localizedFaqs.length > 0 ? localizedFaqs : (
    lang !== 'EN' ? (celebrity.faqs || []).filter((f: any) => f.language === 'EN') : []
  );

  return {
    ...celebrity,
    // Name is required, fallback to legacy if absolutely necessary
    name: t?.name || celebrity.name,
    // Use translation field if it exists, otherwise fallback to legacy root field
    nickname: t ? (t.nickname || '') : (celebrity.nickname || ''),
    profession: t ? (t.profession || '') : (celebrity.profession || ''),
    slug: t ? (t.slug || '') : (celebrity.slug || ''),
    bio: t ? (t.bio || '') : (celebrity.bio || ''),
    birthPlace: t ? (t.birthPlace || '') : (celebrity.birthPlace || ''),
    nationality: t ? (t.nationality || '') : (celebrity.nationality || ''),
    zodiac: t ? (t.zodiac || '') : (celebrity.zodiac || ''),
    altText: t ? (t.altText || t.name) : (celebrity.name || ''),

    categories,
    // Keep neutral fields
    images: celebrity.images,
    image: celebrity.images?.[0]?.url || celebrity.image || null,
    socialMediaLinks: celebrity.socialMediaLinks,
    faqs: finalFaqs,
    reports: celebrity.reports,
    birthDate: celebrity.birthDate,
    gender: celebrity.gender
  };
}

// ==========================================
// PUBLIC ACTIONS
// ==========================================

export async function getCelebrityBySlug(slug: string, locale: string) {
  try {
    const translation = await prisma.celebrityTranslation.findFirst({
      where: { slug },
      select: { celebrityId: true }
    });

    let celebrityId = translation?.celebrityId;

    if (!celebrityId) {
      const legacy = await prisma.celebrity.findUnique({
        where: { slug },
        select: { id: true }
      });
      if (!legacy) return null;
      celebrityId = legacy.id;
    }

    const celebrity = await prisma.celebrity.findUnique({
      where: { id: celebrityId },
      include: {
        translations: true,
        categories: {
          include: {
            translations: true
          }
        },
        images: { orderBy: { displayOrder: 'asc' } },
        socialMediaLinks: { orderBy: { displayOrder: 'asc' } },
        faqs: { orderBy: { displayOrder: 'asc' } }
      }
    });

    if (!celebrity) return null;

    // LANGUAGE AVAILABILITY CHECK
    const normalizedLocale = getLanguage(locale);
    // STRICT LANGUAGE ISOLATION
    // As per "Ultra-Detailed Architect Specification":
    // If !celebrity.publishedLanguages.includes(locale.toUpperCase()), return null immediately.
    // This assumes the migration has run and populated the array.

    if (!celebrity.publishedLanguages.includes(normalizedLocale)) {
        return null;
    }

    return mapCelebrityToDTO(celebrity, locale);
  } catch (error) {
    console.error('getCelebrityBySlug error:', error);
    return null;
  }
}

interface SearchCelebritiesParams {
  query?: string
  categorySlug?: string
  limit?: number
  locale: string
}

export async function searchCelebrities({
  query = '',
  categorySlug,
  limit = 10,
  locale
}: SearchCelebritiesParams) {
  try {
    const langEnum = locale.toUpperCase() as Language;

    const where: any = {
      publishedLanguages: { has: langEnum }
    };

    if (query) {
      where.OR = [
        {
          translations: {
            some: {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { profession: { contains: query, mode: 'insensitive' } },
                { bio: { contains: query, mode: 'insensitive' } },
              ]
            }
          }
        },
        // Fallback for non-migrated data (only if names match)
        { name: { contains: query, mode: 'insensitive' } }
      ];
    }

    if (categorySlug) {
      where.categories = {
        some: {
          translations: {
            some: {
              slug: categorySlug
            }
          }
        }
      };
    }

    const celebrities = await prisma.celebrity.findMany({
      where,
      take: limit,
      include: {
        translations: true,
        categories: { include: { translations: true } },
        images: { orderBy: { displayOrder: 'asc' } }
      }
    });

    return {
      success: true,
      data: celebrities.map(c => {
        const dto = mapCelebrityToDTO(c, locale)
        dto.image = c.images && c.images.length > 0 ? c.images[0].url : (c.image || null)
        return dto
      })
    };
  } catch (error) {
    console.error('Search celebrities error:', error);
    return { success: false, error: 'Arama yapılamadı' };
  }
}

export async function getUniqueNationalities() {
  try {
    const results = await prisma.celebrityTranslation.findMany({
      where: {
        nationality: { not: null }
      },
      select: {
        nationality: true
      },
      distinct: ['nationality'],
      orderBy: {
        nationality: 'asc'
      }
    });

    const nationalities = results
      .map(r => r.nationality)
      .filter((n): n is string => n !== null && n.trim() !== '');

    return { success: true, data: nationalities };
  } catch (error) {
    console.error('Get unique nationalities error:', error);
    return { success: false, error: 'Uyruklar alınamadı' };
  }
}

// ==========================================
// ADMIN ACTIONS
// ==========================================

export async function createCelebrity(rawData: unknown) {
  try {
    // 1. Validation
    const result = CelebritySchema.safeParse(rawData);
    if (!result.success) {
      console.dir(result.error.format(), { depth: null });
      return { success: false, error: 'Validation Failed', details: result.error.format() };
    }
    const { common, translations } = result.data;

    // Auto-Calculate Zodiac
    let zodiac = ''
    if (common.birthDate) {
      const date = new Date(common.birthDate)
      zodiac = getZodiacSign(date)
    }

    // 2. Transaction
    const celebrity = await prisma.$transaction(async (tx) => {
      // PREPARE ROOT DATA
      const enData = translations['EN'];
      const primaryData = enData || (Object.values(translations)[0] as any);

      const rootName = primaryData?.name || 'Unknown';
      const rootBio = primaryData?.bio || '';
      const rootProfession = primaryData?.profession || '';
      const rootNickname = primaryData?.nickname || '';
      const rootBirthPlace = primaryData?.birthPlace || '';
      const rootNationality = primaryData?.nationality || '';

      // A. Create Neutral Entity
      const created = await tx.celebrity.create({
        data: {
          birthDate: common.birthDate ? new Date(common.birthDate) : null,
          gender: common.gender,
          zodiac: zodiac,
          name: rootName,
          bio: rootBio,
          profession: rootProfession,
          nickname: rootNickname,
          birthPlace: rootBirthPlace,
          nationality: rootNationality,
          slug: `${Date.now()}-temp`,
          publishedLanguages: common.publishedLanguages || [],
          categories: {
            connect: common.categoryIds.map(id => ({ id }))
          },
          images: {
            create: common.images.map(img => ({
              url: img.url,
              isMain: img.isMain || false,
              displayOrder: img.displayOrder || 0
            }))
          },
          socialMediaLinks: {
            create: common.socialLinks?.map(l => ({
              platform: l.platform,
              url: l.url,
              displayOrder: l.displayOrder || 0
            }))
          }
          // NO FAQ Create for Common - Handled in translation Loop
        }
      });

      // B. Create Translations
      for (const [lang, data] of Object.entries(translations)) {
        if (!data) continue;

        const language = lang.toUpperCase() as Language;
        if (!Object.values(Language).includes(language)) continue;

        const slug = data.slug || await generateUniqueSlug(data.name, language);

        await tx.celebrityTranslation.create({
          data: {
            celebrityId: created.id,
            language,
            name: data.name,
            bio: data.bio,
            profession: data.profession,
            nickname: data.nickname,
            birthPlace: data.birthPlace,
            nationality: data.nationality,
            zodiac: zodiac,
            slug,
            altText: data.altText
          }
        })

        // B2. Create FAQs for this language
        if (data.faqs && data.faqs.length > 0) {
          await tx.fAQ.createMany({
            data: data.faqs.map((f, idx) => ({
              celebrityId: created.id,
              language: language,
              question: f.question,
              answer: f.answer,
              displayOrder: idx
            }))
          });
        }

        // Update Legacy Slug
        if (language === 'EN' || (language === primaryData.language)) {
          await tx.celebrity.update({ where: { id: created.id }, data: { slug } });
        }
      }

      return created;
    });

    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true, data: celebrity };

  } catch (error) {
    console.error('Create Celebrity Error:', error);
    return { success: false, error: 'Sistem hatası oluştu.' };
  }
}

export async function updateCelebrity(id: string, rawData: unknown) {
  try {
    // 1. Validation
    const result = CelebritySchema.safeParse(rawData);
    if (!result.success) {
      console.dir(result.error.format(), { depth: null });
      return { success: false, error: 'Validation Failed', details: result.error.format() };
    }
    const { common, translations } = result.data;

    // Auto-Calculate Zodiac
    let zodiac = ''
    if (common.birthDate) {
      const date = new Date(common.birthDate)
      zodiac = getZodiacSign(date)
    }

    // 2. Transaction
    await prisma.$transaction(async (tx) => {
      // A. Update Neutral Fields
      await tx.celebrity.update({
        where: { id },
        data: {
          birthDate: common.birthDate ? new Date(common.birthDate) : null,
          gender: common.gender,
          zodiac: zodiac,
          publishedLanguages: common.publishedLanguages || [],
          categories: {
            set: common.categoryIds.map(cid => ({ id: cid }))
          }
        }
      });

      // B. Update Relations
      await tx.celebrityImage.deleteMany({ where: { celebrityId: id } });
      if (common.images.length > 0) {
        await tx.celebrityImage.createMany({
          data: common.images.map(img => ({
            celebrityId: id,
            url: img.url,
            isMain: img.isMain || false,
            displayOrder: img.displayOrder || 0
          }))
        });
      }

      if (common.socialLinks) {
        await tx.socialMediaLink.deleteMany({ where: { celebrityId: id } });
        if (common.socialLinks.length > 0) {
          await tx.socialMediaLink.createMany({
            data: common.socialLinks.map(l => ({
              celebrityId: id,
              platform: l.platform,
              url: l.url,
              displayOrder: l.displayOrder || 0
            }))
          });
        }
      }

      // FAQs removed from common loop. They are handled per language below.

      // C. Upsert Translations
      for (const [lang, data] of Object.entries(translations)) {
        if (!data) continue;
        const language = lang.toUpperCase() as Language;
        if (!Object.values(Language).includes(language)) continue;

        let slug = data.slug;
        if (!slug) slug = await generateUniqueSlug(data.name, language, id);

        await tx.celebrityTranslation.upsert({
          where: {
            celebrityId_language: { celebrityId: id, language }
          },
          update: {
            name: data.name,
            bio: data.bio,
            profession: data.profession,
            nickname: data.nickname,
            birthPlace: data.birthPlace,
            nationality: data.nationality,
            zodiac: zodiac,
            slug,
            altText: data.altText
          },
          create: {
            celebrityId: id,
            language,
            name: data.name,
            bio: data.bio,
            profession: data.profession,
            nickname: data.nickname,
            birthPlace: data.birthPlace,
            nationality: data.nationality,
            zodiac: zodiac,
            slug,
            altText: data.altText
          }
        });

        // FAQ Update for this Language (Delete & Recreate for this language only)
        if (data.faqs) {
          await tx.fAQ.deleteMany({
            where: {
              celebrityId: id,
              language: language
            }
          });

          if (data.faqs.length > 0) {
            await tx.fAQ.createMany({
              data: data.faqs.map((f, idx) => ({
                celebrityId: id,
                language: language,
                question: f.question,
                answer: f.answer,
                displayOrder: idx
              }))
            });
          }
        }

        // CRITICAL SYNC: Update Root Legacy Fields if EN
        if (language === 'EN') {
          console.log(`Syncing EN translation to Root Celebrity for ID: ${id}`);
          await tx.celebrity.update({
            where: { id },
            data: {
              name: data.name,
              bio: data.bio,
              profession: data.profession,
              slug: slug,
              nickname: data.nickname,
              birthPlace: data.birthPlace,
              nationality: data.nationality
            }
          });
        }
      }
    });

    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true };

  } catch (error) {
    console.error('Update Celebrity Error:', error);
    return { success: false, error: 'Güncelleme başarısız.' };
  }
}

export async function deleteCelebrity(id: string) {
  try {
    const celebrity = await prisma.celebrity.delete({
      where: { id }
    })
    revalidatePath('/admin')
    revalidatePath('/')
    return { success: true, data: celebrity }
  } catch (error) {
    console.error('Delete celebrity error:', error)
    return { success: false, error: 'Ünlü silinemedi' }
  }
}

export async function searchCelebritiesAdmin({
  query = '',
  limit = 50,
  page = 1
}: any) {
  try {
    const where: any = {}

    if (query) {
      where.OR = [
        {
          translations: {
            some: {
              name: { contains: query, mode: 'insensitive' }
            }
          }
        },
        // Fallback for Admin search too to match legacy names
        { name: { contains: query, mode: 'insensitive' } }
      ]
    }

    const skip = (page - 1) * limit
    const [celebrities, total] = await Promise.all([
      prisma.celebrity.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          translations: true,
          categories: true,
          images: true,
          _count: {
            select: {
              reports: {
                where: { status: 'PENDING' }
              }
            }
          }
        }
      }),
      prisma.celebrity.count({ where })
    ])

    return {
      success: true,
      data: {
        celebrities,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    }
  } catch (error) {
    console.error('Search Admin Error:', error)
    return { success: false, error: 'Arama başarısız' }
  }
}