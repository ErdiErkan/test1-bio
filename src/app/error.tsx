'use client'

import { useEffect } from 'react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console in development
    console.error('Application Error:', error)
    
    // In production, you could send to error tracking service
    // Example: Sentry.captureException(error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="text-8xl mb-6">😵</div>
        
        {/* Error Title */}
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Bir Şeyler Ters Gitti
        </h1>
        
        {/* Error Description */}
        <p className="text-gray-600 mb-6">
          Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin veya ana sayfaya dönün.
        </p>

        {/* Error Details (Development Only) */}
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

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            🔄 Tekrar Dene
          </button>
          
          <a
            href="/"
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            🏠 Ana Sayfa
          </a>
        </div>

        {/* Support Link */}
        <p className="mt-8 text-sm text-gray-500">
          Sorun devam ederse{' '}
          <a href="/admin" className="text-blue-600 hover:underline">
            yönetici paneline
          </a>{' '}
          göz atın.
        </p>
      </div>
    </div>
  )
}
