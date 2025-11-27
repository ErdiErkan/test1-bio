'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Celebrity } from '@/lib/types'
import AdminForm from '@/components/AdminForm'
import { formatDate } from '@/lib/utils'

export default function AdminPage() {
  const [celebrities, setCelebrities] = useState<Celebrity[]>([])
  const [editingCelebrity, setEditingCelebrity] = useState<Celebrity | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchCelebrities()
  }, [])

  const fetchCelebrities = async () => {
    try {
      const response = await fetch('/api/celebrities')
      const data = await response.json()
      setCelebrities(data)
    } catch (error) {
      console.error('Error fetching celebrities:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" isimli ünlüyü silmek istediğinize emin misiniz?`)) {
      return
    }

    try {
      const response = await fetch(`/api/celebrities/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchCelebrities()
      } else {
        alert('Silme işlemi başarısız oldu')
      }
    } catch (error) {
      console.error('Error deleting celebrity:', error)
      alert('Bir hata oluştu')
    }
  }

  const handleEdit = (celebrity: Celebrity) => {
    setEditingCelebrity(celebrity)
    setShowForm(true)
  }

  const handleSuccess = () => {
    setShowForm(false)
    setEditingCelebrity(null)
    fetchCelebrities()
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingCelebrity(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
            >
              Ana Sayfa
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Add New Celebrity Button */}
        {!showForm && (
          <div className="mb-6">
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              + Yeni Ünlü Ekle
            </button>
          </div>
        )}

        {/* Form Section */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingCelebrity ? 'Ünlü Düzenle' : 'Yeni Ünlü Ekle'}
            </h2>
            <AdminForm
              celebrity={editingCelebrity || undefined}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </div>
        )}

        {/* Celebrities List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              Mevcut Ünlüler ({celebrities.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="p-6 text-center text-gray-500">Yükleniyor...</div>
          ) : celebrities.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Henüz hiç ünlü eklenmemiş.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İsim
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Meslek
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doğum Tarihi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Eklenme
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {celebrities.map((celebrity) => (
                    <tr key={celebrity.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/celebrity/${celebrity.slug}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {celebrity.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {celebrity.profession || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(celebrity.birthDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(celebrity.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(celebrity)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => handleDelete(celebrity.id, celebrity.name)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Sil
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-gray-600 text-sm">
            © 2024 Ünlü Biyografi Platformu. Tüm hakları saklıdır.
          </p>
        </div>
      </footer>
    </div>
  )
}
