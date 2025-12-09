"use client"

import Image from 'next/image'
import { useState, useEffect, useCallback, Suspense, ReactNode } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useToast } from '@/hooks/useToast'
import AdminFilterBar from '@/components/admin/AdminFilterBar'
import type { DataQualityFilter, CelebrityImage, FAQ } from '@/lib/types'
import { useTranslations } from 'next-intl'

interface Celebrity {
  id: string
  name: string
  profession?: string | null
  birthDate?: string | null
  image?: string | null
  images?: CelebrityImage[]
  faqs?: FAQ[]
  slug: string
  createdAt: string
  _count?: {
    reports: number
  }
}

// Smart Avatar Component
const CelebrityAvatar = ({ celebrity }: { celebrity: Celebrity }) => {
  const [error, setError] = useState(false)

  // Get image URL from new images array or legacy field
  const imageUrl = celebrity.images && celebrity.images.length > 0
    ? celebrity.images.find(img => img.isMain)?.url || celebrity.images[0]?.url
    : celebrity.image

  if (imageUrl && !error) {
    return (
      <Image
        src={`${imageUrl}?v=${new Date().getTime()}`}
        alt={celebrity.name}
        width={40}
        height={40}
        className="h-10 w-10 rounded-full object-cover border border-gray-200"
        onError={() => setError(true)}
      />
    )
  }

  return (
    <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
      {celebrity.name.charAt(0).toUpperCase()}
    </div>
  )
}

// Data quality badges
const DataQualityBadges = ({ celebrity }: { celebrity: Celebrity }) => {
  const badges: { label: string; color: string }[] = []
  // Not: Rozet isimleri şimdilik statik, isterseniz çeviri ekleyebilirsiniz.
  const hasImages = (celebrity.images && celebrity.images.length > 0) || celebrity.image
  if (!hasImages) {
    badges.push({ label: 'Resim Yok', color: 'bg-yellow-100 text-yellow-800' })
  }

  if (!celebrity.faqs || celebrity.faqs.length === 0) {
    badges.push({ label: 'SSS Yok', color: 'bg-gray-100 text-gray-600' })
  }

  if (celebrity._count && celebrity._count.reports > 0) {
    badges.push({ label: `${celebrity._count.reports} Rapor`, color: 'bg-red-100 text-red-800' })
  }

  if (badges.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {badges.map((badge, idx) => (
        <span key={idx} className={`inline-flex items-center px-2 py-0.5 text-xs rounded ${badge.color}`}>
          {badge.label}
        </span>
      ))}
    </div>
  )
}

