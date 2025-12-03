import { notFound } from 'next/navigation'
import CelebrityProfile from '@/components/celebrity/CelebrityProfile'
import { prisma } from '@/lib/db'
import { getCelebrityDescription, getCountryInfo } from '@/lib/celebrity'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ slug: string }>
}

// Celebrity verisi getir
async function getCelebrity(slug: string) {
  try {
    const celebrity = await prisma.celebrity.findUnique({
      where: { slug }
    })
    return celebrity
  } catch (error) {
    console.error('Error fetching celebrity:', error)
    return null
  }
}

// SEO Metadata
export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const celebrity = await getCelebrity(slug)

  if (!celebrity) {
    return {
      title: 'Ünlü Bulunamadı - CelebHub',
      description: 'Aradığınız ünlü bulunamadı.'
    }
  }

  const description = getCelebrityDescription(celebrity, 160)

  return {
    title: `${celebrity.name} - CelebHub`,
    description: description,
    openGraph: {
      title: celebrity.name,
      description: description,
      images: celebrity.image ? [celebrity.image] : [],
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: celebrity.name,
      description: description,
      images: celebrity.image ? [celebrity.image] : [],
    },
  }
}

// Ana sayfa komponenti
export default async function CelebrityPage({ params }: PageProps) {
  const { slug } = await params
  const celebrity = await getCelebrity(slug)

  if (!celebrity) {
    notFound()
  }

  const country = getCountryInfo(celebrity.nationality)

  // Structured Data (JSON-LD) - Schema.org Person
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: celebrity.name,
    ...(celebrity.nickname && { alternateName: celebrity.nickname }),
    ...(celebrity.profession && { jobTitle: celebrity.profession }),
    ...(celebrity.birthDate && {
      birthDate: new Date(celebrity.birthDate).toISOString().split('T')[0]
    }),
    ...(celebrity.birthPlace && { birthPlace: celebrity.birthPlace }),
    ...(country && { nationality: country.name }),
    ...(celebrity.image && {
      image: celebrity.image.startsWith('http')
        ? celebrity.image
        : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://whoo.bio'}${celebrity.image}`
    }),
    ...(celebrity.bio && { description: celebrity.bio.substring(0, 500) }),
    url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://whoo.bio'}/celebrity/${celebrity.slug}`,
  }

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <CelebrityProfile celebrity={celebrity} />
    </>
  )
}
