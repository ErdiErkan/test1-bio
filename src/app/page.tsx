import Link from 'next/link'
import { prisma } from '@/lib/db'
import CelebrityCard from '@/components/CelebrityCard'
import SearchBar from '@/components/SearchBar'

export const dynamic = 'force-dynamic'

async function getCelebrities() {
  try {
    const celebrities = await prisma.celebrity.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 6
    })
    return celebrities
  } catch (error) {
    console.error('Error fetching celebrities:', error)
    return []
  }
}

export default async function HomePage() {
  const celebrities = await getCelebrities()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Ünlü Biyografi Platformu
            </h1>
            <Link
              href="/admin"
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
            >
              Admin Panel
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Search Bar */}
        <div className="mb-12">
          <SearchBar />
        </div>

        {/* Celebrities Section */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Son Eklenen Ünlüler
          </h2>

          {celebrities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {celebrities.map((celebrity) => (
                <CelebrityCard key={celebrity.id} celebrity={celebrity} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                Henüz hiç ünlü eklenmemiş.
              </p>
              <Link
                href="/admin"
                className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                İlk ünlüyü ekle
              </Link>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-gray-600 text-sm">
            © 2024 Ünlü Biyografi Platformu. Tüm hakları saklıdır.
          </p>
        </div>
      </footer>
    </div>
  )
}
