import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-md mx-auto text-center">
        <div className="text-9xl mb-6">🔍</div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Sayfa Bulunamadı
        </h1>

        <p className="text-gray-600 mb-8">
          Aradığınız sayfa bulunamadı. Ana sayfadan devam edebilirsiniz.
        </p>

        <Link
          href="/"
          className="inline-block bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
        >
          🏠 Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  )
}
