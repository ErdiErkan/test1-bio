
import { useTranslations } from 'next-intl'

interface Celebrity {
  id: string
  name: string
  bio?: string | null
}

interface CelebrityInfoProps {
  celebrity: Celebrity
}

export default function CelebrityInfo({ celebrity }: CelebrityInfoProps) {
  const t = useTranslations('celebrity')

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        📖 {t('biography')}
      </h2>

      {celebrity.bio ? (
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap">
            {celebrity.bio}
          </p>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('no_bio_title')}
          </h3>
          <p className="text-gray-600">
            {t('no_bio_desc')}
          </p>
        </div>
      )}
    </div>
  )
}