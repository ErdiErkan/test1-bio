'use client'

import { useEffect } from 'react'
import Link from 'next/link'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Application Error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-8xl mb-6">😵</div>
        
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Bir Şeyler Ters Gitti
        </h1>
        
        <p className="text-gray-600 mb-6">
          Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin veya ana sayfaya dönün.
        </p>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
            <p className="text-sm font-medium text-red-800 mb-1">Hata Detayı:</p>
            <p className="text-sm text-red-600 font-mono break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-red-400 mt-2">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            🔄 Tekrar Dene
          </button>
          
          {/* DÜZELTME: <a> etiketi <Link> ile değiştirildi */}
          <Link
            href="/"
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            🏠 Ana Sayfa
          </Link>
        </div>

        <p className="mt-8 text-sm text-gray-500">
          Sorun devam ederse{' '}
          {/* Dış link olduğu için buradaki <a> kalabilir veya Link kullanılabilir ama iç navigasyon için Link daha iyidir */}
          <Link href="/admin" className="text-blue-600 hover:underline">
            yönetici paneline
          </Link>{' '}
          göz atın.
        </p>
      </div>
    </div>
  )
}
