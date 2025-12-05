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
export function generatePersonSchema(celebrity: CelebrityWithRelations) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://whoo.bio'

  // Get image URL - prefer new images array, fallback to legacy image field
  let imageUrl = ''
  if (celebrity.images && celebrity.images.length > 0) {
    const mainImage = celebrity.images.find(img => img.isMain) || celebrity.images[0]
    imageUrl = getAbsoluteImageUrl(mainImage.url, siteUrl)
  } else if (celebrity.image) {
    imageUrl = getAbsoluteImageUrl(celebrity.image, siteUrl)
  }

  // Get country info
  const country = getCountryInfo(celebrity.nationality)

  // Build Person schema
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: celebrity.name,
    url: `${siteUrl}/celebrity/${celebrity.slug}`,

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

    // Social Media Links for Google Knowledge Graph
    ...(celebrity.socialMediaLinks && celebrity.socialMediaLinks.length > 0 && {
      sameAs: celebrity.socialMediaLinks.map(link => link.url)
    })
  }

  return schema
}

// Generate FAQPage schema for Google Rich Snippets
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

// Generate combined schemas for a celebrity page
export function generateCelebritySchemas(celebrity: CelebrityWithRelations) {
  const schemas: object[] = []

  // Always include Person schema
  const personSchema = generatePersonSchema(celebrity)
  schemas.push(personSchema)

  // Include FAQPage schema if FAQs exist
  if (celebrity.faqs && celebrity.faqs.length > 0) {
    const faqSchema = generateFAQSchema(celebrity.faqs)
    if (faqSchema) {
      schemas.push(faqSchema)
    }
  }

  return schemas
}

// Generate ImageGallery schema for multiple images
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

// Generate all structured data scripts for a celebrity page
export function generateStructuredDataScript(celebrity: CelebrityWithRelations): string {
  const schemas = generateCelebritySchemas(celebrity)

  // Add image gallery schema if multiple images
  if (celebrity.images && celebrity.images.length > 1) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://whoo.bio'
    const gallerySchema = generateImageGallerySchema(
      celebrity.images,
      celebrity.name,
      `${siteUrl}/celebrity/${celebrity.slug}`
    )
    if (gallerySchema) {
      schemas.push(gallerySchema)
    }
  }

  // Return as JSON-LD script content
  return JSON.stringify(schemas.length === 1 ? schemas[0] : schemas)
}
