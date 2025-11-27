'use client'

import { useState } from 'react'
import { Celebrity, CelebrityFormData } from '@/lib/types'

interface AdminFormProps {
  celebrity?: Celebrity
  onSuccess: () => void
  onCancel?: () => void
}

export default function AdminForm({ celebrity, onSuccess, onCancel }: AdminFormProps) {
  const [formData, setFormData] = useState<CelebrityFormData>({
    name: celebrity?.name || '',
    profession: celebrity?.profession || '',
    birthDate: celebrity?.birthDate
      ? new Date(celebrity.birthDate).toISOString().split('T')[0]
      : '',
    birthPlace: celebrity?.birthPlace || '',
    bio: celebrity?.bio || '',
    image: celebrity?.image || ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const url = celebrity
        ? `/api/celebrities/${celebrity.id}`
        : '/api/celebrities'

      const method = celebrity ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Bir hata oluştu')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          İsim *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          value={formData.name}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="profession" className="block text-sm font-medium text-gray-700 mb-1">
          Meslek
        </label>
        <input
          type="text"
          id="profession"
          name="profession"
          value={formData.profession}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-1">
          Doğum Tarihi
        </label>
        <input
          type="date"
          id="birthDate"
          name="birthDate"
          value={formData.birthDate}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="birthPlace" className="block text-sm font-medium text-gray-700 mb-1">
          Doğum Yeri
        </label>
        <input
          type="text"
          id="birthPlace"
          name="birthPlace"
          value={formData.birthPlace}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
          Fotoğraf URL
        </label>
        <input
          type="url"
          id="image"
          name="image"
          value={formData.image}
          onChange={handleChange}
          placeholder="https://example.com/image.jpg"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
          Biyografi
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={6}
          value={formData.bio}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Kaydediliyor...' : celebrity ? 'Güncelle' : 'Ekle'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
          >
            İptal
          </button>
        )}
      </div>
    </form>
  )
}
