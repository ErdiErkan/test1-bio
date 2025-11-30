import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

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

// ============================================
// GET /api/celebrities
// ============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12')))
    const search = searchParams.get('search')?.trim() || undefined

    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { profession: { contains: search, mode: 'insensitive' as const } },
        { bio: { contains: search, mode: 'insensitive' as const } },
      ]
    } : {}

    const celebrities = await prisma.celebrity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    // Admin sayfası Array.isArray() kontrolü yapıyor
    // Doğrudan array döndür!
    return NextResponse.json(celebrities)
  } catch (error) {
    console.error('GET /api/celebrities error:', error)
    return NextResponse.json([], { status: 500 })
  }
}

// ============================================
// POST /api/celebrities
// ============================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: 'İsim alanı zorunludur' },
        { status: 400 }
      )
    }

    const name = body.name.trim()
    
    let slug = createSlug(name)
    let slugSuffix = 0
    
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
        name,
        profession: body.profession?.trim() || null,
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
        birthPlace: body.birthPlace?.trim() || null,
        bio: body.bio?.trim() || null,
        image: body.image?.trim() || null,
        slug,
      }
    })

    return NextResponse.json(celebrity, { status: 201 })
  } catch (error) {
    console.error('POST /api/celebrities error:', error)
    return NextResponse.json(
      { error: 'Ünlü eklenirken hata oluştu' },
      { status: 500 }
    )
  }
}
