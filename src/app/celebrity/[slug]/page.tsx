import { notFound } from 'next/navigation'
import CelebrityProfile from '@/components/celebrity/CelebrityProfile'
import { prisma } from '@/lib/db'
import { getCelebrityDescription } from '@/lib/celebrity'
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

  return <CelebrityProfile celebrity={celebrity} />
}
