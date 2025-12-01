import { Suspense } from 'react'
import Link from 'next/link'
import SearchBar from '@/components/ui/SearchBar'
import CelebrityGrid from '@/components/home/CelebrityGrid'
import { prisma } from '@/lib/db'
import { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'CelebHub - Ünlü Biyografileri',
  description: 'Favori ünlülerinizin hayat hikayelerini keşfedin. Detaylı biyografiler, kariyer bilgileri ve daha fazlası.',
}

async function getCelebrities(search?: string) {
  try {
    const celebrities = await prisma.celebrity.findMany({
      where: search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { profession: { contains: search, mode: 'insensitive' } },
          { bio: { contains: search, mode: 'insensitive' } }
        ]
      } : {},
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: {
        id: true,
        name: true,
        profession: true,
        birthDate: true,
        image: true,
        slug: true,
      }
    })
    return celebrities
  } catch (error) {
    console.error('Database error fetching celebrities:', error)
    return []
  }
}

function LoadingGrid() {
  return (
    <div>
      <div className="h-8 bg-gray-200 rounded w-64 mb-6 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-lg h-80 animate-pulse" />
        ))}
      </div>
    </div>
  )
}

async function CelebritiesWrapper({ search }: { search?: string }) {
  const celebrities = await getCelebrities(search)
  
  if (search && celebrities.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">
          Sonuç Bulunamadı
        </h2>
        <p className="text-gray-500 mb-6">
          &quot;{search}&quot; için herhangi bir ünlü bulunamadı.
        </p>
        {/* DÜZELTME: <a> etiketi <Link> ile değiştirildi */}
        <Link
          href="/"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors"
        >
          Tüm Ünlüleri Görüntüle
        </Link>
      </div>
    )
  }

  const title = search 
    ? `"${search}" için ${celebrities.length} sonuç` 
    : "Son Eklenen Ünlüler"
    
  return <CelebrityGrid celebrities={celebrities} title={title} />
}

interface HomePageProps {
  searchParams: Promise<{ search?: string }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams
  const search = params?.search

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            ⭐ Ünlü Biyografilerini Keşfet
          </h1>
          <p className="text-xl mb-8 text-blue-100">
            Favori ünlülerinin hayat hikayelerini öğren
          </p>
          <SearchBar 
            placeholder="Hangi ünlüyü arıyorsun?" 
            clearAfterSearch={false}
          />
          
          {search && (
            <div className="mt-4">
              <span className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm">
                Aranan: &quot;{search}&quot;
                {/* DÜZELTME: <a> etiketi <Link> ile değiştirildi */}
                <Link 
                  href="/" 
                  className="hover:text-yellow-300 transition-colors"
                  title="Aramayı temizle"
                >
                  ✕
                </Link>
              </span>
            </div>
          )}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Suspense fallback={<LoadingGrid />}>
          <CelebritiesWrapper search={search} />
        </Suspense>
      </section>
    </div>
  )
}
