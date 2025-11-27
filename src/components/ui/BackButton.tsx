"use client"

import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function BackButton() {
  const router = useRouter()

  return (
    <div className="flex items-center space-x-4">
      <button
        onClick={() => router.back()}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <span className="text-xl">←</span>
        <span>Geri</span>
      </button>

      <span className="text-gray-300">|</span>

      <Link
        href="/"
        className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
      >
        <span className="text-xl">🏠</span>
        <span>Ana Sayfa</span>
      </Link>
    </div>
  )
}
