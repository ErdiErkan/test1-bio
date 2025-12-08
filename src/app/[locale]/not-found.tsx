import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sayfa Bulunamadı - CelebHub',
  description: 'Aradığınız sayfa bulunamadı.',
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Icon */}
        <div className="text-9xl font-bold text-gray-200 mb-4">404</div>
        
        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Sayfa Bulunamadı
        </h1>
        
        {/* Description */}
        <p className="text-gray-600 mb-8">
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </p>

        {/* Suggestions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <p className="text-sm text-gray-500 mb-4">Bunları deneyebilirsiniz:</p>
          <ul className="text-sm text-gray-600 space-y-2 text-left">
            <li>• URL adresini kontrol edin</li>
            <li>• Ana sayfadan aramayı kullanın</li>
            <li>• Ünlü listesine göz atın</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            🏠 Ana Sayfa
          </Link>
          
          <Link
            href="/admin"
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            ⚙️ Admin Panel
          </Link>
        </div>
      </div>
    </div>
  )
}
