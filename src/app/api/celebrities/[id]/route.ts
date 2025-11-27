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
    const body = await request.json()
    const { name, profession, birthDate, birthPlace, bio, image } = body

    const existing = await prisma.celebrity.findUnique({
      where: { id: params.id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Ünlü bulunamadı' },
        { status: 404 }
      )
    }

    // İsim değiştiyse yeni slug oluştur
    const slug = name && name !== existing.name ? slugify(name) : existing.slug

    const celebrity = await prisma.celebrity.update({
      where: { id: params.id },
      data: {
        name,
        profession,
        birthDate: birthDate ? new Date(birthDate) : null,
        birthPlace,
        bio,
        image,
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
    await prisma.celebrity.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting celebrity:', error)
    return NextResponse.json(
      { error: 'Ünlü silinirken bir hata oluştu' },
      { status: 500 }
    )
  }
}
