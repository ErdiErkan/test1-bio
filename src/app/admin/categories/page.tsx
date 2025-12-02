import Link from 'next/link'
import { prisma } from '@/lib/db'
import CategoriesManager from '@/components/admin/CategoriesManager'

export const metadata = {
  title: 'Kategori Yönetimi - Admin',
  description: 'Kategorileri yönetin',
}

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { celebrities: true }
      }
    }
  })

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kategori Yönetimi</h1>
          <p className="text-gray-600 mt-2">
            Ünlü kategorilerini buradan yönetebilirsiniz
          </p>
        </div>

        {/* Navigation */}
        <div className="flex gap-4">
          <Link
            href="/admin"
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Ünlüler
          </Link>
          <Link
            href="/admin/categories"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Kategoriler
          </Link>
          <Link
            href="/"
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Ana Sayfa
          </Link>
        </div>

        <CategoriesManager initialCategories={categories} />
      </div>
    </div>
  )
}
