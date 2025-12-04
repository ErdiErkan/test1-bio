'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useToast } from '@/hooks/useToast'
import { getReports, updateReportStatus, deleteReport, getReportCounts } from '@/actions/report'
import type { ReportStatus, ReportType, ReportWithCelebrity } from '@/lib/types'

// Status badge configuration
const STATUS_CONFIG: Record<ReportStatus, { label: string; className: string }> = {
  PENDING: { label: 'Bekliyor', className: 'bg-yellow-100 text-yellow-800' },
  IN_REVIEW: { label: 'İnceleniyor', className: 'bg-blue-100 text-blue-800' },
  RESOLVED: { label: 'Çözüldü', className: 'bg-green-100 text-green-800' },
  REJECTED: { label: 'Reddedildi', className: 'bg-red-100 text-red-800' }
}

// Report type labels
const TYPE_LABELS: Record<ReportType, string> = {
  WRONG_INFO: 'Yanlış Bilgi',
  TYPO: 'Yazım Hatası',
  IMAGE_ISSUE: 'Resim Sorunu',
  OTHER: 'Diğer'
}

// Empty state component
function EmptyState({ filter }: { filter: ReportStatus | 'ALL' }) {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">
        {filter === 'PENDING' ? '🎉' : '📭'}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {filter === 'PENDING' ? 'Bekleyen rapor yok!' : 'Rapor bulunamadı'}
      </h3>
      <p className="text-gray-500">
        {filter === 'PENDING'
          ? 'Tüm raporlar incelendi veya henüz rapor gelmedi.'
          : 'Bu filtreye uygun rapor bulunmuyor.'}
      </p>
    </div>
  )
}

