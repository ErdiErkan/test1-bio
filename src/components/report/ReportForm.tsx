'use client'

import { useState, useTransition } from 'react'
import { createReport } from '@/actions/report'
import { useToast } from '@/hooks/useToast'
import type { ReportType } from '@/lib/types'

interface ReportFormProps {
  celebrityId: string
  onSuccess?: () => void
}

const REPORT_TYPES: { value: ReportType; label: string; description: string }[] = [
  { value: 'WRONG_INFO', label: 'Yanlış Bilgi', description: 'Tarih, yer veya diğer bilgiler hatalı' },
  { value: 'TYPO', label: 'Yazım Hatası', description: 'İmla veya noktalama hatası var' },
  { value: 'IMAGE_ISSUE', label: 'Resim Sorunu', description: 'Resim yanlış veya görüntülenmiyor' },
  { value: 'OTHER', label: 'Diğer', description: 'Yukarıdakilerden farklı bir sorun' }
]

export default function ReportForm({ celebrityId, onSuccess }: ReportFormProps) {
  const [selectedType, setSelectedType] = useState<ReportType>('WRONG_INFO')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [isPending, startTransition] = useTransition()
  const { addToast } = useToast()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Client-side validation
    if (message.trim().length < 10) {
      addToast('Mesaj en az 10 karakter olmalıdır', 'error')
      return
    }

    const formData = new FormData()
    formData.set('celebrityId', celebrityId)
    formData.set('type', selectedType)
    formData.set('message', message)
    if (email.trim()) {
      formData.set('contactEmail', email.trim())
    }
    // Honeypot field from form (if filled by bot)
    const honeypotInput = (e.target as HTMLFormElement).querySelector('[name="_gotcha"]') as HTMLInputElement
    if (honeypotInput?.value) {
      formData.set('_gotcha', honeypotInput.value)
    }

    startTransition(async () => {
      const result = await createReport(formData)

      if (result.success) {
        addToast(result.message, 'success')
        setMessage('')
        setEmail('')
        setSelectedType('WRONG_INFO')
        onSuccess?.()
      } else {
        addToast(result.message, 'error')
      }
    })
  }

  const characterCount = message.length
  const isMessageTooShort = message.length > 0 && message.length < 10
  const isMessageTooLong = message.length > 1000

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Report Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sorun Nedir? <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          {REPORT_TYPES.map((type) => (
            <label
              key={type.value}
              className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors min-h-[44px] ${
                selectedType === type.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="type"
                value={type.value}
                checked={selectedType === type.value}
                onChange={(e) => setSelectedType(e.target.value as ReportType)}
                className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div className="ml-3">
                <span className="text-sm font-medium text-gray-900">{type.label}</span>
                <p className="text-xs text-gray-500 mt-0.5">{type.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Message Textarea */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
          Detaylı Açıklama <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Hangi bilgi yanlış? Doğrusu ne olmalı? Lütfen detaylı açıklayın..."
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors ${
            isMessageTooShort || isMessageTooLong
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300'
          }`}
          maxLength={1000}
          required
        />
        <div className="flex justify-between mt-1">
          {isMessageTooShort && (
            <span className="text-xs text-red-500">En az 10 karakter gerekli</span>
          )}
          {isMessageTooLong && (
            <span className="text-xs text-red-500">Maksimum 1000 karakter</span>
          )}
          {!isMessageTooShort && !isMessageTooLong && <span />}
          <span className={`text-xs ${characterCount > 900 ? 'text-orange-500' : 'text-gray-400'}`}>
            {characterCount}/1000
          </span>
        </div>
      </div>

      {/* Email Input (Optional) */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          E-posta Adresi <span className="text-gray-400 text-xs">(isteğe bağlı)</span>
        </label>
        <input
          type="email"
          id="email"
          name="contactEmail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ornek@email.com"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
        />
        <p className="text-xs text-gray-500 mt-1">
          Size geri dönüş yapmamızı isterseniz e-posta adresinizi bırakabilirsiniz.
        </p>
      </div>

      {/* Honeypot field - hidden from users but visible to bots */}
      <input
        type="text"
        name="_gotcha"
        tabIndex={-1}
        autoComplete="off"
        style={{
          position: 'absolute',
          left: '-9999px',
          opacity: 0,
          height: 0,
          width: 0,
          overflow: 'hidden'
        }}
        aria-hidden="true"
      />

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isPending || isMessageTooShort || isMessageTooLong || message.length === 0}
        className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-h-[44px]"
      >
        {isPending ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Gönderiliyor...
          </>
        ) : (
          'Geri Bildirim Gönder'
        )}
      </button>
    </form>
  )
}
