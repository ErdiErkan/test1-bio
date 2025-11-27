import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/db'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: {
    slug: string
  }
}

async function getCelebrity(slug: string) {
  try {
    const celebrity = await prisma.celebrity.findUnique({
      where: { slug }
    })
    return celebrity
  } catch (error) {
    console.error('Error fetching celebrity:', error)
    return null
  }
}

export async function generateMetadata({ params }: PageProps) {
  const celebrity = await getCelebrity(params.slug)

  if (!celebrity) {
    return {
      title: 'Ünlü Bulunamadı'
    }
  }

  return {
    title: `${celebrity.name} - Ünlü Biyografi`,
    description: celebrity.bio || `${celebrity.name} hakkında bilgi`
  }
}

export default async function CelebrityPage({ params }: PageProps) {
  const celebrity = await getCelebrity(params.slug)

  if (!celebrity) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Ana Sayfaya Dön
          </Link>
        </div>
        <article className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Image */}
          {celebrity.image ? (
            <div className="relative h-96 w-full bg-gray-100">
              <Image
                src={celebrity.image}
                alt={celebrity.name}
                fill
                className="object-cover"
                priority
              />
            </div>
          ) : (
            <div className="h-96 w-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-9xl font-bold">
                {celebrity.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Content */}
          <div className="p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {celebrity.name}
            </h1>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200">
              {celebrity.profession && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Meslek</dt>
                  <dd className="mt-1 text-lg text-gray-900">
                    {celebrity.profession}
                  </dd>
                </div>
              )}

              {celebrity.birthDate && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Doğum Tarihi
                  </dt>
                  <dd className="mt-1 text-lg text-gray-900">
                    {formatDate(celebrity.birthDate)}
                  </dd>
                </div>
              )}

              {celebrity.birthPlace && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Doğum Yeri
                  </dt>
                  <dd className="mt-1 text-lg text-gray-900">
                    {celebrity.birthPlace}
                  </dd>
                </div>
              )}
            </div>

            {/* Biography */}
            {celebrity.bio && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Biyografi
                </h2>
                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {celebrity.bio}
                  </p>
                </div>
              </div>
            )}
          </div>
        </article>
      </div>
    </div>
  )
}
