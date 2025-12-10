import { Suspense } from 'react'
import Link from 'next/link'
import AdvancedSearch from '@/components/search/AdvancedSearch'
import CelebrityGrid from '@/components/home/CelebrityGrid'
import { prisma } from '@/lib/db'
import { Metadata } from 'next'
import { getCategories } from '@/actions/categories'
import { getTranslations } from 'next-intl/server'
import TrendingSection from '@/components/home/TrendingSection'
import TrendingSkeleton from '@/components/home/TrendingSkeleton'
import { getTrendingCelebrities } from '@/actions/analytics'

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

// Kategori nesnesi için tip tanımı
interface Category {
  id: string
  name: string
  slug: string
}

async function getCelebrities({ search, categorySlug, nationality, birthYear, zodiac, locale }: SearchParamsProps & { locale: string }) {
  try {
    const where: any = {}

    // STRICT LANGUAGE FILTERING (Phase 2 Fix)
    const langEnum = locale.toUpperCase();
    where.publishedLanguages = { has: langEnum };

    // 1. Arama query'si
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { profession: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } },
        // Çevirilerde de ara
        {
          translations: {
            some: {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { profession: { contains: search, mode: 'insensitive' } },
                { bio: { contains: search, mode: 'insensitive' } }
              ]
            }
          }
        }
      ]
    }

    // 2. Kategori filtresi
    if (categorySlug) {
      where.categories = {
        some: {
          OR: [
            { slug: categorySlug }, // Ana tablo
            {
              translations: {
                some: { slug: categorySlug } // Çeviri tablosu
              }
            }
          ]
        }
      }
    }

    // 3. Uyruk Filtresi
    if (nationality) {
      where.OR = [
        { nationality: nationality },
        { translations: { some: { nationality: nationality } } }
      ]
    }

    // 4. Burç Filtresi
    if (zodiac) {
      where.OR = [
        { zodiac: zodiac },
        { translations: { some: { zodiac: zodiac } } }
      ]
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
      include: {
        images: {
          where: { isMain: true },
          take: 1,
          select: { url: true }
        },
        translations: true
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

function mapCelebrityForCard(celebrity: any, locale: string) {
  const lang = locale.toUpperCase();
  const t = celebrity.translations?.find((t: any) => t.language === lang) ||
    celebrity.translations?.find((t: any) => t.language === 'EN') ||
    celebrity.translations?.[0];

  return {
    id: celebrity.id,
    name: t?.name || celebrity.name,
    profession: t?.profession || celebrity.profession,
    birthDate: celebrity.birthDate,
    image: celebrity.images?.[0]?.url || celebrity.image,
    slug: t?.slug || celebrity.slug
  }
}

// Wrapper bileşeni
async function CelebritiesWrapper({
  search,
  category,
  nationality,
  birthYear,
  zodiac,
  locale,
  categories // ✅ Kategoriler listesi prop olarak alındı
}: SearchParamsProps & { category?: string, locale: string, categories: Category[] }) {

  const rawCelebrities = await getCelebrities({
    search,
    categorySlug: category,
    nationality,
    birthYear,
    zodiac,
    locale
  })

  const celebrities = rawCelebrities.map(c => mapCelebrityForCard(c, locale));

  // ✅ Çevirileri sunucudan alıyoruz
  const tCommon = await getTranslations('common');
  const tCelebrity = await getTranslations('celebrity');

  // Başlık mantığı (Dinamik ve Çevirili)
  let title = locale === 'tr' ? "Son Eklenen Ünlüler" : "Latest Added Celebrities";

  if (search) {
    title = locale === 'tr' ? `"${search}" için sonuçlar` : `Results for "${search}"`;
  }
  else if (category) {
    // Slug'a karşılık gelen kategori ismini bul (Doğru dil için)
    const catObj = categories.find(c => c.slug === category);
    const catName = catObj ? catObj.name : (category.charAt(0).toUpperCase() + category.slice(1));

    // "Kategori: X" formatını yerelleştir
    title = `${tCommon('category')}: ${catName}`;
  }
  else if (nationality) {
    title = `${tCommon('nationality')}: ${nationality}`;
  }
  else if (birthYear) {
    title = locale === 'tr' ? `Doğum Yılı: ${birthYear}` : `Birth Year: ${birthYear}`;
  }
  else if (zodiac) {
    const zodiacName = zodiac.charAt(0).toUpperCase() + zodiac.slice(1);
    title = `${tCelebrity('zodiac')}: ${zodiacName}`;
  }

  if (celebrities.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">
          {locale === 'tr' ? "Sonuç Bulunamadı" : "No Results Found"}
        </h2>
        <p className="text-gray-500 mb-6">
          {locale === 'tr' ? "Aradığınız kriterlere uygun ünlü bulunamadı." : "No celebrities found matching your criteria."}
        </p>
        <Link
          href="/"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors"
        >
          {locale === 'tr' ? "Tüm Ünlüleri Görüntüle" : "View All Celebrities"}
        </Link>
      </div>
    )
  }

  return <CelebrityGrid celebrities={celebrities} title={title} />
}

// Sayfa Props Tanımı
interface HomePageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    category?: string;
    nationality?: string;
    birthYear?: string;
    zodiac?: string;
  }>
}

export default async function HomePage({ params, searchParams }: HomePageProps) {
  const { locale } = await params;
  const queryParams = await searchParams;

  const search = queryParams?.q
  const category = queryParams?.category
  const nationality = queryParams?.nationality
  const birthYear = queryParams?.birthYear
  const zodiac = queryParams?.zodiac

  // ✅ Kategorileri dil desteği ile çekiyoruz
  const categoriesResult = await getCategories(locale);
  const categories = categoriesResult.success ? (categoriesResult.data || []) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {locale === 'tr' ? "Ünlü Biyografilerini Keşfet" : "Discover Celebrity Biographies"}
            </h1>
            <p className="text-xl text-blue-100">
              {locale === 'tr' ? "Favori ünlülerinin hayat hikayelerini öğren" : "Learn about your favorite celebrities' lives"}
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <AdvancedSearch categories={categories} />
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Trending Section (Phase 4 Visualization) */}
        {!search && !category && !nationality && !birthYear && !zodiac && (
          <Suspense fallback={<TrendingSkeleton />}>
            <TrendingSectionWrapper locale={locale} />
          </Suspense>
        )}

        <Suspense fallback={<LoadingGrid />}>
          <CelebritiesWrapper
            search={search}
            category={category}
            nationality={nationality}
            birthYear={birthYear}
            zodiac={zodiac}
            locale={locale}
            categories={categories}
          />
        </Suspense>
      </section>
    </div>
  )
}

async function TrendingSectionWrapper({ locale }: { locale: string }) {
  const trendingData = await getTrendingCelebrities(locale);
  const tCommon = await getTranslations('common');
  // Fallback title if translation missing
  const title = locale === 'tr' ? '🔥 Haftanın En Popülerleri' : '🔥 Trending This Week';

  return <TrendingSection data={trendingData} title={title} />;
}