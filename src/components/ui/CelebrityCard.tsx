'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface Celebrity {
  id: string
  name: string
  profession?: string | null
  birthDate?: Date | string | null
  image?: string | null
  images?: { url: string }[]
  slug: string
}

interface CelebrityCardProps {
  celebrity: Celebrity
}

// Yaş hesaplama
function calculateAge(birthDate: Date | string | null | undefined): number | null {
  if (!birthDate) return null
  try {
    const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate
    if (isNaN(birth.getTime())) return null
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age >= 0 ? age : null
  } catch {
    return null
  }
}

// Placeholder image
function getPlaceholderImage(name?: string): string {
  const initial = name?.charAt(0).toUpperCase() || '?'
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&size=400&background=6366f1&color=ffffff&bold=true`
}

export default function CelebrityCard({ celebrity }: CelebrityCardProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  const age = calculateAge(celebrity.birthDate)
  
  // Image URL işleme (GÜNCELLENDİ)
  let imageUrl = getPlaceholderImage(celebrity.name)
  
  if (!imageError) {
    // 1. Önce yeni sistemdeki images dizisine bak (ilk eleman ana resim varsayılır)
    if (celebrity.images && celebrity.images.length > 0) {
      imageUrl = celebrity.images[0].url
    } 
    // 2. Yoksa eski image alanına bak
    else if (celebrity.image) {
      imageUrl = celebrity.image
    }
  }

  // URL düzeltme (Relative path kontrolü ve garanti altına alma)
  if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:') && !imageUrl.startsWith('/')) {
    imageUrl = `/${imageUrl}`
  }

  return (
    <Link
      href={`/celebrity/${celebrity.slug}`}
      className="group block bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100"
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
        {/* Loading Skeleton */}
        {imageLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}
        
        <Image
          src={imageUrl}
          alt={celebrity.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={`object-cover group-hover:scale-105 transition-transform duration-300 ${
            imageLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={() => setImageLoading(false)}
          onError={() => {
            setImageError(true)
            setImageLoading(false)
          }}
          unoptimized // Harici URL'ler veya blob için garanti olsun
        />
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
          {celebrity.name}
        </h3>
        
        {celebrity.profession && (
          <p className="text-sm text-gray-500 mt-1 truncate">
            {celebrity.profession}
          </p>
        )}
        
        {age !== null && (
          <p className="text-xs text-gray-400 mt-2">
            {age} yaşında
          </p>
        )}
      </div>
    </Link>
  )
}