import CelebrityHeader from './CelebrityHeader'
import CelebrityInfo from './CelebrityInfo'
import FAQSection from './FAQSection'
import BackButton from '../ui/BackButton'
import { ReportButton } from '../report'
import type { CelebrityImage, FAQ } from '@/lib/types'

interface Celebrity {
  id: string
  name: string
  nickname?: string | null
  profession?: string | null
  birthDate?: Date | string | null
  birthPlace?: string | null
  nationality?: string | null
  bio?: string | null
  image?: string | null // @deprecated - Use images array instead
  images?: CelebrityImage[]
  faqs?: FAQ[]
  slug: string
  createdAt: Date | string
  updatedAt: Date | string
}

interface CelebrityProfileProps {
  celebrity: Celebrity
}

export default function CelebrityProfile({ celebrity }: CelebrityProfileProps) {
  const hasFaqs = celebrity.faqs && celebrity.faqs.length > 0

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

          {/* FAQ Section - Only render if FAQs exist */}
          {hasFaqs && (
            <FAQSection
              faqs={celebrity.faqs!}
              celebrityName={celebrity.name}
            />
          )}

          {/* Hata Bildir Butonu */}
          <div className="flex justify-center pt-4 border-t border-gray-200">
            <ReportButton celebrityId={celebrity.id} celebrityName={celebrity.name} />
          </div>
        </div>
      </div>
    </div>
  )
}
