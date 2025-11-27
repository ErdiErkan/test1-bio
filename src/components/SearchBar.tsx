'use client'

import { useState, useEffect } from 'react'
import { Celebrity } from '@/lib/types'
import Link from 'next/link'

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Celebrity[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    const searchCelebrities = async () => {
      if (query.trim() === '') {
        setResults([])
        setShowResults(false)
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await response.json()
        setResults(data)
        setShowResults(true)
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    const debounceTimer = setTimeout(searchCelebrities, 300)
    return () => clearTimeout(debounceTimer)
  }, [query])

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <input
        type="text"
        placeholder="Ünlü ara..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setShowResults(true)}
        onBlur={() => setTimeout(() => setShowResults(false), 200)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />

      {showResults && query.trim() !== '' && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Aranıyor...</div>
          ) : results.length > 0 ? (
            <ul>
              {results.map((celebrity) => (
                <li key={celebrity.id}>
                  <Link
                    href={`/celebrity/${celebrity.slug}`}
                    className="block p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-semibold text-gray-900">{celebrity.name}</div>
                    {celebrity.profession && (
                      <div className="text-sm text-gray-600">{celebrity.profession}</div>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-gray-500">Sonuç bulunamadı</div>
          )}
        </div>
      )}
    </div>
  )
}