// Loading skeleton
function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-10 bg-gray-200 rounded mb-4"></div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 bg-gray-100 rounded mb-2"></div>
      ))}
    </div>
  )
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportWithCelebrity[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<ReportStatus | 'ALL'>('PENDING')
  const [counts, setCounts] = useState({ pending: 0, inReview: 0, resolved: 0, rejected: 0, total: 0 })
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState<ReportWithCelebrity | null>(null)
  const { addToast } = useToast()

  // Fetch reports
  const fetchReports = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getReports({
        status: filter === 'ALL' ? undefined : filter,
        limit: 50
      })

      if (result.success && result.data) {
        setReports(result.data)
      } else {
        addToast(result.error || 'Raporlar yüklenemedi', 'error')
      }
    } catch (error) {
      addToast('Bir hata oluştu', 'error')
    } finally {
      setLoading(false)
    }
  }, [filter, addToast])

  // Fetch counts
  const fetchCounts = useCallback(async () => {
    try {
      const result = await getReportCounts()
      if (result.success && result.data) {
        setCounts(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch counts:', error)
    }
  }, [])

  useEffect(() => {
    fetchReports()
    fetchCounts()
  }, [fetchReports, fetchCounts])

  // Handle status update
  const handleStatusChange = async (id: string, newStatus: ReportStatus) => {
    const result = await updateReportStatus(id, newStatus)
    if (result.success) {
      addToast('Durum güncellendi', 'success')
      fetchReports()
      fetchCounts()
    } else {
      addToast(result.message, 'error')
    }
  }

  // Handle delete
  const handleDelete = async (report: ReportWithCelebrity) => {
    setDeletingId(report.id)
    const result = await deleteReport(report.id)
    if (result.success) {
      addToast('Rapor silindi', 'success')
      setShowDeleteModal(null)
      fetchReports()
      fetchCounts()
    } else {
      addToast(result.message, 'error')
    }
    setDeletingId(null)
  }

  // Format date
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Truncate message
  const truncateMessage = (message: string, maxLength: number = 100) => {
    if (message.length <= maxLength) return message
    return message.substring(0, maxLength) + '...'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Geri Bildirimler</h1>
          <p className="text-gray-600">Kullanıcılardan gelen hata bildirimleri</p>
        </div>

        {/* Navigation */}
        <div className="mb-8 flex flex-wrap gap-4">
          <Link
            href="/admin"
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium min-h-[44px] inline-flex items-center"
          >
            Ünlüler
          </Link>
          <Link
            href="/admin/categories"
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium min-h-[44px] inline-flex items-center"
          >
            Kategoriler
          </Link>
          <Link
            href="/admin/reports"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium min-h-[44px] inline-flex items-center"
          >
            Geri Bildirimler
            {counts.pending > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {counts.pending}
              </span>
            )}
          </Link>
          <Link
            href="/"
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium min-h-[44px] inline-flex items-center"
          >
            Ana Sayfa
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm font-medium text-gray-500">Toplam</div>
            <div className="text-2xl font-bold text-gray-900">{counts.total}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-4">
            <div className="text-sm font-medium text-yellow-600">Bekliyor</div>
            <div className="text-2xl font-bold text-yellow-700">{counts.pending}</div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-4">
            <div className="text-sm font-medium text-blue-600">İnceleniyor</div>
            <div className="text-2xl font-bold text-blue-700">{counts.inReview}</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4">
            <div className="text-sm font-medium text-green-600">Çözüldü</div>
            <div className="text-2xl font-bold text-green-700">{counts.resolved}</div>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-4">
            <div className="text-sm font-medium text-red-600">Reddedildi</div>
            <div className="text-2xl font-bold text-red-700">{counts.rejected}</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'ALL' as const, label: 'Tümü' },
              { value: 'PENDING' as const, label: 'Bekleyen' },
              { value: 'IN_REVIEW' as const, label: 'İnceleniyor' },
              { value: 'RESOLVED' as const, label: 'Çözülen' },
              { value: 'REJECTED' as const, label: 'Reddedilen' }
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors min-h-[44px] ${
                  filter === tab.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-6">
              <LoadingSkeleton />
            </div>
          ) : reports.length === 0 ? (
            <EmptyState filter={filter} />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tür
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ünlü
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mesaj
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tarih
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_CONFIG[report.status].className}`}>
                          {STATUS_CONFIG[report.status].label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {TYPE_LABELS[report.type]}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/celebrity/${report.celebrity.slug}`}
                          target="_blank"
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {report.celebrity.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs" title={report.message}>
                          {truncateMessage(report.message)}
                        </div>
                        {report.contactEmail && (
                          <div className="text-xs text-gray-500 mt-1">
                            <a href={`mailto:${report.contactEmail}`} className="hover:text-blue-600">
                              {report.contactEmail}
                            </a>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(report.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {/* Status Dropdown */}
                          <select
                            value={report.status}
                            onChange={(e) => handleStatusChange(report.id, e.target.value as ReportStatus)}
                            className="text-sm border border-gray-300 rounded-md px-2 py-1 min-h-[36px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="PENDING">Bekliyor</option>
                            <option value="IN_REVIEW">İnceleniyor</option>
                            <option value="RESOLVED">Çözüldü</option>
                            <option value="REJECTED">Reddedildi</option>
                          </select>

                          {/* Edit Celebrity Button */}
                          <Link
                            href={`/admin/edit/${report.celebrity.id}`}
                            className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-700 min-h-[36px] inline-flex items-center"
                          >
                            Düzenle
                          </Link>

                          {/* Delete Button */}
                          <button
                            onClick={() => setShowDeleteModal(report)}
                            className="bg-red-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-red-700 min-h-[36px]"
                          >
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Raporu Sil</h3>
            <p className="text-gray-600 mb-6">
              <strong>{showDeleteModal.celebrity.name}</strong> hakkındaki bu raporu silmek istediğinizden emin misiniz?
            </p>
            <div className="bg-gray-50 rounded-lg p-3 mb-6">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Tür:</span> {TYPE_LABELS[showDeleteModal.type]}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-medium">Mesaj:</span> {truncateMessage(showDeleteModal.message, 150)}
              </p>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 min-h-[44px]"
              >
                İptal
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal)}
                disabled={deletingId === showDeleteModal.id}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 min-h-[44px]"
              >
                {deletingId === showDeleteModal.id ? 'Siliniyor...' : 'Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
