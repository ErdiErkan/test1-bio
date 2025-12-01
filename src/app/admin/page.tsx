"use client"

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useToast } from '@/hooks/useToast'

interface Celebrity {
  id: string
  name: string
  profession?: string | null
  birthDate?: string | null
  image?: string | null
  slug: string
  createdAt: string
}

export default function AdminPage() {
  const [celebrities, setCelebrities] = useState<Celebrity[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState<Celebrity | null>(null)
  const { addToast } = useToast()

  // DÜZELTME: Fonksiyon useCallback içine alındı
  const fetchCelebrities = useCallback(async () => {
    try {
      const response = await fetch('/api/celebrities?limit=50')

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.celebrities && Array.isArray(data.celebrities)) {
        setCelebrities(data.celebrities)
      } else if (Array.isArray(data)) {
        setCelebrities(data)
      } else {
        console.error('Invalid response format:', data)
        setCelebrities([])
        addToast('Geçersiz veri formatı alındı', 'error')
      }
    } catch (error) {
      console.error('Fetch error:', error)
      setCelebrities([])
      addToast('Ünlüler yüklenirken hata oluştu', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  // DÜZELTME: useEffect bağımlılık dizisine fetchCelebrities eklendi
  useEffect(() => {
    fetchCelebrities()
  }, [fetchCelebrities])

  const handleDelete = async (celebrity: Celebrity) => {
    setDeletingId(celebrity.id)
    try {
      const response = await fetch(`/api/celebrities/${celebrity.id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Silme işlemi başarısız')
      addToast('Ünlü başarıyla silindi!', 'success')
      setShowDeleteModal(null)
      fetchCelebrities()
    } catch (error) {
      addToast('Silme hatası', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-gray-600">Ünlü biyografilerini yönetin</p>
        </div>

        {/* Navigation */}
        <div className="mb-8 flex gap-4">
          <Link
            href="/admin"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Ünlüler
          </Link>
          <Link
            href="/admin/categories"
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Kategoriler
          </Link>
          <Link
            href="/"
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Ana Sayfa
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">👥</div>
              <div>
                <div className="text-sm font-medium text-gray-500">Toplam Ünlü</div>
                <div className="text-2xl font-bold text-gray-900">{celebrities.length}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Ünlü Listesi</h2>
            <Link
              href="/admin/add"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              ➕ Yeni Ünlü Ekle
            </Link>
          </div>
        </div>

        {celebrities.length === 0 ? (
          <div className="bg-white rounded-lg shadow text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz ünlü eklenmemiş</h3>
            <Link href="/admin/add" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 mt-4">
              ➕ İlk Ünlüyü Ekle
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ünlü</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Meslek</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Eklenme</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {celebrities.map((celebrity) => (
                  <tr key={celebrity.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {celebrity.image ? (
                            <Image src={celebrity.image} alt={celebrity.name} width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-lg">👤</div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{celebrity.name}</div>
                          <Link href={`/celebrity/${celebrity.slug}`} target="_blank" className="text-sm text-blue-600 hover:text-blue-800">
                            Görüntüle ↗
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{celebrity.profession || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(celebrity.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/admin/edit/${celebrity.id}`} className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 mr-2">
                        ✏️ Düzenle
                      </Link>
                      <button onClick={() => setShowDeleteModal(celebrity)} className="bg-red-600 text-white px-3 py-2 rounded-md text-sm hover:bg-red-700">
                        🗑️ Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4">🗑️ Ünlüyü Sil</h3>
              <p className="text-gray-600 mb-6">
                <strong>{showDeleteModal.name}</strong> adlı ünlüyü silmek istediğinizden emin misiniz?
              </p>
              <div className="flex justify-end space-x-4">
                <button onClick={() => setShowDeleteModal(null)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                  İptal
                </button>
                <button onClick={() => handleDelete(showDeleteModal)} disabled={deletingId === showDeleteModal.id} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50">
                  {deletingId === showDeleteModal.id ? 'Siliniyor...' : 'Sil'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
