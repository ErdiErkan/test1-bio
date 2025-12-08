import Link from 'next/link'
import { prisma } from '@/lib/db'
import CategoriesManager from '@/components/admin/CategoriesManager'
import { getTranslations } from 'next-intl/server'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'admin.categories' })
  return {
    title: `${t('title')} - Admin`,
    description: t('subtitle'),
  }
}

export default async function CategoriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  
  // Çevirileri sunucudan al
  const t = await getTranslations({ locale, namespace: 'admin.categories' })
  const tNav = await getTranslations({ locale, namespace: 'admin.nav' })

  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: {
      translations: true,
      _count: {
        select: { celebrities: true }
      }
    }
  })

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          {/* Başlık ve Alt Başlık (Artık Dinamik) */}
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-600 mt-2">
            {t('subtitle')}
          </p>
        </div>

        {/* Navigation - Çevirili */}
        <div className="flex flex-wrap gap-4">
          <Link
            href="/admin"
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium min-h-[44px] inline-flex items-center"
          >
            {tNav('celebrities')}
          </Link>
          <Link
            href="/admin/categories"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium min-h-[44px] inline-flex items-center"
          >
            {tNav('categories')}
          </Link>
          <Link
            href="/admin/reports"
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium min-h-[44px] inline-flex items-center"
          >
            {tNav('feedbacks')}
          </Link>
          <Link
            href="/"
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium min-h-[44px] inline-flex items-center"
          >
            {tNav('home')}
          </Link>
        </div>

        <CategoriesManager initialCategories={categories} />
      </div>
    </div>
  )
}