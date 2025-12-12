import { getCompetitions, getPopularCompetitions } from '@/actions/competitions'
import { Link } from '@/i18n/routing'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Trophy, Users } from 'lucide-react'
import Image from 'next/image'
import { format } from 'date-fns'
import { Metadata } from 'next'

// --- Components ---

function CompetitionCard({ competition }: { competition: any }) {
  const t = competition.translations[0]
  const title = t?.title || competition.slug
  const description = t?.description || ''

  return (
    <Link href={`/competition/${t?.slug || competition.slug}`} className="group block h-full">
      <Card className="h-full overflow-hidden transition-colors hover:border-primary/50">
        <div className="relative aspect-[16/9] w-full bg-muted">
          {competition.coverImage ? (
            <Image
              src={competition.coverImage}
              alt={title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Trophy className="h-12 w-12 opacity-20" />
            </div>
          )}
          <Badge className="absolute left-2 top-2 bg-black/50 backdrop-blur-sm hover:bg-black/70">
            {competition.status}
          </Badge>
        </div>
        <CardContent className="p-5">
          <h3 className="mb-2 text-xl font-bold leading-tight group-hover:text-primary">
            {title}
          </h3>
          <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
            {description}
          </p>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
             <div className="flex items-center gap-1">
               <Calendar className="h-3.5 w-3.5" />
               <span>
                 {competition.startDate ? format(new Date(competition.startDate), 'MMM yyyy') : 'TBA'}
               </span>
             </div>

             {competition._count?.entries > 0 && (
               <div className="flex items-center gap-1">
                 <Users className="h-3.5 w-3.5" />
                 <span>{competition._count.entries} Contestants</span>
               </div>
             )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function PopularSlider({ items }: { items: any[] }) {
  if (items.length === 0) return null

  // For MVP, we use a simple grid for "Popular" instead of a complex JS slider to keep it lightweight.
  // In a real scenario, this would be a client component with Swiper/Embla.
  const featured = items[0]
  const t = featured.translations[0]

  return (
    <section className="mb-12">
      <h2 className="mb-6 text-2xl font-bold tracking-tight">Trending Now</h2>
      <div className="relative overflow-hidden rounded-xl bg-muted aspect-[21/9]">
        <Link href={`/competition/${t?.slug || featured.slug}`}>
            {featured.coverImage && (
              <Image
                src={featured.coverImage}
                alt={t?.title || featured.slug}
                fill
                className="object-cover brightness-75 transition-transform hover:scale-105 duration-700"
                priority
              />
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6 md:p-10">
              <Badge className="mb-2 bg-primary text-primary-foreground hover:bg-primary/90">
                FEATURED
              </Badge>
              <h3 className="mb-2 text-2xl md:text-4xl font-bold text-white">
                {t?.title || featured.slug}
              </h3>
              <p className="line-clamp-2 max-w-2xl text-gray-200">
                {t?.description}
              </p>
            </div>
        </Link>
      </div>
    </section>
  )
}

// --- Page ---

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return {
    title: 'Competitions & Rankings | CelebHub',
    description: 'Vote for your favorite celebrities in global beauty pageants, awards, and rankings.',
  }
}

export default async function CompetitionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { locale } = await params
  const { page } = await searchParams

  const currentPage = Number(page) || 1

  // Parallel Data Fetching
  const [popularData, listData] = await Promise.all([
    getPopularCompetitions(locale),
    getCompetitions({
      page: currentPage,
      limit: 12,
      status: 'ONGOING', // Default to active ones
      locale
    })
  ])

  return (
    <div className="container py-10">

      {/* 1. Popular Section */}
      <PopularSlider items={popularData} />

      {/* 2. Main List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">All Competitions</h1>
          {/* Filters could go here in future */}
        </div>

        {listData.items.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listData.items.map((competition) => (
              <CompetitionCard key={competition.id} competition={competition} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-muted-foreground">
            No active competitions at the moment.
          </div>
        )}

        {/* 3. Pagination */}
        {listData.metadata.totalPages > 1 && (
            <div className="flex justify-center py-8">
                {/* Simplified Pagination for MVP */}
                <div className="flex gap-2">
                    {currentPage > 1 && (
                        <Link
                            href={`/competitions?page=${currentPage - 1}`}
                            className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                        >
                            Previous
                        </Link>
                    )}
                    <span className="flex items-center px-4 text-sm font-medium">
                        Page {currentPage}
                    </span>
                    {currentPage < listData.metadata.totalPages && (
                        <Link
                            href={`/competitions?page=${currentPage + 1}`}
                            className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                        >
                            Next
                        </Link>
                    )}
                </div>
            </div>
        )}

      </div>
    </div>
  )
}
