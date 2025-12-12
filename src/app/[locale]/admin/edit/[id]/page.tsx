import { notFound } from 'next/navigation'
import CelebrityForm from '@/components/admin/CelebrityForm'
import { CompetitionForm } from '@/components/admin/CompetitionForm'
import Link from 'next/link'
import { prisma } from '@/lib/db'

async function getCelebrity(id: string) {
  try {
    const celebrity = await prisma.celebrity.findUnique({
      where: { id },
      include: {
        translations: true, // Explicitly fetch translations
        categories: {
          select: {
            id: true,
            name: true
          }
        },
        socialMediaLinks: {
          orderBy: { displayOrder: 'asc' }
        },
        images: {
          orderBy: { displayOrder: 'asc' }
        },
        faqs: {
          orderBy: { displayOrder: 'asc' }
        }
      }
    })
    return celebrity
  } catch (error) {
    console.error('Error fetching celebrity:', error)
    return null
  }
}

async function getCompetition(id: string) {
  try {
    const competition = await prisma.competition.findUnique({
      where: { id },
      include: {
        translations: true,
        entries: {
          include: {
            celebrity: {
              include: {
                images: { where: { isMain: true }, take: 1 }
              }
            }
          },
          orderBy: [
            { rank: 'asc' },
            { points: 'desc' }
          ]
        }
      }
    })
    return competition
  } catch (error) {
    console.error('Error fetching competition:', error)
    return null
  }
}

interface EditPageProps {
  params: Promise<{ id: string, locale: string }>
  searchParams: Promise<{ type?: string }>
}

export default async function EditPage({ params, searchParams }: EditPageProps) {
  const { id, locale } = await params
  const { type } = await searchParams

  const isCompetition = type === 'competition'

  let initialData = null

  if (isCompetition) {
    initialData = await getCompetition(id)
  } else {
    initialData = await getCelebrity(id)
  }

  if (!initialData) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/admin" className="hover:text-blue-600">Admin</Link>
            <span>→</span>
            {isCompetition ? (
              <Link href="/admin/competitions" className="hover:text-blue-600">Competitions</Link>
            ) : (
              <Link href="/admin" className="hover:text-blue-600">Celebrities</Link>
            )}
            <span>→</span>
            <span className="text-gray-900">
              Edit {isCompetition ? (initialData as any).slug : (initialData as any).name}
            </span>
          </div>
        </nav>

        {isCompetition ? (
          <CompetitionForm
            initialData={initialData}
            isEditing={true}
            locale={locale}
          />
        ) : (
          <CelebrityForm
            celebrity={initialData}
            isEdit={true}
          />
        )}
      </div>
    </div>
  )
}
