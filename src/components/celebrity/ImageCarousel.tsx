'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Image from 'next/image'
import type { CelebrityImage } from '@/lib/types'

interface ImageCarouselProps {
  images: CelebrityImage[]
  celebrityName: string
  fallbackLetter?: string
}

export default function ImageCarousel({
  images,
  celebrityName,
  fallbackLetter
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())
  const [isHovering, setIsHovering] = useState(false)

  // Touch/swipe handling
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const validImages = images.filter(img => !imageErrors.has(img.id))
  const hasMultipleImages = validImages.length > 1

  // Get the current image or first valid one
  const currentImage = validImages[currentIndex] || validImages[0]

  // Handle image load error
  const handleImageError = useCallback((imageId: string) => {
    setImageErrors(prev => new Set(prev).add(imageId))
    // If current image failed, try to move to next valid one
    if (currentImage?.id === imageId) {
      const nextValidIndex = validImages.findIndex(img => img.id !== imageId)
      if (nextValidIndex >= 0) {
        setCurrentIndex(nextValidIndex)
      }
    }
  }, [currentImage, validImages])

  // Navigation handlers
  const goToPrevious = useCallback(() => {
    setCurrentIndex(prev => (prev === 0 ? validImages.length - 1 : prev - 1))
  }, [validImages.length])

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => (prev === validImages.length - 1 ? 0 : prev + 1))
  }, [validImages.length])

  const goToIndex = useCallback((index: number) => {
    setCurrentIndex(index)
  }, [])

  // Touch event handlers for mobile swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchEndX.current = null
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (!touchStartX.current || !touchEndX.current) return

    const diff = touchStartX.current - touchEndX.current
    const threshold = 50 // Minimum swipe distance

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // Swiped left - go to next
        goToNext()
      } else {
        // Swiped right - go to previous
        goToPrevious()
      }
    }

    // Reset
    touchStartX.current = null
    touchEndX.current = null
  }, [goToNext, goToPrevious])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hasMultipleImages) return

      if (e.key === 'ArrowLeft') {
        goToPrevious()
      } else if (e.key === 'ArrowRight') {
        goToNext()
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('keydown', handleKeyDown)
      return () => container.removeEventListener('keydown', handleKeyDown)
    }
  }, [hasMultipleImages, goToNext, goToPrevious])

  // Fallback when no valid images
  if (validImages.length === 0) {
    return (
      <div className="aspect-[3/4] relative bg-blue-600 flex items-center justify-center">
        <span className="text-9xl font-bold text-white select-none">
          {fallbackLetter || celebrityName.charAt(0).toUpperCase()}
        </span>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="aspect-[3/4] relative bg-gray-100 overflow-hidden group"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      tabIndex={hasMultipleImages ? 0 : -1}
      role="region"
      aria-label={`${celebrityName} fotoğraf galerisi`}
      aria-roledescription="carousel"
    >
      {/* Main Image - Only current image is loaded with priority */}
      {validImages.map((image, index) => (
        <div
          key={image.id}
          className={`absolute inset-0 transition-opacity duration-300 ${
            index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
          aria-hidden={index !== currentIndex}
        >
          <Image
            src={image.url}
            alt={`${celebrityName} - Fotoğraf ${index + 1}`}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
            priority={index === currentIndex}
            loading={index === currentIndex ? 'eager' : 'lazy'}
            onError={() => handleImageError(image.id)}
          />
        </div>
      ))}

      {/* Navigation Arrows - Only show when multiple images and hovering */}
      {hasMultipleImages && (
        <>
          {/* Previous Arrow */}
          <button
            onClick={goToPrevious}
            className={`absolute left-2 top-1/2 -translate-y-1/2 z-20
              w-10 h-10 md:w-12 md:h-12 min-h-[44px] min-w-[44px]
              flex items-center justify-center
              bg-black/40 hover:bg-black/60
              text-white rounded-full
              transition-all duration-300
              ${isHovering ? 'opacity-100' : 'opacity-0 md:opacity-0'}
              focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white`}
            aria-label="Önceki fotoğraf"
          >
            <svg
              className="w-5 h-5 md:w-6 md:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Next Arrow */}
          <button
            onClick={goToNext}
            className={`absolute right-2 top-1/2 -translate-y-1/2 z-20
              w-10 h-10 md:w-12 md:h-12 min-h-[44px] min-w-[44px]
              flex items-center justify-center
              bg-black/40 hover:bg-black/60
              text-white rounded-full
              transition-all duration-300
              ${isHovering ? 'opacity-100' : 'opacity-0 md:opacity-0'}
              focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white`}
            aria-label="Sonraki fotoğraf"
          >
            <svg
              className="w-5 h-5 md:w-6 md:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {/* Dot Indicators */}
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2"
            role="tablist"
            aria-label="Fotoğraf seçimi"
          >
            {validImages.map((image, index) => (
              <button
                key={image.id}
                onClick={() => goToIndex(index)}
                className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full transition-all duration-300
                  min-h-[44px] min-w-[44px] flex items-center justify-center
                  focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black/50`}
                role="tab"
                aria-selected={index === currentIndex}
                aria-label={`Fotoğraf ${index + 1}`}
              >
                <span
                  className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full transition-all duration-300
                    ${index === currentIndex
                      ? 'bg-white scale-110'
                      : 'bg-white/50 hover:bg-white/75'
                    }`}
                />
              </button>
            ))}
          </div>

          {/* Image Counter */}
          <div className="absolute top-4 right-4 z-20 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
            {currentIndex + 1} / {validImages.length}
          </div>
        </>
      )}

      {/* Mobile swipe hint - only show briefly on first interaction */}
      {hasMultipleImages && (
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-20 md:hidden">
          <p className="text-white/70 text-xs bg-black/30 px-3 py-1 rounded-full">
            Kaydırarak değiştirin
          </p>
        </div>
      )}
    </div>
  )
}
