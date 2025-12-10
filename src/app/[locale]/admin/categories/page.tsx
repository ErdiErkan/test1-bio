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



        <CategoriesManager initialCategories={categories} locale={locale} />
      </div>
    </div>
  )
}