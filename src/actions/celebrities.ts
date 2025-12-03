'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

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
    const where: any = {}

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
        }
      }
    })

    return { success: true, data: celebrities }
  } catch (error) {
    console.error('Search celebrities error:', error)
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
}) {
  try {
    if (!data.name?.trim()) {
      return { success: false, error: 'İsim alanı zorunludur' }
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

    const celebrity = await prisma.celebrity.create({
      data: {
        name: data.name.trim(),
        slug,
        nickname: data.nickname?.trim() || null,
        profession: data.profession?.trim() || null,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        birthPlace: data.birthPlace?.trim() || null,
        nationality: data.nationality?.trim() || null,
        bio: data.bio?.trim() || null,
        image: data.image?.trim() || null,
        categories: {
          connect: data.categoryIds.map(id => ({ id }))
        }
      },
      include: {
        categories: true
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
  }
) {
  try {
    if (!data.name?.trim()) {
      return { success: false, error: 'İsim alanı zorunludur' }
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

    const celebrity = await prisma.celebrity.update({
      where: { id },
      data: {
        name: data.name.trim(),
        slug,
        nickname: data.nickname?.trim() || null,
        profession: data.profession?.trim() || null,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        birthPlace: data.birthPlace?.trim() || null,
        nationality: data.nationality?.trim() || null,
        bio: data.bio?.trim() || null,
        image: data.image?.trim() || null,
        categories: {
          set: data.categoryIds.map(id => ({ id }))
        }
      },
      include: {
        categories: true
      }
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