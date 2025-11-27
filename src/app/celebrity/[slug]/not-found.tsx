"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-md mx-auto text-center">
        <div className="text-9xl mb-6">🤷‍♂️</div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Ünlü Bulunamadı
        </h1>

        <p className="text-gray-600 mb-8">
          Aradığınız ünlü bulunamadı. URL'yi kontrol edin veya ana sayfadan tekrar deneyin.
        </p>

        <div className="space-y-4">
          <Link
            href="/"
            className="block w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
          >
            🏠 Ana Sayfaya Dön
          </Link>

          <button
            onClick={() => router.back()}
            className="block w-full bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← Geri Dön
          </button>
        </div>
      </div>
    </div>
  )
}
