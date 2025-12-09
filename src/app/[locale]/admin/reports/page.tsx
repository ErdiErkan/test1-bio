'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useToast } from '@/hooks/useToast'
import { getReports, updateReportStatus, deleteReport, getReportCounts } from '@/actions/report'
import type { ReportStatus, ReportWithCelebrity } from '@/lib/types'
import { useTranslations, useLocale } from 'next-intl'
import { Language } from '@prisma/client'

// Status Renkleri (Metinler çeviriden gelecek, sadece stilleri tutuyoruz)
const STATUS_COLORS: Record<ReportStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  IN_REVIEW: 'bg-blue-100 text-blue-800 border-blue-200',
  RESOLVED: 'bg-green-100 text-green-800 border-green-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200'
}

// Loading skeleton
function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-12 bg-gray-200 rounded-lg w-full"></div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-20 bg-gray-100 rounded-lg w-full"></div>
      ))}
    </div>
  )
}

export default function AdminReportsPage() {
  const t = useTranslations('admin.reports')
  const tNav = useTranslations('admin.nav')
  const locale = useLocale()

  const [reports, setReports] = useState<ReportWithCelebrity[]>([])
  const [loading, setLoading] = useState(true)

  // Filtreler
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'ALL'>('PENDING')
  const [langFilter, setLangFilter] = useState<Language | 'ALL'>('ALL')

  const [counts, setCounts] = useState({ pending: 0, inReview: 0, resolved: 0, rejected: 0, total: 0 })

  // Modal State
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState<ReportWithCelebrity | null>(null)

  const { addToast } = useToast()

  // Veri Çekme Fonksiyonu
  const fetchReports = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getReports({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        language: langFilter === 'ALL' ? undefined : langFilter,
        limit: 50
      })

      if (result.success && result.data) {
        setReports(result.data)
      } else {
        addToast(result.error || t('error_loading'), 'error')
      }
    } catch (error) {
      addToast(t('error_generic'), 'error')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, langFilter, addToast, t])

  // Sayısal Verileri Çekme
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

  // İlk Yükleme ve Filtre Değişiminde Tetikle
  useEffect(() => {
    fetchReports()
    fetchCounts()
  }, [fetchReports, fetchCounts])

  // Durum Güncelleme
  const handleStatusChange = async (id: string, newStatus: ReportStatus) => {
    const result = await updateReportStatus(id, newStatus)
    if (result.success) {
      addToast(t('success_status'), 'success')
      fetchReports()
      fetchCounts()
    } else {
      addToast(result.message, 'error')
    }
  }

  // Silme İşlemi
  const handleDelete = async (report: ReportWithCelebrity) => {
    setDeletingId(report.id)
    const result = await deleteReport(report.id)
    if (result.success) {
      addToast(t('success_delete'), 'success')
      setShowDeleteModal(null)
      fetchReports()
      fetchCounts()
    } else {
      addToast(result.message, 'error')
    }
    setDeletingId(null)
  }

  // Tarih Formatlama
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Sayfa Başlığı */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
          <p className="text-gray-600">{t('subtitle')}</p>
        </div>

        {/* Navigasyon */}


        {/* İstatistik Kartları */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="text-sm font-medium text-gray-500 mb-1">{t('total')}</div>
            <div className="text-2xl font-bold text-gray-900">{counts.total}</div>
          </div>
          <div className="bg-yellow-50 rounded-xl shadow-sm border border-yellow-100 p-4">
            <div className="text-sm font-medium text-yellow-600 mb-1">{t('statuses.PENDING')}</div>
            <div className="text-2xl font-bold text-yellow-700">{counts.pending}</div>
          </div>
          <div className="bg-blue-50 rounded-xl shadow-sm border border-blue-100 p-4">
            <div className="text-sm font-medium text-blue-600 mb-1">{t('statuses.IN_REVIEW')}</div>
            <div className="text-2xl font-bold text-blue-700">{counts.inReview}</div>
          </div>
          <div className="bg-green-50 rounded-xl shadow-sm border border-green-100 p-4">
            <div className="text-sm font-medium text-green-600 mb-1">{t('statuses.RESOLVED')}</div>
            <div className="text-2xl font-bold text-green-700">{counts.resolved}</div>
          </div>
          <div className="bg-red-50 rounded-xl shadow-sm border border-red-100 p-4">
            <div className="text-sm font-medium text-red-600 mb-1">{t('statuses.REJECTED')}</div>
            <div className="text-2xl font-bold text-red-700">{counts.rejected}</div>
          </div>
        </div>

        {/* Filtre Alanı */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">

          {/* Durum Filtreleri (Tab) */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {[
              { value: 'ALL' as const, label: t('filter_all') },
              { value: 'PENDING' as const, label: t('statuses.PENDING') },
              { value: 'IN_REVIEW' as const, label: t('statuses.IN_REVIEW') },
              { value: 'RESOLVED' as const, label: t('statuses.RESOLVED') },
              { value: 'REJECTED' as const, label: t('statuses.REJECTED') }
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm flex-1 md:flex-none ${statusFilter === tab.value
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Dil Filtresi (Dropdown) */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="text-sm font-medium text-gray-500 whitespace-nowrap">{t('filter_lang')}:</span>
            <div className="relative w-full md:w-40">
              <select
                value={langFilter}
                onChange={(e) => setLangFilter(e.target.value as Language | 'ALL')}
                className="w-full appearance-none px-4 py-2 pr-8 border border-gray-300 rounded-lg bg-white font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow cursor-pointer"
              >
                <option value="ALL">{t('filter_all')}</option>
                {Object.values(Language).map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Raporlar Tablosu */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8"><LoadingSkeleton /></div>
          ) : reports.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="text-6xl mb-4 opacity-50">📭</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('table.no_results_title')}
              </h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                {t('table.no_results_desc')}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('table.status')}</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('table.language')}</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('table.type')}</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('table.celebrity')}</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('table.message')}</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('table.date')}</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                      {/* Durum */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full border ${STATUS_COLORS[report.status]}`}>
                          {t(`statuses.${report.status}`)}
                        </span>
                      </td>

                      {/* Dil */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
                          {report.language || 'EN'}
                        </span>
                      </td>

                      {/* Tür */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {t(`types.${report.type}`)}
                      </td>

                      {/* Ünlü Linki */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/celebrity/${report.celebrity.slug}`}
                          target="_blank"
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                        >
                          {report.celebrity.name}
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </Link>
                      </td>

                      {/* Mesaj */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700 max-w-xs break-words">
                          {report.message}
                        </div>
                        {report.contactEmail && (
                          <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            <a href={`mailto:${report.contactEmail}`} className="hover:text-blue-600 hover:underline">
                              {report.contactEmail}
                            </a>
                          </div>
                        )}
                      </td>

                      {/* Tarih */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(report.createdAt)}
                      </td>

                      {/* İşlemler */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={report.status}
                            onChange={(e) => handleStatusChange(report.id, e.target.value as ReportStatus)}
                            className="text-xs border border-gray-300 rounded-md px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer bg-white"
                          >
                            {Object.keys(STATUS_COLORS).map(s => (
                              <option key={s} value={s}>{t(`statuses.${s}`)}</option>
                            ))}
                          </select>

                          <Link
                            href={`/admin/edit/${report.celebrity.id}`}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title={tNav('celebrities')}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </Link>

                          <button
                            onClick={() => setShowDeleteModal(report)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title={t('table.delete')}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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

      {/* Silme Onay Modalı */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full transform scale-100 transition-transform">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('delete.title')}</h3>
            <p className="text-gray-600 mb-6">
              {t.rich('delete.confirm', {
                name: showDeleteModal.celebrity.name,
                strong: (chunks) => <strong className="font-semibold text-gray-900">{chunks}</strong>
              })}
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('table.type')}</span>
                <span className="text-sm font-medium text-gray-900">{t(`types.${showDeleteModal.type}`)}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">{t('table.message')}</span>
                <span className="text-sm text-gray-700 text-right max-w-[70%]">{showDeleteModal.message}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-gray-200"
              >
                {t('delete.cancel')}
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal)}
                disabled={deletingId === showDeleteModal.id}
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                {deletingId === showDeleteModal.id ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                    {t('delete.deleting')}
                  </>
                ) : (
                  t('delete.confirm_btn')
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}