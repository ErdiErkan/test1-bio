
export function generateCompetitionSchema(competition: any, locale: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://celebhub.com';

  // Event Schema
  const eventSchema = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": competition.name,
    "description": competition.description,
    "startDate": competition.eventDate,
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "location": competition.venue ? {
      "@type": "Place",
      "name": competition.venue,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": competition.city,
        "addressCountry": competition.country
      }
    } : undefined,
    "image": competition.coverImage,
    "url": `${baseUrl}/${locale}/competition/${competition.slug}`
  };

  // ItemList Schema for Rankings
  const rankingsSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `${competition.name} - Official Ranking`,
    "numberOfItems": competition.entries?.length || 0,
    "itemListElement": competition.entries?.map((entry: any, index: number) => ({
      "@type": "ListItem",
      "position": entry.rank,
      "item": {
        "@type": "Person",
        "name": entry.celebrity?.name,
        "url": `${baseUrl}/${locale}/celebrity/${entry.celebrity?.slug}`,
        "image": entry.celebrity?.images?.[0]?.url,
        "nationality": entry.representingCountry
      }
    }))
  };

  return JSON.stringify([eventSchema, rankingsSchema]);
}

// Meta generation
export function generateCompetitionMeta(competition: any, locale: string) {
  const winner = competition.entries?.find((e: any) => e.rank === 1);
  const winnerName = winner
    ? (winner.celebrity.translations.find((tr: any) => tr.language === locale.toUpperCase())?.name || winner.celebrity.name)
    : '';

  const title = competition.metaTitle ||
    `${competition.name} Results & Winner - Full Ranking | CelebHub`;

  const description = competition.metaDescription ||
    `${competition.name} official results.${winnerName ? ` Winner: ${winnerName} from ${winner.representingCountry}.` : ''} Full ranking, runner-ups, and special awards.`;

  return { title, description };
}
