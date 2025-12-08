'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { Language } from '@prisma/client'
import { z } from 'zod'

// --- Zod Schemas ---

const TranslationSchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional().or(z.literal('')),
  slug: z.string().optional().or(z.literal('')),
})

const CategorySchema = z.object({
  common: z.object({
    // Currently no common fields for Category, but structure preserved for consistency
  }),
  translations: z.record(z.string(), TranslationSchema.optional().nullable())
})

// --- Helpers ---

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
    const existing = await prisma.categoryTranslation.findFirst({
      where: {
        slug: checkSlug,
        language: language,
        ...(existingId ? { categoryId: { not: existingId } } : {})
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
  if (Object.values(Language).includes(normalized as Language)) {
    return normalized as Language;
  }
  const short = normalized.substring(0, 2) as Language;
  if (Object.values(Language).includes(short)) {
    return short;
  }
  return Language.EN;
}

// Helper: DTO Mapper with Root Field Preservation
function mapCategoryToDTO(category: any, locale: string) {
  const lang = getLanguage(locale);
  const translations = category.translations || [];

  // Order of preference: Requested Lang -> EN -> TR -> First Available
  let t = translations.find((t: any) => t.language === lang);
  if (!t) t = translations.find((t: any) => t.language === 'EN');
  if (!t) t = translations.find((t: any) => t.language === 'TR');
  if (!t) t = translations[0];

  return {
    ...category,
    name: t?.name || category.name, // Localized Name (or fallback to legacy)
    slug: t?.slug || category.slug,
    description: t ? (t.description || null) : (category.description || null),

    // SAFE FALLBACK FIELDS
    rootName: category.name,
    rootSlug: category.slug,
    rootDescription: category.description,
  };
}


// ==========================================
// PUBLIC ACTIONS
// ==========================================

export async function getCategories(locale: string = 'EN') {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        translations: true,
        _count: {
          select: { celebrities: true }
        }
      }
    })

    const localizedCategories = categories.map(cat => mapCategoryToDTO(cat, locale));

    return { success: true, data: localizedCategories }
  } catch (error) {
    console.error('Get categories error:', error)
    return { success: false, error: 'Kategoriler yüklenemedi' }
  }
}

// ==========================================
// ADMIN ACTIONS
// ==========================================

export async function createCategory(rawData: unknown) {
  try {
    // 1. Validation
    const result = CategorySchema.safeParse(rawData);
    if (!result.success) {
      console.dir(result.error.format(), { depth: null });
      return { success: false, error: 'Validation Failed', details: result.error.format() };
    }
    const { translations } = result.data; // common is empty

    // 2. Transaction
    const category = await prisma.$transaction(async (tx) => {
      // PREPARE ROOT DATA
      const enData = translations['EN'];
      const primaryData = enData || (Object.values(translations)[0] as any);

      const rootName = primaryData?.name || 'Unknown';
      const rootDescription = primaryData?.description || '';

      // A. Create Neutral Entity
      const created = await tx.category.create({
        data: {
          name: rootName,
          slug: `${Date.now()}-temp`, // Will be updated
          description: rootDescription,
        }
      });

      // B. Create Translations
      for (const [lang, data] of Object.entries(translations)) {
        if (!data) continue;

        const language = lang.toUpperCase() as Language;
        if (!Object.values(Language).includes(language)) continue;

        const slug = data.slug || await generateUniqueSlug(data.name, language);

        await tx.categoryTranslation.create({
          data: {
            categoryId: created.id,
            language,
            name: data.name,
            slug,
            description: data.description,
          }
        })

        // CRITICAL: Update Legacy/Root Record if English
        if (language === 'EN' || (language === primaryData.language)) {
          await tx.category.update({
            where: { id: created.id },
            data: { slug, name: data.name, description: data.description || null }
          });
        }
      }

      return created;
    });

    revalidatePath('/admin/categories');
    return { success: true, data: category };

  } catch (error) {
    console.error('Create category error:', error);
    return { success: false, error: 'Kategori oluşturulamadı' };
  }
}

export async function updateCategory(id: string, rawData: unknown) {
  try {
    // 1. Validation
    const result = CategorySchema.safeParse(rawData);
    if (!result.success) {
      console.dir(result.error.format(), { depth: null });
      return { success: false, error: 'Validation Failed', details: result.error.format() };
    }
    const { translations } = result.data;

    // 2. Transaction
    await prisma.$transaction(async (tx) => {

      // Upsert Translations
      for (const [lang, data] of Object.entries(translations)) {
        if (!data) continue;
        const language = lang.toUpperCase() as Language;
        if (!Object.values(Language).includes(language)) continue;

        let slug = data.slug;
        if (!slug) slug = await generateUniqueSlug(data.name, language, id);

        await tx.categoryTranslation.upsert({
          where: {
            categoryId_language: { categoryId: id, language }
          },
          update: {
            name: data.name,
            slug,
            description: data.description,
          },
          create: {
            categoryId: id,
            language,
            name: data.name,
            slug,
            description: data.description,
          }
        });

        // CRITICAL SYNC: Strict Bi-Directional Sync for English
        // FORCE ROOT SYNC
        if (language === 'EN') {
          console.log('Syncing Category Root to EN:', slug);
          await tx.category.update({
            where: { id },
            data: {
              name: data.name,
              slug: slug, // Updates URL
              description: data.description || null,
            }
          });
        }
      }
    });

    revalidatePath('/', 'layout'); // Aggressive Revalidation
    return { success: true };

  } catch (error) {
    console.error('Update category error:', error);
    return { success: false, error: 'Kategori güncellenemedi' };
  }
}

export async function deleteCategory(id: string) {
  try {
    await prisma.category.delete({
      where: { id }
    })

    revalidatePath('/admin/categories')
    return { success: true }
  } catch (error) {
    console.error('Delete category error:', error)
    return { success: false, error: 'Kategori silinemedi' }
  }
}
