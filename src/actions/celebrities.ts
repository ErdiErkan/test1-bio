'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { calculateZodiac } from '@/lib/celebrity'
import type { SocialPlatform, DataQualityFilter } from '@/lib/types'

// Social Link Input type for server actions
interface SocialLinkInput {
  platform: SocialPlatform
  url: string
  displayOrder?: number
}

// Image Input type for server actions
interface ImageInput {
  url: string
  isMain?: boolean
  displayOrder?: number
}

// FAQ Input type for server actions
interface FAQInput {
  question: string
  answer: string
  displayOrder?: number
}

// Slug oluşturma fonksiyonu
function createSlug(text: string): string {
  const turkishMap: Record<string, string> = {
    'ç': 'c', 'Ç': 'C',
    'ğ': 'g', 'Ğ': 'G',
    'ı': 'i', 'I': 'I',
    'İ': 'I',
    'ö': 'o', 'Ö': 'O',
    'ş': 's', 'Ş': 'S',
    'ü': 'u', 'Ü': 'U',
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

interface SearchCelebritiesParams {
  query?: string
  categorySlug?: string
  limit?: number
}

export async function searchCelebrities({
  query = '',
  categorySlug,
  limit = 10
}: SearchCelebritiesParams) {
  try {
    const where: Record<string, unknown> = {}

    // Arama query'si
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' as const } },
        { profession: { contains: query, mode: 'insensitive' as const } },
        { bio: { contains: query, mode: 'insensitive' as const } },
      ]
    }

    // Kategori filtresi
    if (categorySlug) {
      where.categories = {
        some: {
          slug: categorySlug
        }
      }
    }

    const celebrities = await prisma.celebrity.findMany({
      where,
      take: limit,
      orderBy: { name: 'asc' },
      include: {
        categories: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        },
        images: {
          orderBy: { displayOrder: 'asc' }
        }
      }
    })

    return { success: true, data: celebrities }
  } catch (error) {
    console.error('Search celebrities error:', error)
    return { success: false, error: 'Arama yapılamadı' }
  }
}

// Admin search with advanced filters
interface AdminSearchParams {
  query?: string
  categorySlug?: string
  nationality?: string
  dataQuality?: DataQualityFilter
  limit?: number
  page?: number
}

export async function searchCelebritiesAdmin({
  query = '',
  categorySlug,
  nationality,
  dataQuality,
  limit = 50,
  page = 1
}: AdminSearchParams) {
  try {
    const where: Record<string, unknown> = {}

    // Text search
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' as const } },
        { profession: { contains: query, mode: 'insensitive' as const } },
      ]
    }

    // Category filter
    if (categorySlug) {
      where.categories = {
        some: {
          slug: categorySlug
        }
      }
    }

    // Nationality filter
    if (nationality) {
      where.nationality = nationality
    }

    // Data quality filters
    if (dataQuality) {
      switch (dataQuality) {
        case 'no_bio':
          where.OR = [
            { bio: null },
            { bio: '' }
          ]
          break
        case 'no_image':
          where.AND = [
            {
              OR: [
                { image: null },
                { image: '' }
              ]
            },
            {
              images: { none: {} }
            }
          ]
          break
        case 'has_pending_reports':
          where.reports = {
            some: {
              status: 'PENDING'
            }
          }
          break
        case 'no_faqs':
          where.faqs = { none: {} }
          break
      }
    }

    const skip = (page - 1) * limit

    const [celebrities, total] = await Promise.all([
      prisma.celebrity.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          categories: {
            select: {
              id: true,
              name: true,
              slug: true,
            }
          },
          images: {
            orderBy: { displayOrder: 'asc' }
          },
          faqs: {
            orderBy: { displayOrder: 'asc' }
          },
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
    console.error('Admin search celebrities error:', error)
    return { success: false, error: 'Arama yapılamadı' }
  }
}

