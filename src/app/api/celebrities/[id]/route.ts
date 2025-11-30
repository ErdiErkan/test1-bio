import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

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

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const celebrity = await prisma.celebrity.findFirst({
      where: {
        OR: [{ id }, { slug: id }]
      }
    })

    if (!celebrity) {
      return NextResponse.json({ error: 'Ünlü bulunamadı' }, { status: 404 })
    }

    return NextResponse.json(celebrity)
  } catch (error) {
    console.error('GET error:', error)
    return NextResponse.json({ error: 'Hata oluştu' }, { status: 500 })
  }
}

// PUT
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.celebrity.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Ünlü bulunamadı' }, { status: 404 })
    }

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'İsim zorunlu' }, { status: 400 })
    }

    const name = body.name.trim()
    let slug = existing.slug

    if (name !== existing.name) {
      slug = createSlug(name)
      let suffix = 0
      while (true) {
        const check = suffix > 0 ? `${slug}-${suffix}` : slug
        const exists = await prisma.celebrity.findFirst({
          where: { slug: check, NOT: { id } }
        })
        if (!exists) { slug = check; break }
        suffix++
      }
    }

    const celebrity = await prisma.celebrity.update({
      where: { id },
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

    return NextResponse.json(celebrity)
  } catch (error) {
    console.error('PUT error:', error)
    return NextResponse.json({ error: 'Hata oluştu' }, { status: 500 })
  }
}

// DELETE
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const existing = await prisma.celebrity.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Ünlü bulunamadı' }, { status: 404 })
    }

    await prisma.celebrity.delete({ where: { id } })
    return NextResponse.json({ deleted: true, id })
  } catch (error) {
    console.error('DELETE error:', error)
    return NextResponse.json({ error: 'Hata oluştu' }, { status: 500 })
  }
}
