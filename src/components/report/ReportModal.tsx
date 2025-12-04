'use client'

import { useEffect, useRef, useCallback } from 'react'
import ReportForm from './ReportForm'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  celebrityId: string
  celebrityName: string
}

export default function ReportModal({
  isOpen,
  onClose,
  celebrityId,
  celebrityName
}: ReportModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Store previous focus and focus modal when opened
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement
      // Focus first focusable element in modal
      const firstInput = modalRef.current?.querySelector('input, textarea, button, select')
      if (firstInput instanceof HTMLElement) {
        setTimeout(() => firstInput.focus(), 100)
      }
    } else {
      // Restore focus when closed
      previousFocusRef.current?.focus()
    }
  }, [isOpen])

  // Handle escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      // Prevent body scroll
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, handleKeyDown])

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 id="report-modal-title" className="text-lg font-semibold text-gray-900">
            Hata Bildir
          </h2>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
            aria-label="Kapat"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">
            <strong>{celebrityName}</strong> hakkında bir hata mı buldunuz? Lütfen aşağıdaki formu doldurun.
          </p>
          <ReportForm celebrityId={celebrityId} onSuccess={onClose} />
        </div>
      </div>
    </div>
  )
}
