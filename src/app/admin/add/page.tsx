import CelebrityForm from '@/components/admin/CelebrityForm'
import Link from 'next/link'

export default function AddCelebrityPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/admin" className="hover:text-blue-600">Admin</Link>
            <span>→</span>
            <span className="text-gray-900">Yeni Ünlü Ekle</span>
          </div>
        </nav>

        <CelebrityForm />
      </div>
    </div>
  )
}
