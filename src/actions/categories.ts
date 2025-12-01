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

export async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { celebrities: true }
        }
      }
    })

    return { success: true, data: categories }
  } catch (error) {
    console.error('Get categories error:', error)
    return { success: false, error: 'Kategoriler yüklenemedi' }
  }
}

export async function createCategory(formData: FormData) {
  try {
    const name = formData.get('name') as string
    const description = formData.get('description') as string

    if (!name?.trim()) {
      return { success: false, error: 'Kategori adı zorunludur' }
    }

    const slug = createSlug(name)

    // Slug kontrolü
    const existing = await prisma.category.findUnique({
      where: { slug }
    })

    if (existing) {
      return { success: false, error: 'Bu isimde bir kategori zaten mevcut' }
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug,
        description: description?.trim() || null,
      }
    })

    revalidatePath('/admin/categories')
    return { success: true, data: category }
  } catch (error) {
    console.error('Create category error:', error)
    return { success: false, error: 'Kategori oluşturulamadı' }
  }
}

export async function updateCategory(id: string, formData: FormData) {
  try {
    const name = formData.get('name') as string
    const description = formData.get('description') as string

    if (!name?.trim()) {
      return { success: false, error: 'Kategori adı zorunludur' }
    }

    const slug = createSlug(name)

    // Slug kontrolü (kendisi hariç)
    const existing = await prisma.category.findUnique({
      where: { slug }
    })

    if (existing && existing.id !== id) {
      return { success: false, error: 'Bu isimde bir kategori zaten mevcut' }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: name.trim(),
        slug,
        description: description?.trim() || null,
      }
    })

    revalidatePath('/admin/categories')
    return { success: true, data: category }
  } catch (error) {
    console.error('Update category error:', error)
    return { success: false, error: 'Kategori güncellenemedi' }
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
