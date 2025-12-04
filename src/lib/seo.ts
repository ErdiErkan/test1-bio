import { Celebrity, SocialMediaLink } from '@/lib/types'
import { getCountryInfo } from '@/lib/celebrity'

// Celebrity with optional socialMediaLinks for SEO
interface CelebrityWithSocialLinks extends Celebrity {
  socialMediaLinks?: SocialMediaLink[]
}

export function generatePersonSchema(celebrity: CelebrityWithSocialLinks) {
  // Site URL'ini güvenli bir şekilde alalım
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://whoo.bio'
  
  // Resim URL'ini tam yol (absolute URL) yapma
  let imageUrl = ''
  if (celebrity.image) {
    if (celebrity.image.startsWith('http')) {
      imageUrl = celebrity.image
    } else {
      imageUrl = `${siteUrl}${celebrity.image.startsWith('/') ? '' : '/'}${celebrity.image}`
    }
  }

  // Ülke bilgisini alma
  const country = getCountryInfo(celebrity.nationality)

  // Temel Şema Oluşturma
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

    // ARTIK TYPESCRIPT HATASI VERMEZ:
    ...(celebrity.zodiac && {
        disambiguatingDescription: `Zodiac Sign: ${celebrity.zodiac.charAt(0).toUpperCase() + celebrity.zodiac.slice(1)}`
    }),

    // Social Media Links için sameAs array - Google Knowledge Graph için kritik
    ...(celebrity.socialMediaLinks && celebrity.socialMediaLinks.length > 0 && {
      sameAs: celebrity.socialMediaLinks.map(link => link.url)
    })
  }

  return schema
}