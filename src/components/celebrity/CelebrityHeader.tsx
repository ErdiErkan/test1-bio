"use client"

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { calculateZodiac, getCountryInfo } from '@/lib/celebrity'
import type { SocialPlatform } from '@/lib/types'

// Sosyal medya platform konfigürasyonu - SVG ikonlar ve hover renkleri
const SOCIAL_PLATFORM_CONFIG: Record<
  SocialPlatform,
  { icon: React.ReactNode; hoverClass: string; label: string }
> = {
  INSTAGRAM: {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
    hoverClass: 'hover:text-pink-500',
    label: 'Instagram'
  },
  TWITTER: {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    hoverClass: 'hover:text-gray-900',
    label: 'Twitter / X'
  },
  YOUTUBE: {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
    hoverClass: 'hover:text-red-600',
    label: 'YouTube'
  },
  TIKTOK: {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
      </svg>
    ),
    hoverClass: 'hover:text-black',
    label: 'TikTok'
  },
  FACEBOOK: {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    hoverClass: 'hover:text-blue-600',
    label: 'Facebook'
  },
  LINKEDIN: {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
    hoverClass: 'hover:text-blue-700',
    label: 'LinkedIn'
  },
  WEBSITE: {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
    hoverClass: 'hover:text-green-600',
    label: 'Website'
  },
  IMDB: {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M14.31 9.588v.005c-.077-.048-.227-.07-.42-.07v4.815c.27 0 .44-.06.5-.165.062-.104.093-.4.093-.885v-2.94c0-.33-.004-.54-.033-.63-.022-.096-.067-.163-.14-.13zM22.416 0H1.584A1.584 1.584 0 0 0 0 1.584v20.832A1.584 1.584 0 0 0 1.584 24h20.832A1.584 1.584 0 0 0 24 22.416V1.584A1.584 1.584 0 0 0 22.416 0zM4.294 15.958H2.292V7.974h2.002v7.984zm6.24 0H8.762l-.165-1.092-.33-.002h-.534l-.165 1.094H5.798l1.254-7.984h2.318l1.164 7.984zm6.24 0h-1.674v-5.62c0-.103-.046-.153-.14-.153-.105 0-.173.054-.2.165v5.608h-1.675v-5.62c0-.103-.05-.153-.143-.153-.103 0-.17.054-.2.165v5.608H10.95V7.974h1.6l.082.615h.005c.165-.442.525-.663 1.08-.663.496 0 .823.16.982.48.155-.32.5-.48 1.037-.48.74 0 1.109.367 1.109 1.1v6.932zm3.56-2.166c0 .643-.032 1.088-.096 1.335-.064.247-.206.46-.424.637-.216.18-.495.27-.833.27-.293 0-.55-.047-.773-.14-.22-.094-.394-.24-.52-.44l-.002.002-.105.53h-1.785V7.974h1.785v2.078l.066-.01c.283-.32.64-.48 1.07-.48.36 0 .655.127.877.38.223.25.345.602.37 1.054l.002.008v2.788h.368z"/>
      </svg>
    ),
    hoverClass: 'hover:text-yellow-500',
    label: 'IMDb'
  },
  SPOTIFY: {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
      </svg>
    ),
    hoverClass: 'hover:text-green-500',
    label: 'Spotify'
  }
}

interface SocialMediaLink {
  id: string
  platform: SocialPlatform
  url: string
  displayOrder: number
}

interface Celebrity {
  id: string
  name: string
  nickname?: string | null
  profession?: string | null
  birthDate?: Date | string | null
  birthPlace?: string | null
  nationality?: string | null
  image?: string | null
  slug: string
  updatedAt?: Date | string
  socialMediaLinks?: SocialMediaLink[]
}

interface CelebrityHeaderProps {
  celebrity: Celebrity
}

