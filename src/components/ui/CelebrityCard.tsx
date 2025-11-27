import Link from 'next/link'
import Image from 'next/image'

interface Celebrity {
  id: string
  name: string
  profession?: string | null
  birthDate?: Date | string | null
  birthPlace?: string | null
  image?: string | null
  slug: string
}

interface CelebrityCardProps {
  celebrity: Celebrity
}

export default function CelebrityCard({ celebrity }: CelebrityCardProps) {
  const formatDate = (dateString?: Date | string | null) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('tr-TR')
  }

  return (
    <Link href={`/celebrity/${celebrity.slug}`}>
      <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden cursor-pointer h-full">
        {/* Resim */}
        <div className="aspect-[4/3] bg-gray-100 relative">
          {celebrity.image ? (
            <Image
              src={celebrity.image}
              alt={celebrity.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-6xl text-gray-400">👤</div>
            </div>
          )}
        </div>

        {/* İçerik */}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {celebrity.name}
          </h3>

          {celebrity.profession && (
            <p className="text-sm text-blue-600 mb-2 font-medium">
              {celebrity.profession}
            </p>
          )}

          <div className="text-sm text-gray-600 space-y-1">
            {celebrity.birthDate && (
              <p>📅 {formatDate(celebrity.birthDate)}</p>
            )}
            {celebrity.birthPlace && (
              <p className="line-clamp-1">📍 {celebrity.birthPlace}</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
