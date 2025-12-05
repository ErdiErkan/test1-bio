import { notFound } from 'next/navigation'
import CelebrityProfile from '@/components/celebrity/CelebrityProfile'
import { prisma } from '@/lib/db'
import { getCelebrityDescription } from '@/lib/celebrity'
import { generatePersonSchema } from '@/lib/seo' // YENİ: SEO yardımcı fonksiyonu import edildi
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: Promise<{ slug: string }>
}

// Celebrity verisi getir
async function getCelebrity(slug: string) {
  try {
    const celebrity = await prisma.celebrity.findUnique({
      where: { slug },
      include: {
        categories: true,
        socialMediaLinks: {
          orderBy: { displayOrder: 'asc' }
        },
        images: {
          orderBy: { displayOrder: 'asc' }
        },
        faqs: {
          orderBy: { displayOrder: 'asc' }
        }
      }
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

  // Meta description için dinamik açıklama (max 160 karakter)
  const description = getCelebrityDescription(celebrity, 160)

  return {
    title: `${celebrity.name} Biyografisi, Hayatı ve Kariyeri - CelebHub`, // Başlık biraz daha zenginleştirildi
    description: description,
    openGraph: {
      title: `${celebrity.name} Kimdir? - Biyografisi ve Hayatı`,
      description: description,
      images: celebrity.image ? [celebrity.image] : [],
      type: 'profile',
      url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://whoo.bio'}/celebrity/${celebrity.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${celebrity.name} - CelebHub`,
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

  // YENİ: Merkezi SEO fonksiyonundan şemayı alıyoruz.
  // getCountryInfo veya manuel JSON oluşturma işlemlerine artık gerek yok.
  const structuredData = generatePersonSchema(celebrity)

  return (
    <>
      {/* Structured Data (JSON-LD) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <CelebrityProfile celebrity={celebrity} />
    </>
  )
}