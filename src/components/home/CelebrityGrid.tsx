import CelebrityCard from '../ui/CelebrityCard'

interface Celebrity {
  id: string
  name: string
  profession?: string | null
  birthDate?: Date | string | null
  birthPlace?: string | null
  image?: string | null
  slug: string
}

interface CelebrityGridProps {
  celebrities: Celebrity[]
  title?: string
}

export default function CelebrityGrid({
  celebrities,
  title = "Ünlüler"
}: CelebrityGridProps) {
  if (celebrities.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Ünlü bulunamadı
        </h3>
        <p className="text-gray-600">
          Farklı bir arama terimi deneyin veya yeni ünlü ekleyin.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {celebrities.map((celebrity) => (
          <CelebrityCard key={celebrity.id} celebrity={celebrity} />
        ))}
      </div>
    </div>
  )
}
