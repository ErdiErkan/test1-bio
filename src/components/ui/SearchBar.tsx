"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface SearchBarProps {
  placeholder?: string
  onSearch?: (query: string) => void
}

export default function SearchBar({
  placeholder = "Ünlü ara...",
  onSearch
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      if (onSearch) {
        onSearch(query.trim())
      } else {
        router.push(`/?search=${encodeURIComponent(query.trim())}`)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-full focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 shadow-sm"
        />
        <button
          type="submit"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          🔍 Ara
        </button>
      </div>
    </form>
  )
}
