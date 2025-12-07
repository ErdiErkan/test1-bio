"use client"

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

interface SearchBarProps {
  placeholder?: string
  onSearch?: (query: string) => void
  initialValue?: string
  clearAfterSearch?: boolean
}

export default function SearchBar({
  placeholder,
  onSearch,
  initialValue = '',
  clearAfterSearch = true
}: SearchBarProps) {
  const [query, setQuery] = useState(initialValue)
  const [isSearching, setIsSearching] = useState(false)
  const router = useRouter()
  const t = useTranslations('common')
  const tSearch = useTranslations('search')

  const effectivePlaceholder = placeholder || tSearch('placeholder')

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedQuery = query.trim()
    if (!trimmedQuery) return

    setIsSearching(true)

    try {
      if (onSearch) {
        onSearch(trimmedQuery)
      } else {
        router.push(`/?q=${encodeURIComponent(trimmedQuery)}`)
      }

      if (clearAfterSearch) {
        setQuery('')
      }
    } finally {
      setIsSearching(false)
    }
  }, [query, onSearch, router, clearAfterSearch])

  const handleClear = useCallback(() => {
    setQuery('')
    router.push('/')
  }, [router])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }, [])

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={effectivePlaceholder}
          disabled={isSearching}
          autoComplete="off"
          className="w-full px-6 py-4 pr-32 text-lg text-gray-900 bg-white border-2 border-gray-300 rounded-full focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 shadow-sm placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-24 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none p-1 transition-colors"
            aria-label={t('clear_search')}
          >
            ✕
          </button>
        )}

        <button
          type="submit"
          disabled={isSearching || !query.trim()}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSearching ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              ...
            </span>
          ) : (
            `🔍 ${t('search_btn')}`
          )}
        </button>
      </div>
    </form>
  )
}