export default function CelebrityHeader({ celebrity }: CelebrityHeaderProps) {
  const [imageError, setImageError] = useState(false)

  const formatDate = (dateString?: Date | string | null) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const calculateAge = (birthDate?: Date | string | null) => {
    if (!birthDate) return null
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }

    return age
  }

  const age = calculateAge(celebrity.birthDate)
  const zodiac = calculateZodiac(celebrity.birthDate)
  const country = getCountryInfo(celebrity.nationality)

  const birthDate = celebrity.birthDate ? new Date(celebrity.birthDate) : null
  const birthYear = birthDate?.getFullYear()
  
  // Cache busting için versiyon numarası (updatedAt varsa o, yoksa '1')
  const imageVersion = celebrity.updatedAt 
    ? new Date(celebrity.updatedAt).getTime() 
    : '1'

  // ✅ KRİTİK EKLENTİ: Resim URL Güvenlik Kontrolü
  // Dış kaynaklı (http/https) resimlerde ?v= parametresi hataya sebep olabilir.
  // Bu fonksiyon sadece yerel (kendi sunucumuzdaki) resimlere versiyon ekler.
  const getSafeImageUrl = (url: string | null | undefined) => {
    if (!url) return ''
    if (url.startsWith('http')) return url
    return `${url}?v=${imageVersion}`
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="md:flex">
        {/* Fotoğraf Alanı */}
        <div className="md:w-1/3">
          <div className="aspect-[3/4] relative bg-gray-100 flex items-center justify-center overflow-hidden">
            {celebrity.image && !imageError ? (
              <img
                src={getSafeImageUrl(celebrity.image)}
                alt={celebrity.name}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-600">
                <span className="text-9xl font-bold text-white select-none">
                  {celebrity.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bilgiler Alanı */}
        <div className="md:w-2/3 p-8">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {celebrity.nickname ? `${celebrity.name} (${celebrity.nickname})` : celebrity.name}
            </h1>
            {celebrity.profession && (
              <p className="text-xl text-blue-600 font-medium">
                {celebrity.profession}
              </p>
            )}
          </div>

          {/* Detaylar Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {celebrity.birthDate && (
              <div className="flex items-start space-x-3">
                <div className="text-2xl">📅</div>
                <div>
                  <div className="font-medium text-gray-700">Doğum Tarihi</div>
                  
                  {/* ✅ KRİTİK EKLENTİ: suppressHydrationWarning */}
                  {/* Sunucu ve İstemci arasındaki tarih formatı farkını (Ocak vs January) görmezden gelir */}
                  <div className="text-gray-900" suppressHydrationWarning={true}>
                    {birthYear && (
                      <Link
                        href={`/?birthYear=${birthYear}`}
                        className="hover:text-blue-600 hover:underline transition-colors"
                      >
                        {formatDate(celebrity.birthDate)}
                      </Link>
                    )}
                    {!birthYear && formatDate(celebrity.birthDate)}
                  </div>

                  {age && (
                    <div className="text-sm text-gray-500">{age} yaşında</div>
                  )}
                </div>
              </div>
            )}

            {celebrity.birthPlace && (
              <div className="flex items-start space-x-3">
                <div className="text-2xl">📍</div>
                <div>
                  <div className="font-medium text-gray-700">Doğum Yeri</div>
                  <div className="text-gray-900">{celebrity.birthPlace}</div>
                </div>
              </div>
            )}

            {zodiac && (
              <div className="flex items-start space-x-3">
                <div className="text-2xl">{zodiac.symbol}</div>
                <div>
                  <div className="font-medium text-gray-700">Burç</div>
                  <div className="text-gray-900">
                    <Link
                      href={`/?zodiac=${zodiac.sign}`}
                      className="hover:text-blue-600 hover:underline transition-colors"
                    >
                      {zodiac.nameTR}
                    </Link>
                  </div>
                  <div className="text-sm text-gray-500">{zodiac.dateRange}</div>
                </div>
              </div>
            )}

            {country && (
              <div className="flex items-start space-x-3">
                <div className="text-2xl">{country.flag}</div>
                <div>
                  <div className="font-medium text-gray-700">Uyruk</div>
                  <div className="text-gray-900">
                    <Link
                      href={`/?nationality=${country.code}`}
                      className="hover:text-blue-600 hover:underline transition-colors"
                    >
                      {country.name}
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sosyal Medya Linkleri - Sadece veri varsa render et */}
          {celebrity.socialMediaLinks && celebrity.socialMediaLinks.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center flex-wrap gap-4">
                {celebrity.socialMediaLinks.map((link) => {
                  const config = SOCIAL_PLATFORM_CONFIG[link.platform]
                  if (!config) return null

                  return (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${config.label} profili`}
                      className={`text-gray-400 transition-colors duration-200 ${config.hoverClass}`}
                      title={config.label}
                    >
                      {config.icon}
                    </a>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}