import CelebrityForm from '@/components/admin/CelebrityForm'
import { CompetitionForm } from '@/components/admin/CompetitionForm'
import Link from 'next/link'

interface AddPageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ type?: string }>
}

export default async function AddPage({ params, searchParams }: AddPageProps) {
  const { locale } = await params
  const { type } = await searchParams

  const isCompetition = type === 'competition'

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
              {isCompetition ? 'Create Competition' : 'Add Celebrity'}
            </span>
          </div>
        </nav>

        {isCompetition ? (
          <CompetitionForm locale={locale} />
        ) : (
          <CelebrityForm />
        )}
      </div>
    </div>
  )
}
