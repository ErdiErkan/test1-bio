'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { getCategories } from '@/actions/categories'
import { getUniqueNationalities } from '@/actions/celebrities'
import type { DataQualityFilter } from '@/lib/types'

interface Category {
  id: string
  name: string
  slug: string
}

const DATA_QUALITY_OPTIONS: { value: DataQualityFilter; label: string; icon: string }[] = [
  { value: 'no_bio', label: 'Biyografisi Yok', icon: '📝' },
  { value: 'no_image', label: 'Resmi Yok', icon: '🖼️' },
  { value: 'has_pending_reports', label: 'Bekleyen Raporlar', icon: '⚠️' },
  { value: 'no_faqs', label: "SSS'i Yok", icon: '❓' },
]

interface AdminFilterBarProps {
  onFiltersChange?: (filters: {
    query: string
    category: string
    nationality: string
    dataQuality: DataQualityFilter | ''
  }) => void
}

export default function AdminFilterBar({ onFiltersChange }: AdminFilterBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Initialize from URL params
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [nationality, setNationality] = useState(searchParams.get('nationality') || '')
  const [dataQuality, setDataQuality] = useState<DataQualityFilter | ''>(
    (searchParams.get('dataQuality') as DataQualityFilter) || ''
  )

  const [categories, setCategories] = useState<Category[]>([])
  const [nationalities, setNationalities] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load filter options
  useEffect(() => {
    async function loadOptions() {
      setIsLoading(true)
      try {
        const [categoriesResult, nationalitiesResult] = await Promise.all([
          getCategories(),
          getUniqueNationalities()
        ])

        if (categoriesResult.success && categoriesResult.data) {
          setCategories(categoriesResult.data)
        }
        if (nationalitiesResult.success && nationalitiesResult.data) {
          setNationalities(nationalitiesResult.data)
        }
      } finally {
        setIsLoading(false)
      }
    }
    loadOptions()
  }, [])

  // Update URL when filters change
  const updateUrl = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })

    // Reset to page 1 when filters change
    params.delete('page')

    const newUrl = `${pathname}?${params.toString()}`
    router.push(newUrl, { scroll: false })
  }, [pathname, router, searchParams])

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateUrl({ q: query })
      onFiltersChange?.({
        query,
        category,
        nationality,
        dataQuality
      })
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query]) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle other filter changes immediately
  const handleCategoryChange = (value: string) => {
    setCategory(value)
    updateUrl({ category: value })
    onFiltersChange?.({
      query,
      category: value,
      nationality,
      dataQuality
    })
  }

  const handleNationalityChange = (value: string) => {
    setNationality(value)
    updateUrl({ nationality: value })
    onFiltersChange?.({
      query,
      category,
      nationality: value,
      dataQuality
    })
  }

  const handleDataQualityChange = (value: DataQualityFilter | '') => {
    setDataQuality(value)
    updateUrl({ dataQuality: value })
    onFiltersChange?.({
      query,
      category,
      nationality,
      dataQuality: value
    })
  }

  // Clear all filters
  const handleClearFilters = () => {
    setQuery('')
    setCategory('')
    setNationality('')
    setDataQuality('')
    router.push(pathname, { scroll: false })
    onFiltersChange?.({
      query: '',
      category: '',
      nationality: '',
      dataQuality: ''
    })
  }

  const hasActiveFilters = query || category || nationality || dataQuality

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <label htmlFor="admin-search" className="sr-only">
            Ara
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              id="admin-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="İsim veya meslek ara..."
              className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="w-full lg:w-48">
          <label htmlFor="category-filter" className="sr-only">
            Kategori
          </label>
          <select
            id="category-filter"
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px] bg-white"
            disabled={isLoading}
          >
            <option value="">Tüm Kategoriler</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Nationality Filter */}
        <div className="w-full lg:w-40">
          <label htmlFor="nationality-filter" className="sr-only">
            Uyruk
          </label>
          <select
            id="nationality-filter"
            value={nationality}
            onChange={(e) => handleNationalityChange(e.target.value)}
            className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px] bg-white"
            disabled={isLoading}
          >
            <option value="">Tüm Uyruklar</option>
            {nationalities.map((nat) => (
              <option key={nat} value={nat}>
                {nat}
              </option>
            ))}
          </select>
        </div>

        {/* Data Quality Filter */}
        <div className="w-full lg:w-56">
          <label htmlFor="quality-filter" className="sr-only">
            Veri Kalitesi
          </label>
          <select
            id="quality-filter"
            value={dataQuality}
            onChange={(e) => handleDataQualityChange(e.target.value as DataQualityFilter | '')}
            className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px] bg-white"
          >
            <option value="">Veri Sorunları</option>
            {DATA_QUALITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="flex items-center justify-center px-4 py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors min-h-[44px] whitespace-nowrap"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Filtreleri Temizle
          </button>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
          <span className="text-sm text-gray-500">Aktif filtreler:</span>
          {query && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
              Arama: {query}
              <button
                onClick={() => setQuery('')}
                className="ml-1 text-blue-500 hover:text-blue-700"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </span>
          )}
          {category && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
              Kategori: {categories.find(c => c.slug === category)?.name || category}
              <button
                onClick={() => handleCategoryChange('')}
                className="ml-1 text-green-500 hover:text-green-700"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </span>
          )}
          {nationality && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-full">
              Uyruk: {nationality}
              <button
                onClick={() => handleNationalityChange('')}
                className="ml-1 text-purple-500 hover:text-purple-700"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </span>
          )}
          {dataQuality && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded-full">
              {DATA_QUALITY_OPTIONS.find(o => o.value === dataQuality)?.label}
              <button
                onClick={() => handleDataQualityChange('')}
                className="ml-1 text-orange-500 hover:text-orange-700"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
