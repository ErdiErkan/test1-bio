import { Suspense } from 'react'
import SearchBar from '@/components/ui/SearchBar'
import CelebrityGrid from '@/components/home/CelebrityGrid'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Celebrity listesini getir
async function getCelebrities(search?: string) {
  try {
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

    return celebrities
  } catch (error) {
    console.error('Error fetching celebrities:', error)
    return []
  }
}

// Loading komponenti
function LoadingGrid() {
  return (
    <div>
      <div className="h-8 bg-gray-200 rounded w-64 mb-6 animate-pulse"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-lg h-80 animate-pulse" />
        ))}
      </div>
    </div>
  )
}

// Celebrities wrapper komponenti
async function CelebritiesWrapper({ search }: { search?: string }) {
  const celebrities = await getCelebrities(search)
  const title = search ? `"${search}" araması için sonuçlar` : "Son Eklenen Ünlüler"

  return <CelebrityGrid celebrities={celebrities} title={title} />
}

// Ana sayfa komponenti
export default function HomePage({
  searchParams
}: {
  searchParams: { search?: string }
}) {
  const search = searchParams?.search

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            ⭐ Ünlü Biyografilerini Keşfet
          </h1>
          <p className="text-xl mb-8 text-blue-100">
            Favori ünlülerinin hayat hikayelerini öğren
          </p>
          <SearchBar placeholder="Hangi ünlüyü arıyorsun?" />
        </div>
      </section>

      {/* Content Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Suspense fallback={<LoadingGrid />}>
          <CelebritiesWrapper search={search} />
        </Suspense>
      </section>
    </div>
  )
}
