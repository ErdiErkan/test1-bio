"use client"

import { useState } from 'react'
import Image from 'next/image'

interface Celebrity {
  id: string
  name: string
  profession?: string | null
  birthDate?: Date | string | null
  birthPlace?: string | null
  image?: string | null
  slug: string
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

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="md:flex">
        {/* Fotoğraf */}
        <div className="md:w-1/3">
          <div className="aspect-[3/4] relative bg-gray-100 flex items-center justify-center overflow-hidden">
            {celebrity.image && !imageError ? (
              <img
                // DÜZELTME: Cache busting eklendi
                src={`${celebrity.image}?v=${new Date().getTime()}`}
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

        {/* Bilgiler */}
        <div className="md:w-2/3 p-8">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {celebrity.name}
            </h1>
            {celebrity.profession && (
              <p className="text-xl text-blue-600 font-medium">
                {celebrity.profession}
              </p>
            )}
          </div>

          {/* Kısa Bilgiler */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {celebrity.birthDate && (
              <div className="flex items-start space-x-3">
                <div className="text-2xl">📅</div>
                <div>
                  <div className="font-medium text-gray-700">Doğum Tarihi</div>
                  <div className="text-gray-900">{formatDate(celebrity.birthDate)}</div>
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
          </div>
        </div>
      </div>
    </div>
  )
}