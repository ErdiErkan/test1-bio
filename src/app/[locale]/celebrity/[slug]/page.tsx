import { notFound } from 'next/navigation'
import CelebrityProfile from '@/components/celebrity/CelebrityProfile'
import { getCelebrityBySlug } from '@/actions/celebrities'
import { generateStructuredDataScript } from '@/lib/seo'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: Promise<{
    slug: string
    locale: string
  }>
}

type Translation = { language: string; slug: string }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale } = await params
  const celebrity = await getCelebrityBySlug(slug, locale)

  // Çevirileri sunucudan alıyoruz (gerekirse kullanmak için)
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  
  if (!celebrity) {
    return {
      title: locale === 'tr' ? 'Ünlü Bulunamadı - CelebHub' : 'Celebrity Not Found - CelebHub',
      description: locale === 'tr' ? 'Aradığınız ünlü bulunamadı.' : 'The celebrity you are looking for was not found.'
    }
  }

  // Dinamik Description Oluşturma
  let description = '';
  if (celebrity.bio) {
    // Bio varsa onu kullan, çok uzunsa kısalt
    description = celebrity.bio.length > 160 ? celebrity.bio.substring(0, 160) + '...' : celebrity.bio;
  } else {
    // Bio yoksa otomatik bir açıklama oluştur
    const parts = [];
    if (celebrity.profession) parts.push(celebrity.profession);
    if (celebrity.birthPlace) parts.push(celebrity.birthPlace);
    
    if (locale === 'tr') {
      description = `${celebrity.name} hakkında bilgi edinin. ${parts.join(', ')}.`;
    } else {
      description = `Learn about ${celebrity.name}. ${parts.join(', ')}.`;
    }
  }

  // Type-safe image check
  const mainImage = celebrity.images && celebrity.images.length > 0
    ? celebrity.images.find((img: any) => img.isMain)?.url
    : celebrity.image

  const altText = celebrity.altText || celebrity.name
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://whoo.bio'

  const languages: Record<string, string> = {}
  if (celebrity.translations && Array.isArray(celebrity.translations)) {
    celebrity.translations.forEach((t: Translation) => {
      const langCode = t.language.toLowerCase()
      if (t.slug) {
        languages[langCode] = `${siteUrl}/${langCode}/celebrity/${t.slug}`
      }
    })
  } else {
    languages[locale] = `${siteUrl}/${locale}/celebrity/${celebrity.slug}`
  }

  // Dinamik Title (Dile göre başlık)
  const title = locale === 'tr' 
    ? `${celebrity.name} Biyografisi, Hayatı ve Kariyeri - CelebHub`
    : `${celebrity.name} Biography, Life and Career - CelebHub`;

  const ogTitle = locale === 'tr' ? `${celebrity.name} Kimdir?` : `Who is ${celebrity.name}?`;

  return {
    title: title,
    description: description,
    openGraph: {
      title: ogTitle,
      description: description,
      images: mainImage ? [{
        url: mainImage,
        alt: altText
      }] : [],
      type: 'profile',
      locale: locale,
      url: `${siteUrl}/${locale}/celebrity/${celebrity.slug}`,
      siteName: 'CelebHub'
    },
    twitter: {
      card: 'summary_large_image',
      title: `${celebrity.name} - CelebHub`,
      description: description,
      images: mainImage ? [mainImage] : [],
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/celebrity/${celebrity.slug}`,
      languages: languages
    }
  }
}

export default async function CelebrityPage({ params }: PageProps) {
  const { slug, locale } = await params
  const celebrity = await getCelebrityBySlug(slug, locale)

  if (!celebrity) {
    notFound()
  }

  const structuredData = generateStructuredDataScript(celebrity, locale)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredData }}
      />
      <CelebrityProfile celebrity={celebrity} />
    </>
  )
}