export async function createCelebrity(data: {
  name: string
  nickname?: string
  profession?: string
  birthDate?: string
  birthPlace?: string
  nationality?: string
  bio?: string
  image?: string
  categoryIds: string[]
  socialLinks?: SocialLinkInput[]
  images?: ImageInput[]
  faqs?: FAQInput[]
}) {
  try {
    if (!data.name?.trim()) {
      return { success: false, error: 'İsim alanı zorunludur' }
    }

    // Zodiac (Burç) Hesaplama
    let zodiac = null
    if (data.birthDate) {
      const zInfo = calculateZodiac(data.birthDate)
      if (zInfo) zodiac = zInfo.sign
    }

    // Slug oluştur
    let slug = createSlug(data.name)
    let slugSuffix = 0

    // Benzersiz slug kontrolü
    while (true) {
      const checkSlug = slugSuffix > 0 ? `${slug}-${slugSuffix}` : slug
      const existing = await prisma.celebrity.findUnique({
        where: { slug: checkSlug }
      })

      if (!existing) {
        slug = checkSlug
        break
      }
      slugSuffix++
    }

    // Determine main image URL for backward compatibility
    const mainImageUrl = data.images && data.images.length > 0
      ? data.images.find(img => img.isMain)?.url || data.images[0]?.url
      : data.image?.trim() || null

    const celebrity = await prisma.celebrity.create({
      data: {
        name: data.name.trim(),
        slug,
        nickname: data.nickname?.trim() || null,
        profession: data.profession?.trim() || null,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        zodiac,
        birthPlace: data.birthPlace?.trim() || null,
        nationality: data.nationality?.trim() || null,
        bio: data.bio?.trim() || null,
        image: mainImageUrl, // For backward compatibility
        categories: {
          connect: data.categoryIds.map(id => ({ id }))
        },
        // Social Media Links - nested create
        ...(data.socialLinks && data.socialLinks.length > 0 && {
          socialMediaLinks: {
            create: data.socialLinks.map((link, index) => ({
              platform: link.platform,
              url: link.url.trim(),
              displayOrder: link.displayOrder ?? index
            }))
          }
        }),
        // Images - nested create (max 3)
        ...(data.images && data.images.length > 0 && {
          images: {
            create: data.images.slice(0, 3).map((img, index) => ({
              url: img.url.trim(),
              isMain: index === 0 ? true : (img.isMain ?? false),
              displayOrder: img.displayOrder ?? index
            }))
          }
        }),
        // FAQs - nested create
        ...(data.faqs && data.faqs.length > 0 && {
          faqs: {
            create: data.faqs
              .filter(faq => faq.question.trim() && faq.answer.trim())
              .map((faq, index) => ({
                question: faq.question.trim(),
                answer: faq.answer.trim(),
                displayOrder: faq.displayOrder ?? index
              }))
          }
        })
      },
      include: {
        categories: true,
        socialMediaLinks: {
          orderBy: { displayOrder: 'asc' }
        },
        images: {
          orderBy: { displayOrder: 'asc' }
        },
        faqs: {
          orderBy: { displayOrder: 'asc' }
        }
      }
    })

    revalidatePath('/admin')
    revalidatePath('/')
    return { success: true, data: celebrity }
  } catch (error) {
    console.error('Create celebrity error:', error)
    return { success: false, error: 'Ünlü eklenemedi' }
  }
}

