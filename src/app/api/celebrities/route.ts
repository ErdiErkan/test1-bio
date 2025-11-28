import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { slugify } from '@/lib/utils'

// Constants for pagination and validation
const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 12
const MAX_LIMIT = 100
const MAX_SEARCH_LENGTH = 100
const MAX_NAME_LENGTH = 255
const MAX_PROFESSION_LENGTH = 255
const MAX_BIO_LENGTH = 50000

// GET /api/celebrities - Tüm ünlüleri listele (pagination desteği ile)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.trim() || undefined

    // Validate and sanitize pagination params
    let page = parseInt(searchParams.get('page') || String(DEFAULT_PAGE))
    let limit = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT))

    // Validate pagination bounds
    if (isNaN(page) || page < 1) page = DEFAULT_PAGE
    if (isNaN(limit) || limit < 1) limit = DEFAULT_LIMIT
    if (limit > MAX_LIMIT) limit = MAX_LIMIT

    // Validate search input length
    if (search && search.length > MAX_SEARCH_LENGTH) {
      return NextResponse.json(
        { error: 'Arama terimi çok uzun' },
        { status: 400 }
      )
    }

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
        },
        {
          bio: {
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
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      }
    })
  } catch (error) {
    console.error('Error fetching celebrities:', error)
    return NextResponse.json(
      {
        error: 'Ünlüler yüklenirken bir hata oluştu',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    )
  }
}

// POST /api/celebrities - Yeni ünlü ekle
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Geçersiz JSON formatı' },
        { status: 400 }
      )
    }

    const { name, profession, birthDate, birthPlace, bio, image } = body

    // Comprehensive validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'İsim en az 2 karakter olmalıdır' },
        { status: 400 }
      )
    }

    if (name.trim().length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        { error: `İsim ${MAX_NAME_LENGTH} karakterden uzun olamaz` },
        { status: 400 }
      )
    }

    if (profession && profession.trim().length > MAX_PROFESSION_LENGTH) {
      return NextResponse.json(
        { error: `Meslek ${MAX_PROFESSION_LENGTH} karakterden uzun olamaz` },
        { status: 400 }
      )
    }

    if (bio && bio.trim().length > MAX_BIO_LENGTH) {
      return NextResponse.json(
        { error: `Biyografi ${MAX_BIO_LENGTH} karakterden uzun olamaz` },
        { status: 400 }
      )
    }

    if (birthDate) {
      const date = new Date(birthDate)
      if (isNaN(date.getTime()) || date > new Date()) {
        return NextResponse.json(
          { error: 'Geçersiz doğum tarihi' },
          { status: 400 }
        )
      }
    }

    // Slug oluştur ve uniqueness kontrol et
    let slug = slugify(name)
    const existingSlug = await prisma.celebrity.findUnique({
      where: { slug },
      select: { id: true }
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

    return NextResponse.json(celebrity, {
      status: 201,
      headers: {
        'Cache-Control': 'no-store',
      }
    })
  } catch (error) {
    console.error('Error creating celebrity:', error)

    // Handle Prisma unique constraint violations
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Bu ünlü zaten mevcut' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      {
        error: 'Ünlü eklenirken bir hata oluştu',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    )
  }
}
