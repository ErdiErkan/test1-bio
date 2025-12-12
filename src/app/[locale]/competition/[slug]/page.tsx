import { getCompetitionBySlug, recordCompetitionView } from '@/actions/competitions'
import { Link } from '@/i18n/routing'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Image from 'next/image'
import { format } from 'date-fns'
import { Calendar, MapPin, Trophy, Share2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// --- Components ---

function RankingCard({ entry, index }: { entry: any, index: number }) {
  const isWinner = entry.placement === 'WINNER' || entry.rank === 1
  const isTop3 = entry.rank <= 3

  return (
    <div className={cn(
      "flex items-center gap-4 p-4 rounded-lg border transition-colors hover:bg-accent/5",
      isWinner ? "bg-yellow-500/10 border-yellow-500/50" : "bg-card"
    )}>
      {/* Rank Badge */}
      <div className={cn(
        "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold",
        isWinner ? "bg-yellow-500 text-white shadow-lg shadow-yellow-500/20" :
        isTop3 ? "bg-muted text-foreground" : "bg-transparent text-muted-foreground"
      )}>
        {isWinner ? <Trophy className="h-6 w-6" /> : `#${entry.rank}`}
      </div>

      {/* Image */}
      <Link href={`/celebrity/${entry.celebrity.slug}`} className="shrink-0">
        <div className={cn(
          "relative overflow-hidden rounded-full border-2",
          isWinner ? "h-20 w-20 border-yellow-500" : "h-16 w-16 border-muted"
        )}>
          {entry.celebrity.images?.[0]?.url ? (
             <Image
              src={entry.celebrity.images[0].url}
              alt={entry.celebrity.name}
              fill
              className="object-cover"
              sizes="96px"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground">
              No Img
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-col">
          {entry.placement && (
            <span className={cn(
              "text-xs font-bold uppercase tracking-wider mb-0.5",
              isWinner ? "text-yellow-600" : "text-muted-foreground"
            )}>
              {entry.placement.replace('_', ' ')}
            </span>
          )}
          <Link href={`/celebrity/${entry.celebrity.slug}`} className="hover:underline">
            <h3 className="text-lg font-bold truncate">{entry.celebrity.name}</h3>
          </Link>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {entry.celebrity.nationality && <span>{entry.celebrity.nationality}</span>}
            {/* Points could go here if relevant */}
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Page ---

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const competition = await getCompetitionBySlug(slug, locale)

  if (!competition) return {}

  const t = competition.translations[0]

  return {
    title: t?.metaTitle || `${t?.title || competition.slug} - Results & Rankings | CelebHub`,
    description: t?.metaDescription || t?.description?.slice(0, 160) || `Check out the full rankings and results for ${t?.title}.`,
    openGraph: {
      images: competition.coverImage ? [competition.coverImage] : [],
    }
  }
}

export default async function CompetitionDetailPage({ params }: Props) {
  const { locale, slug } = await params
  const competition = await getCompetitionBySlug(slug, locale)

  if (!competition) {
    notFound()
  }

  // Record View (Write-Behind)
  recordCompetitionView(competition.id)

  const t = competition.translations[0]
  const title = t?.title || competition.slug

  // JSON-LD Structured Data for Event
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: title,
    description: t?.description,
    startDate: competition.startDate,
    endDate: competition.endDate,
    image: competition.coverImage ? [competition.coverImage] : undefined,
    eventStatus: `https://schema.org/Event${competition.status.charAt(0) + competition.status.slice(1).toLowerCase()}`,
    // Organizer logic would go here
  }

  return (
    <div className="min-h-screen pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[500px] w-full bg-black text-white">
        {competition.coverImage && (
          <Image
            src={competition.coverImage}
            alt={title}
            fill
            className="object-cover opacity-60"
            priority
            unoptimized // Using internal uploads
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/30" />

        <div className="container relative flex h-full flex-col justify-end pb-12">
          <Badge className="mb-4 w-fit bg-primary hover:bg-primary/90">
            {competition.type.replace('_', ' ')}
          </Badge>

          <h1 className="mb-4 text-4xl font-extrabold tracking-tight md:text-6xl lg:text-7xl">
            {title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-sm md:text-base text-gray-200">
             <div className="flex items-center gap-2">
               <Calendar className="h-5 w-5 text-primary" />
               <span>
                 {competition.startDate ? format(new Date(competition.startDate), 'dd MMM yyyy') : 'Date TBA'}
               </span>
             </div>
             {competition.scope && (
               <div className="flex items-center gap-2">
                 <MapPin className="h-5 w-5 text-primary" />
                 <span>{competition.scope}</span>
               </div>
             )}
          </div>
        </div>
      </section>

      <div className="container mt-12 grid gap-12 lg:grid-cols-3">

        {/* Main Content: Rankings */}
        <div className="lg:col-span-2 space-y-8">

           {/* Winner Showcase (if completed) */}
           {competition.entries.length > 0 && competition.entries[0].placement === 'WINNER' && (
             <section className="mb-10">
               <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold">
                 <Trophy className="h-6 w-6 text-yellow-500" />
                 The Winner
               </h2>
               <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 p-6 md:p-8">
                  <div className="flex flex-col md:flex-row items-center gap-8">
                     <div className="relative h-48 w-48 shrink-0 overflow-hidden rounded-full border-4 border-yellow-500 shadow-xl">
                       {competition.entries[0].celebrity.images?.[0]?.url && (
                         <Image
                           src={competition.entries[0].celebrity.images[0].url}
                           alt={competition.entries[0].celebrity.name}
                           fill
                           className="object-cover"
                           unoptimized
                         />
                       )}
                     </div>
                     <div className="text-center md:text-left">
                       <Badge variant="outline" className="mb-2 border-yellow-500 text-yellow-600 bg-yellow-50">WINNER</Badge>
                       <h3 className="text-3xl font-bold mb-2">{competition.entries[0].celebrity.name}</h3>
                       <p className="text-muted-foreground mb-4 max-w-md">
                         Congratulations to the winner of {title}!
                       </p>
                       <Link href={`/celebrity/${competition.entries[0].celebrity.slug}`}>
                         <Button className="rounded-full">View Full Profile</Button>
                       </Link>
                     </div>
                  </div>
               </div>
             </section>
           )}

           {/* Full Rankings List */}
           <section>
             <h2 className="mb-6 text-2xl font-bold">Results & Rankings</h2>
             <div className="grid gap-3">
               {competition.entries.map((entry, idx) => (
                 <RankingCard key={entry.id} entry={entry} index={idx} />
               ))}

               {competition.entries.length === 0 && (
                 <div className="py-12 text-center text-muted-foreground bg-muted/30 rounded-lg">
                   Contestants and rankings are being updated. Check back soon!
                 </div>
               )}
             </div>
           </section>
        </div>

        {/* Sidebar: Details & Info */}
        <aside className="space-y-8">
          <Card>
            <CardContent className="pt-6">
              <h3 className="mb-4 text-lg font-bold">About Event</h3>
              <div className="prose prose-sm dark:prose-invert text-muted-foreground">
                <p>{t?.description}</p>
                {t?.rules && (
                  <>
                    <h4 className="mt-4 font-semibold text-foreground">Rules & Criteria</h4>
                    <p>{t.rules}</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
               <h3 className="mb-4 text-lg font-bold">Share</h3>
               <div className="flex gap-2">
                  <Button variant="outline" size="icon">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  {/* Additional social share buttons could go here */}
               </div>
            </CardContent>
          </Card>
        </aside>

      </div>
    </div>
  )
}
