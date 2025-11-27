"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/useToast'
import { validateCelebrityForm, type CelebrityFormData } from '@/lib/validations'

interface Celebrity {
  id: string
  name: string
  profession?: string | null
  birthDate?: Date | string | null
  birthPlace?: string | null
  bio?: string | null
  image?: string | null
}

interface CelebrityFormProps {
  celebrity?: Celebrity
  isEdit?: boolean
}

export default function CelebrityForm({ celebrity, isEdit = false }: CelebrityFormProps) {
  const router = useRouter()
  const { addToast } = useToast()

  const [formData, setFormData] = useState<CelebrityFormData>({
    name: celebrity?.name || '',
    profession: celebrity?.profession || '',
    birthDate: celebrity?.birthDate ? new Date(celebrity.birthDate).toISOString().split('T')[0] : '',
    birthPlace: celebrity?.birthPlace || '',
    bio: celebrity?.bio || '',
    image: celebrity?.image || ''
  })

  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Error temizle
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    const validationErrors = validateCelebrityForm(formData)
    if (validationErrors.length > 0) {
      const errorMap = validationErrors.reduce((acc, error) => {
        acc[error.field] = error.message
        return acc
      }, {} as {[key: string]: string})

      setErrors(errorMap)
      addToast('Lütfen hataları düzeltin', 'error')
      return
    }

    setIsSubmitting(true)

    try {
      const url = isEdit ? `/api/celebrities/${celebrity!.id}` : '/api/celebrities'
      const method = isEdit ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'İşlem başarısız')
      }

      addToast(
        isEdit ? 'Ünlü başarıyla güncellendi!' : 'Ünlü başarıyla eklendi!',
        'success'
      )

      router.push('/admin')
      router.refresh()
    } catch (error) {
      console.error('Form submission error:', error)
      addToast(error instanceof Error ? error.message : 'Bir hata oluştu', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? '✏️ Ünlü Düzenle' : '➕ Yeni Ünlü Ekle'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* İsim */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            İsim Soyisim *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Örn: Kemal Sunal"
            required
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Meslek */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Meslek
          </label>
          <input
            type="text"
            name="profession"
            value={formData.profession}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.profession ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Örn: Oyuncu, Yönetmen"
          />
          {errors.profession && (
            <p className="mt-1 text-sm text-red-600">{errors.profession}</p>
          )}
        </div>

        {/* İki kolon */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Doğum Tarihi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Doğum Tarihi
            </label>
            <input
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.birthDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.birthDate && (
              <p className="mt-1 text-sm text-red-600">{errors.birthDate}</p>
            )}
          </div>

          {/* Doğum Yeri */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Doğum Yeri
            </label>
            <input
              type="text"
              name="birthPlace"
              value={formData.birthPlace}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.birthPlace ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Örn: İstanbul, Türkiye"
            />
            {errors.birthPlace && (
              <p className="mt-1 text-sm text-red-600">{errors.birthPlace}</p>
            )}
          </div>
        </div>

        {/* Resim URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Resim URL
          </label>
          <input
            type="url"
            name="image"
            value={formData.image}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.image ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="https://example.com/resim.jpg"
          />
          {errors.image && (
            <p className="mt-1 text-sm text-red-600">{errors.image}</p>
          )}
        </div>

        {/* Biyografi */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Biyografi
          </label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows={8}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.bio ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Ünlü hakkında bilgi yazın..."
          />
          {errors.bio && (
            <p className="mt-1 text-sm text-red-600">{errors.bio}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            {formData.bio?.length || 0}/5000 karakter
          </p>
        </div>

        {/* Butonlar */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isEdit ? 'Güncelleniyor...' : 'Ekleniyor...'}
              </span>
            ) : (
              isEdit ? '💾 Güncelle' : '➕ Ekle'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
