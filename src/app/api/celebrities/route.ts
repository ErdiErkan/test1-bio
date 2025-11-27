import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { slugify } from '@/lib/utils'

// GET /api/celebrities - Tüm ünlüleri listele (pagination desteği ile)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const skip = (page - 1) * limit

    const where = search ? {
      OR: [
        {
          name: {
            contains: search,
            mode: 'insensitive' as const
          }
        },
        {
          profession: {
            contains: search,
            mode: 'insensitive' as const
          }
        }
      ]
    } : {}

    const [celebrities, total] = await Promise.all([
      prisma.celebrity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.celebrity.count({ where })
    ])

    return NextResponse.json({
      celebrities,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching celebrities:', error)
    return NextResponse.json(
      { error: 'Ünlüler yüklenirken bir hata oluştu' },
      { status: 500 }
    )
  }
}

// POST /api/celebrities - Yeni ünlü ekle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, profession, birthDate, birthPlace, bio, image } = body

    // Validation
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'İsim en az 2 karakter olmalıdır' },
        { status: 400 }
      )
    }

    // Slug oluştur ve uniqueness kontrol et
    let slug = slugify(name)
    const existingSlug = await prisma.celebrity.findUnique({
      where: { slug }
    })

    if (existingSlug) {
      slug = `${slug}-${Date.now()}`
    }

    // Ünlü oluştur
    const celebrity = await prisma.celebrity.create({
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

    return NextResponse.json(celebrity, { status: 201 })
  } catch (error) {
    console.error('Error creating celebrity:', error)
    return NextResponse.json(
      { error: 'Ünlü eklenirken bir hata oluştu' },
      { status: 500 }
    )
  }
}
