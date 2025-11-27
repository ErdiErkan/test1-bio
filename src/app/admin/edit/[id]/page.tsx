import { notFound } from 'next/navigation'
import CelebrityForm from '@/components/admin/CelebrityForm'
import Link from 'next/link'
import { prisma } from '@/lib/db'

async function getCelebrity(id: string) {
  try {
    const celebrity = await prisma.celebrity.findUnique({
      where: { id }
    })
    return celebrity
  } catch (error) {
    console.error('Error fetching celebrity:', error)
    return null
  }
}

export default async function EditCelebrityPage({
  params
}: {
  params: { id: string }
}) {
  const celebrity = await getCelebrity(params.id)

  if (!celebrity) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/admin" className="hover:text-blue-600">Admin</Link>
            <span>→</span>
            <span className="text-gray-900">{celebrity.name} Düzenle</span>
          </div>
        </nav>

        <CelebrityForm celebrity={celebrity} isEdit={true} />
      </div>
    </div>
  )
}
