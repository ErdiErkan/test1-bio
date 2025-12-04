import { Suspense } from 'react'
import Link from 'next/link'
import AdvancedSearch from '@/components/search/AdvancedSearch'
import CelebrityGrid from '@/components/home/CelebrityGrid'
import { prisma } from '@/lib/db'
import { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'CelebHub - Ünlü Biyografileri',
  description: 'Favori ünlülerinizin hayat hikayelerini keşfedin. Detaylı biyografiler, kariyer bilgileri ve daha fazlası.',
}

// Arama parametreleri için tip tanımı
interface SearchParamsProps {
  search?: string
  categorySlug?: string
  nationality?: string
  birthYear?: string
  zodiac?: string
}

async function getCelebrities({ search, categorySlug, nationality, birthYear, zodiac }: SearchParamsProps) {
  try {
    const where: any = {}

    // 1. Arama query'si
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { profession: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } }
      ]
    }

    // 2. Kategori filtresi
    if (categorySlug) {
      where.categories = {
        some: {
          slug: categorySlug
        }
      }
    }

    // 3. Uyruk Filtresi
    if (nationality) {
      where.nationality = nationality
    }

    // 4. Burç Filtresi (Veritabanına 'zodiac' alanı eklendiyse)
    if (zodiac) {
      where.zodiac = zodiac
    }

    // 5. Doğum Yılı Filtresi
    if (birthYear) {
      const year = parseInt(birthYear)
      if (!isNaN(year)) {
        const startDate = new Date(`${year}-01-01`)
        const endDate = new Date(`${year}-12-31`)
        
        where.birthDate = {
          gte: startDate,
          lte: endDate
        }
      }
    }

    const celebrities = await prisma.celebrity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: {
        id: true,
        name: true,
        profession: true,
        birthDate: true,
        image: true,
        slug: true,
        // zodiac: true, // İsterseniz burç bilgisini de çekebilirsiniz
      }
    })
    return celebrities
  } catch (error) {
    console.error('Database error fetching celebrities:', error)
    return []
  }
}

async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
      }
    })
    return categories
  } catch (error) {
    console.error('Database error fetching categories:', error)
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

// Wrapper bileşeni: Parametreleri alır ve başlığı dinamik ayarlar
async function CelebritiesWrapper({ 
  search, 
  category, 
  nationality, 
  birthYear,
  zodiac 
}: SearchParamsProps & { category?: string }) {
  
  const celebrities = await getCelebrities({ 
    search, 
    categorySlug: category, 
    nationality, 
    birthYear,
    zodiac 
  })

  // Başlık mantığı
  let title = "Son Eklenen Ünlüler"
  
  if (search) title = `"${search}" için sonuçlar`
  else if (category) title = `Kategori: ${category}`
  else if (nationality) title = `Uyruk: ${nationality}`
  else if (birthYear) title = `Doğum Yılı: ${birthYear}`
  else if (zodiac) title = `Burç: ${zodiac.charAt(0).toUpperCase() + zodiac.slice(1)}`

  if (celebrities.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">
          Sonuç Bulunamadı
        </h2>
        <p className="text-gray-500 mb-6">
          Aradığınız kriterlere uygun ünlü bulunamadı.
        </p>
        <Link
          href="/"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors"
        >
          Tüm Ünlüleri Görüntüle
        </Link>
      </div>
    )
  }

  return <CelebrityGrid celebrities={celebrities} title={title} />
}

// Sayfa Props Tanımı
interface HomePageProps {
  searchParams: Promise<{ 
    q?: string; 
    category?: string;
    nationality?: string;
    birthYear?: string;
    zodiac?: string;
  }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams
  
  // URL parametrelerini alıyoruz
  const search = params?.q
  const category = params?.category
  const nationality = params?.nationality
  const birthYear = params?.birthYear
  const zodiac = params?.zodiac

  const categories = await getCategories()

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Ünlü Biyografilerini Keşfet
            </h1>
            <p className="text-xl text-blue-100">
              Favori ünlülerinin hayat hikayelerini öğren
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <AdvancedSearch categories={categories} />
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Suspense fallback={<LoadingGrid />}>
          <CelebritiesWrapper 
            search={search} 
            category={category} 
            nationality={nationality}
            birthYear={birthYear}
            zodiac={zodiac}
          />
        </Suspense>
      </section>
    </div>
  )
}