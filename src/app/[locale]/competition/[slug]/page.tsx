import { getCompetitionBySlug, recordCompetitionView } from '@/actions/competitions';
import CompetitionHero from '@/components/competition/CompetitionHero';
import RankingsSection from '@/components/competition/RankingsSection';
import SEOContentSection from '@/components/competition/SEOContentSection';
import RelatedCompetitions from '@/components/competition/RelatedCompetitions';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { generateCompetitionSchema } from '@/lib/competition-seo';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5 minute ISR

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params;
  const competition = await getCompetitionBySlug(slug, locale);

  if (!competition) return {};

  const t = await getTranslations({ locale, namespace: 'competitions' });
  const winner = competition.entries.find((e: any) => e.rank === 1);
  const winnerName = winner
    ? (winner.celebrity.translations.find((tr: any) => tr.language === locale.toUpperCase())?.name || winner.celebrity.name)
    : '';

  const title = competition.metaTitle || `${competition.name} Results & Winner - Full Ranking | CelebHub`;
  const description = competition.metaDescription ||
    `${competition.name} official results.${winnerName ? ` Winner: ${winnerName}.` : ''} View full ranking, runner-ups, and special awards.`;

  return {
    title,
    description,
    openGraph: {
        images: competition.coverImage ? [competition.coverImage] : [],
    }
  };
}

export default async function CompetitionPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params;
  const competition = await getCompetitionBySlug(slug, locale);

  if (!competition) notFound();

  // Fire-and-forget view tracking
  // In Next.js 15, we should use after() but since we didn't implement it with experimental flags,
  // we'll keep the direct call but ensure it doesn't block.
  // Actually, recordCompetitionView is async but we don't await it strictly for render?
  // Ideally use `after(() => recordCompetitionView(...))` if available.
  // For now, we'll await it to be safe or use void to detach.
  void recordCompetitionView(competition.id, locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateCompetitionSchema(competition, locale)
        }}
      />

      <CompetitionHero competition={competition} />

      <RankingsSection entries={competition.entries} locale={locale} />

      {competition.seoContent && (
        <SEOContentSection content={competition.seoContent} />
      )}

      <RelatedCompetitions
        type={competition.type}
        excludeId={competition.id}
        locale={locale}
      />
    </>
  );
}
