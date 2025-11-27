import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/search?q=query - Basit arama
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query || query.trim() === '') {
      return NextResponse.json([])
    }

    const celebrities = await prisma.celebrity.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            profession: {
              contains: query,
              mode: 'insensitive'
            }
          }
        ]
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(celebrities)
  } catch (error) {
    console.error('Error searching celebrities:', error)
    return NextResponse.json(
      { error: 'Arama yapılırken bir hata oluştu' },
      { status: 500 }
    )
  }
}