export async function updateCelebrity(
  id: string,
  data: {
    name: string
    nickname?: string
    profession?: string
    birthDate?: string
    birthPlace?: string
    nationality?: string
    bio?: string
    image?: string
    categoryIds: string[]
    socialLinks?: SocialLinkInput[]
    images?: ImageInput[]
    faqs?: FAQInput[]
  }
) {
  try {
    if (!data.name?.trim()) {
      return { success: false, error: 'İsim alanı zorunludur' }
    }

    // Zodiac (Burç) Hesaplama
    let zodiac = null
    if (data.birthDate) {
      const zInfo = calculateZodiac(data.birthDate)
      if (zInfo) zodiac = zInfo.sign
    }

    // Mevcut ünlüyü al
    const existing = await prisma.celebrity.findUnique({
      where: { id },
      include: { categories: true }
    })

    if (!existing) {
      return { success: false, error: 'Ünlü bulunamadı' }
    }

    // İsim değiştiyse slug'ı güncelle
    let slug = existing.slug
    if (existing.name !== data.name.trim()) {
      slug = createSlug(data.name)
      let slugSuffix = 0

      while (true) {
        const checkSlug = slugSuffix > 0 ? `${slug}-${slugSuffix}` : slug
        const slugExists = await prisma.celebrity.findUnique({
          where: { slug: checkSlug }
        })

        if (!slugExists || slugExists.id === id) {
          slug = checkSlug
          break
        }
        slugSuffix++
      }
    }

    // Determine main image URL for backward compatibility
    const mainImageUrl = data.images && data.images.length > 0
      ? data.images.find(img => img.isMain)?.url || data.images[0]?.url
      : data.image?.trim() || null

    // Transaction ile atomik işlem garantisi
    const celebrity = await prisma.$transaction(async (tx) => {
      // Mevcut sosyal medya linklerini sil
      await tx.socialMediaLink.deleteMany({
        where: { celebrityId: id }
      })

      // Mevcut resimleri sil
      await tx.celebrityImage.deleteMany({
        where: { celebrityId: id }
      })

      // Mevcut FAQ'ları sil
      await tx.fAQ.deleteMany({
        where: { celebrityId: id }
      })

      // Celebrity'yi güncelle ve yeni ilişkili verileri oluştur
      return tx.celebrity.update({
        where: { id },
        data: {
          name: data.name.trim(),
          slug,
          nickname: data.nickname?.trim() || null,
          profession: data.profession?.trim() || null,
          birthDate: data.birthDate ? new Date(data.birthDate) : null,
          zodiac,
          birthPlace: data.birthPlace?.trim() || null,
          nationality: data.nationality?.trim() || null,
          bio: data.bio?.trim() || null,
          image: mainImageUrl, // For backward compatibility
          categories: {
            set: data.categoryIds.map(categoryId => ({ id: categoryId }))
          },
          // Yeni sosyal medya linklerini oluştur
          ...(data.socialLinks && data.socialLinks.length > 0 && {
            socialMediaLinks: {
              create: data.socialLinks.map((link, index) => ({
                platform: link.platform,
                url: link.url.trim(),
                displayOrder: link.displayOrder ?? index
              }))
            }
          }),
          // Yeni resimleri oluştur (max 3)
          ...(data.images && data.images.length > 0 && {
            images: {
              create: data.images.slice(0, 3).map((img, index) => ({
                url: img.url.trim(),
                isMain: index === 0 ? true : (img.isMain ?? false),
                displayOrder: img.displayOrder ?? index
              }))
            }
          }),
          // Yeni FAQ'ları oluştur
          ...(data.faqs && data.faqs.length > 0 && {
            faqs: {
              create: data.faqs
                .filter(faq => faq.question.trim() && faq.answer.trim())
                .map((faq, index) => ({
                  question: faq.question.trim(),
                  answer: faq.answer.trim(),
                  displayOrder: faq.displayOrder ?? index
                }))
            }
          })
        },
        include: {
          categories: true,
          socialMediaLinks: {
            orderBy: { displayOrder: 'asc' }
          },
          images: {
            orderBy: { displayOrder: 'asc' }
          },
          faqs: {
            orderBy: { displayOrder: 'asc' }
          }
        }
      })
    })

    revalidatePath('/admin')
    revalidatePath('/')
    revalidatePath(`/celebrity/${celebrity.slug}`)
    return { success: true, data: celebrity }
  } catch (error) {
    console.error('Update celebrity error:', error)
    return { success: false, error: 'Ünlü güncellenemedi' }
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

// Get all unique nationalities for filter dropdown
export async function getUniqueNationalities() {
  try {
    const celebrities = await prisma.celebrity.findMany({
      where: {
        nationality: { not: null }
      },
      select: {
        nationality: true
      },
      distinct: ['nationality']
    })

    const nationalities = celebrities
      .map(c => c.nationality)
      .filter((n): n is string => n !== null)
      .sort()

    return { success: true, data: nationalities }
  } catch (error) {
    console.error('Get nationalities error:', error)
    return { success: false, error: 'Uyruklar alınamadı' }
  }
}
