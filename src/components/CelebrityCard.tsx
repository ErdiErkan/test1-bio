import Link from 'next/link'
import Image from 'next/image'
import { Celebrity } from '@/lib/types'
import { formatDate } from '@/lib/utils'

interface CelebrityCardProps {
  celebrity: Celebrity
}

export default function CelebrityCard({ celebrity }: CelebrityCardProps) {
  return (
    <Link href={`/celebrity/${celebrity.slug}`}>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer h-full">
        {celebrity.image ? (
          <div className="relative h-48 w-full bg-gray-100">
            <Image
              src={celebrity.image}
              alt={celebrity.name}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="h-48 w-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-4xl">
              {celebrity.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="p-4">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {celebrity.name}
          </h3>
          {celebrity.profession && (
            <p className="text-sm text-gray-600 mb-2">{celebrity.profession}</p>
          )}
          {celebrity.birthDate && (
            <p className="text-xs text-gray-500">
              {formatDate(celebrity.birthDate)}
            </p>
          )}
          {celebrity.bio && (
            <p className="text-sm text-gray-700 mt-3 line-clamp-3">
              {celebrity.bio}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
