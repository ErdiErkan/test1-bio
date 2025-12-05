import { NextRequest, NextResponse } from 'next/server'
import { searchCelebritiesAdmin } from '@/actions/celebrities'
import type { DataQualityFilter } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    const query = searchParams.get('q') || ''
    const categorySlug = searchParams.get('category') || undefined
    const nationality = searchParams.get('nationality') || undefined
    const dataQuality = searchParams.get('dataQuality') as DataQualityFilter | undefined
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const result = await searchCelebritiesAdmin({
      query,
      categorySlug,
      nationality,
      dataQuality,
      page,
      limit
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Arama yapılamadı' },
        { status: 500 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Admin search API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
