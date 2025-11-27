import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { slugify } from '@/lib/utils'

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/celebrities/[id] - Tek ünlü getir (id veya slug ile)
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params

    // ID veya slug ile arama yap
    const celebrity = await prisma.celebrity.findFirst({
      where: {
        OR: [
          { id: id },
          { slug: id }
        ]
      }
    })

    if (!celebrity) {
      return NextResponse.json(
        { error: 'Ünlü bulunamadı' },
        { status: 404 }
      )
    }

    return NextResponse.json(celebrity)
  } catch (error) {
    console.error('Error fetching celebrity:', error)
    return NextResponse.json(
      { error: 'Ünlü yüklenirken bir hata oluştu' },
      { status: 500 }
    )
  }
}

// PUT /api/celebrities/[id] - Ünlü güncelle
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params
    const body = await request.json()
    const { name, profession, birthDate, birthPlace, bio, image } = body

    // Validation
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'İsim en az 2 karakter olmalıdır' },
        { status: 400 }
      )
    }

    // Mevcut ünlüyü kontrol et
    const existingCelebrity = await prisma.celebrity.findUnique({
      where: { id }
    })

    if (!existingCelebrity) {
      return NextResponse.json(
        { error: 'Ünlü bulunamadı' },
        { status: 404 }
      )
    }

    // Yeni slug oluştur (eğer isim değiştiyse)
    let slug = existingCelebrity.slug
    if (name.trim() !== existingCelebrity.name) {
      const newSlug = slugify(name)
      const slugExists = await prisma.celebrity.findFirst({
        where: {
          slug: newSlug,
          id: { not: id }
        }
      })

      if (!slugExists) {
        slug = newSlug
      } else {
        slug = `${newSlug}-${Date.now()}`
      }
    }

    // Ünlü güncelle
    const celebrity = await prisma.celebrity.update({
      where: { id },
      data: {
        name: name.trim(),
        profession: profession?.trim() || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        birthPlace: birthPlace?.trim() || null,
        bio: bio?.trim() || null,
        image: image?.trim() || null,
        slug
      }
    })

    return NextResponse.json(celebrity)
  } catch (error) {
    console.error('Error updating celebrity:', error)
    return NextResponse.json(
      { error: 'Ünlü güncellenirken bir hata oluştu' },
      { status: 500 }
    )
  }
}

// DELETE /api/celebrities/[id] - Ünlü sil
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params

    // Mevcut ünlüyü kontrol et
    const existingCelebrity = await prisma.celebrity.findUnique({
      where: { id }
    })

    if (!existingCelebrity) {
      return NextResponse.json(
        { error: 'Ünlü bulunamadı' },
        { status: 404 }
      )
    }

    // Ünlü sil
    await prisma.celebrity.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Ünlü başarıyla silindi' })
  } catch (error) {
    console.error('Error deleting celebrity:', error)
    return NextResponse.json(
      { error: 'Ünlü silinirken bir hata oluştu' },
      { status: 500 }
    )
  }
}
