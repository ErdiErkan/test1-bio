import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { slugify } from '@/lib/utils'

// GET /api/celebrities - Tüm ünlüleri listele
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    const celebrities = await prisma.celebrity.findMany({
      where: search ? {
        OR: [
          {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          },
          {
            profession: {
              contains: search,
              mode: 'insensitive'
            }
          }
        ]
      } : {},
      orderBy: {
        createdAt: 'desc'
      },
      take: 12 // Son 12 ünlü
    })

    return NextResponse.json(celebrities)
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

    if (!name) {
      return NextResponse.json(
        { error: 'İsim alanı zorunludur' },
        { status: 400 }
      )
    }

    const slug = slugify(name)

    // Aynı slug'a sahip ünlü var mı kontrol et
    const existing = await prisma.celebrity.findUnique({
      where: { slug }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Bu isimde bir ünlü zaten mevcut' },
        { status: 400 }
      )
    }

    const celebrity = await prisma.celebrity.create({
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

    return NextResponse.json(celebrity, { status: 201 })
  } catch (error) {
    console.error('Error creating celebrity:', error)
    return NextResponse.json(
      { error: 'Ünlü eklenirken bir hata oluştu' },
      { status: 500 }
    )
  }
}
