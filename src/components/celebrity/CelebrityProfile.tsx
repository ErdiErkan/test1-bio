import CelebrityHeader from './CelebrityHeader'
import CelebrityInfo from './CelebrityInfo'
import BackButton from '../ui/BackButton'

interface Celebrity {
  id: string
  name: string
  nickname?: string | null
  profession?: string | null
  birthDate?: Date | string | null
  birthPlace?: string | null
  nationality?: string | null
  bio?: string | null
  image?: string | null
  slug: string
  createdAt: Date | string
  updatedAt: Date | string
}

interface CelebrityProfileProps {
  celebrity: Celebrity
}

export default function CelebrityProfile({ celebrity }: CelebrityProfileProps) {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Geri Dön Butonu */}
        <div className="mb-6">
          <BackButton />
        </div>

        {/* Profil İçeriği */}
        <div className="space-y-8">
          <CelebrityHeader celebrity={celebrity} />
          <CelebrityInfo celebrity={celebrity} />
        </div>
      </div>
    </div>
  )
}
