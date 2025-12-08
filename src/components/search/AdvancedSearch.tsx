'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { searchCelebrities } from '@/actions/celebrities'
import { Link } from '@/i18n/routing'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'

interface Celebrity {
  id: string
  name: string
  profession?: string | null
  image?: string | null
  slug: string
  categories?: { id: string; name: string; slug: string }[]
}

interface Category {
  id: string
  name: string
  slug: string
}

interface AdvancedSearchProps {
  categories: Category[]
}

export default function AdvancedSearch({ categories }: AdvancedSearchProps) {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('search')
  const tCommon = useTranslations('common')
  const tCelebrity = useTranslations('celebrity')

  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [suggestions, setSuggestions] = useState<Celebrity[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  // Dışarı tıklayınca autocomplete kapat
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    if (query.length >= 2) {
      setIsSearching(true)
      debounceTimer.current = setTimeout(async () => {
        const result = await searchCelebrities({
          query,
          categorySlug: selectedCategory || undefined,
          limit: 5,
          locale
        })

        if (result.success && result.data) {
          setSuggestions(result.data)
          setShowSuggestions(true)
        }
        setIsSearching(false)
      }, 300) // 300ms debounce
    } else {
      setSuggestions([])
      setShowSuggestions(false)
      setIsSearching(false)
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [query, selectedCategory, locale])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (selectedCategory) params.set('category', selectedCategory)

    router.push(`/?${params.toString()}`)
    setShowSuggestions(false)
  }

  const handleCategoryChange = (categorySlug: string) => {
    setSelectedCategory(categorySlug)

    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (categorySlug) params.set('category', categorySlug)

    router.push(`/?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      {/* Ana Arama */}
      <div className="relative" ref={searchRef}>
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('placeholder')}
            className="w-full px-6 py-4 pr-12 text-lg text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-blue-600 transition-colors"
            aria-label={tCommon('search')}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {isSearching && (
            <div className="absolute right-12 top-1/2 -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            </div>
          )}
        </form>

        {/* Autocomplete Önerileri */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
            {suggestions.map((celebrity) => (
              <Link
                key={celebrity.id}
                href={{
                  pathname: '/celebrity/[slug]',
                  params: { slug: celebrity.slug }
                }}
                onClick={() => {
                  setShowSuggestions(false)
                  setQuery('')
                }}
                className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
              >
                <div className="flex-shrink-0 w-12 h-12 mr-4">
                  {celebrity.image ? (
                    <Image
                      src={celebrity.image}
                      alt={celebrity.name}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-xl">
                      👤
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{celebrity.name}</div>
                  <div className="text-sm text-gray-500">
                    {celebrity.profession || tCelebrity('profession_unknown')}
                    {celebrity.categories && celebrity.categories.length > 0 && (
                      <span className="ml-2">
                        • {celebrity.categories.map(c => c.name).join(', ')}
                      </span>
                    )}
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Kategori Filtreleri */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => handleCategoryChange('')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${!selectedCategory
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          {t('all')}
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryChange(category.slug)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedCategory === category.slug
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Aktif Filtreler */}
      {(query || selectedCategory) && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-white font-medium">{tCommon('active_filters')}:</span>
          {query && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
              {tCommon('search_label')}: {query}
              <button
                onClick={() => {
                  setQuery('')
                  router.push(selectedCategory ? `/?category=${selectedCategory}` : '/')
                }}
                className="ml-2 text-blue-900 hover:text-blue-700"
              >
                ✕
              </button>
            </span>
          )}
          {selectedCategory && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
              {tCommon('category')}: {categories.find(c => c.slug === selectedCategory)?.name}
              <button
                onClick={() => {
                  setSelectedCategory('')
                  router.push(query ? `/?q=${query}` : '/')
                }}
                className="ml-2 text-blue-900 hover:text-blue-700"
              >
                ✕
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
