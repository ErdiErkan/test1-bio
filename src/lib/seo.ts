import { Celebrity, SocialMediaLink, CelebrityImage, FAQ } from '@/lib/types'
import { getCountryInfo } from '@/lib/celebrity'

// Celebrity with optional relations for SEO
interface CelebrityWithRelations extends Celebrity {
  socialMediaLinks?: SocialMediaLink[]
  images?: CelebrityImage[]
  faqs?: FAQ[]
}

// Helper to get absolute URL for images
function getAbsoluteImageUrl(imageUrl: string | null | undefined, siteUrl: string): string {
  if (!imageUrl) return ''
  if (imageUrl.startsWith('http')) return imageUrl
  return `${siteUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`
}

// Generate Person schema for the celebrity
// FIX: Added 'locale' parameter
export function generatePersonSchema(celebrity: CelebrityWithRelations, locale: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://whoo.bio'

  // Get image URL
  let imageUrl = ''
  if (celebrity.images && celebrity.images.length > 0) {
    const mainImage = celebrity.images.find(img => img.isMain) || celebrity.images[0]
    imageUrl = getAbsoluteImageUrl(mainImage.url, siteUrl)
  } else if (celebrity.image) {
    imageUrl = getAbsoluteImageUrl(celebrity.image, siteUrl)
  }

  const country = getCountryInfo(celebrity.nationality)

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: celebrity.name,
    // FIX: Added locale to URL
    url: `${siteUrl}/${locale}/celebrity/${celebrity.slug}`,
    // FIX: Added inLanguage property
    inLanguage: locale,

    ...(celebrity.nickname && { alternateName: celebrity.nickname }),
    ...(celebrity.profession && { jobTitle: celebrity.profession }),
    ...(celebrity.bio && { description: celebrity.bio.substring(0, 5000) }),
    ...(imageUrl && { image: imageUrl }),

    ...(celebrity.birthDate && {
      birthDate: new Date(celebrity.birthDate).toISOString().split('T')[0]
    }),

    ...(celebrity.birthPlace && {
      birthPlace: {
        '@type': 'Place',
        name: celebrity.birthPlace
      }
    }),

    ...(country && {
      nationality: {
        '@type': 'Country',
        name: country.name
      }
    }),

    ...(celebrity.zodiac && {
      disambiguatingDescription: `Zodiac Sign: ${celebrity.zodiac.charAt(0).toUpperCase() + celebrity.zodiac.slice(1)}`
    }),

    ...(celebrity.socialMediaLinks && celebrity.socialMediaLinks.length > 0 && {
      sameAs: celebrity.socialMediaLinks.map(link => link.url)
    })
  }

  return schema
}

export function generateFAQSchema(faqs: FAQ[]) {
  if (!faqs || faqs.length === 0) return null

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  }

  return schema
}

// FIX: Added locale parameter here too
export function generateCelebritySchemas(celebrity: CelebrityWithRelations, locale: string) {
  const schemas: object[] = []

  const personSchema = generatePersonSchema(celebrity, locale)
  schemas.push(personSchema)

  if (celebrity.faqs && celebrity.faqs.length > 0) {
    const faqSchema = generateFAQSchema(celebrity.faqs)
    if (faqSchema) {
      schemas.push(faqSchema)
    }
  }

  return schemas
}

// FIX: Added locale parameter and updated ImageGallery URL
export function generateImageGallerySchema(
  images: CelebrityImage[],
  celebrityName: string,
  pageUrl: string
) {
  if (!images || images.length <= 1) return null

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://whoo.bio'

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: `${celebrityName} Fotoğrafları`,
    url: pageUrl,
    numberOfItems: images.length,
    image: images.map((img, index) => ({
      '@type': 'ImageObject',
      url: getAbsoluteImageUrl(img.url, siteUrl),
      name: `${celebrityName} - Fotoğraf ${index + 1}`,
      position: index + 1
    }))
  }

  return schema
}

// FIX: Updated to use all corrected functions
export function generateStructuredDataScript(celebrity: CelebrityWithRelations, locale: string): string {
  const schemas = generateCelebritySchemas(celebrity, locale)

  if (celebrity.images && celebrity.images.length > 1) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://whoo.bio'
    const gallerySchema = generateImageGallerySchema(
      celebrity.images,
      celebrity.name,
      `${siteUrl}/${locale}/celebrity/${celebrity.slug}`
    )
    if (gallerySchema) {
      schemas.push(gallerySchema)
    }
  }

  return JSON.stringify(schemas.length === 1 ? schemas[0] : schemas)
}