function AdminPageContent() {
  const searchParams = useSearchParams()
  const [celebrities, setCelebrities] = useState<Celebrity[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState<Celebrity | null>(null)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 0
  })
  const { addToast } = useToast()

  // ✅ Çeviri Hook'ları
  const tNav = useTranslations('admin.nav')
  const tDash = useTranslations('admin.dashboard')
  const tTable = useTranslations('admin.table')
  const tCommon = useTranslations('common')

  const fetchCelebrities = useCallback(async () => {
    setLoading(true)
    try {
      // Build query string from search params
      const params = new URLSearchParams()
      const query = searchParams.get('q')
      const category = searchParams.get('category')
      const nationality = searchParams.get('nationality')
      const dataQuality = searchParams.get('dataQuality')
      const page = searchParams.get('page')

      if (query) params.set('q', query)
      if (category) params.set('category', category)
      if (nationality) params.set('nationality', nationality)
      if (dataQuality) params.set('dataQuality', dataQuality)
      if (page) params.set('page', page)
      params.set('limit', '50')

      // Cache buster
      const cacheBuster = `&t=${Date.now()}`

      const response = await fetch(`/api/celebrities/admin?${params.toString()}${cacheBuster}`, {
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.celebrities && Array.isArray(data.celebrities)) {
        setCelebrities(data.celebrities)
        if (data.pagination) {
          setPagination(data.pagination)
        }
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
  }, [searchParams, addToast])

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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{tDash('title')}</h1>
          <p className="text-gray-600">{tDash('subtitle')}</p>
        </div>


        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">👥</div>
              <div>
                <div className="text-sm font-medium text-gray-500">{tDash('total_celebrities')}</div>
                <div className="text-2xl font-bold text-gray-900">{pagination.total || celebrities.length}</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">📄</div>
              <div>
                <div className="text-sm font-medium text-gray-500">{tDash('page')}</div>
                <div className="text-2xl font-bold text-gray-900">
                  {pagination.page} / {pagination.totalPages || 1}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">📊</div>
              <div>
                <div className="text-sm font-medium text-gray-500">{tDash('showing')}</div>
                <div className="text-2xl font-bold text-gray-900">{celebrities.length} {tDash('records')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <AdminFilterBar />

        {/* Header with Add Button */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">{tDash('celebrity_list')}</h2>
            <Link
              href="/admin/add"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors min-h-[44px] inline-flex items-center"
            >
              {tDash('add_new')}
            </Link>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-lg shadow text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{tCommon('loading')}</p>
          </div>
        ) : celebrities.length === 0 ? (
          <div className="bg-white rounded-lg shadow text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchParams.toString() ? tTable('no_results') : tTable('no_records')}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchParams.toString()
                ? tDash('clear_filters')
                : tTable('add_first')}
            </p>
            {!searchParams.toString() && (
              <Link
                href="/admin/add"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
              >
                {tDash('add_new')}
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {tTable('celebrity')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {tTable('profession')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {tTable('status')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {tTable('added_date')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      {tTable('actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {celebrities.map((celebrity) => (
                    <tr key={celebrity.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <CelebrityAvatar celebrity={celebrity} />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {celebrity.name}
                            </div>
                            <Link
                              href={`/celebrity/${celebrity.slug}`}
                              target="_blank"
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              {tTable('view')}
                            </Link>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {celebrity.profession || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <DataQualityBadges celebrity={celebrity} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(celebrity.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/admin/edit/${celebrity.id}`}
                            className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 min-h-[36px] inline-flex items-center"
                          >
                            {tTable('edit')}
                          </Link>
                          <button
                            onClick={() => setShowDeleteModal(celebrity)}
                            className="bg-red-600 text-white px-3 py-2 rounded-md text-sm hover:bg-red-700 min-h-[36px]"
                          >
                            {tTable('delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {tDash('total_celebrities')} {pagination.total}, {tDash('page')} {pagination.page}/{pagination.totalPages}
                </div>
                <div className="flex gap-2">
                  {pagination.page > 1 && (
                    <Link
                      href={`/admin?page=${pagination.page - 1}${searchParams.get('q') ? `&q=${searchParams.get('q')}` : ''}${searchParams.get('category') ? `&category=${searchParams.get('category')}` : ''}${searchParams.get('nationality') ? `&nationality=${searchParams.get('nationality')}` : ''}${searchParams.get('dataQuality') ? `&dataQuality=${searchParams.get('dataQuality')}` : ''}`}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 min-h-[44px] inline-flex items-center"
                    >
                      ←
                    </Link>
                  )}
                  {pagination.page < pagination.totalPages && (
                    <Link
                      href={`/admin?page=${pagination.page + 1}${searchParams.get('q') ? `&q=${searchParams.get('q')}` : ''}${searchParams.get('category') ? `&category=${searchParams.get('category')}` : ''}${searchParams.get('nationality') ? `&nationality=${searchParams.get('nationality')}` : ''}${searchParams.get('dataQuality') ? `&dataQuality=${searchParams.get('dataQuality')}` : ''}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 min-h-[44px] inline-flex items-center"
                    >
                      →
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4">{tDash('delete_title')}</h3>
              <p className="text-gray-600 mb-6">
                {/* next-intl Rich Text Formatting */}
                {tDash.rich('delete_confirm', {
                  name: showDeleteModal.name,
                  strong: (chunks: ReactNode) => <strong>{chunks}</strong>
                })}
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 min-h-[44px]"
                >
                  {tDash('cancel')}
                </button>
                <button
                  onClick={() => handleDelete(showDeleteModal)}
                  disabled={deletingId === showDeleteModal.id}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 min-h-[44px]"
                >
                  {deletingId === showDeleteModal.id ? tDash('deleting') : tDash('delete')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AdminPageContent />
    </Suspense>
  )
}