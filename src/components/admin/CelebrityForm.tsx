'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/useToast'
import { validateCelebrityForm } from '@/lib/validations'
import { uploadImage } from '@/actions/upload'
import { createCelebrity, updateCelebrity } from '@/actions/celebrities'
import { getCategories } from '@/actions/categories'
import { getAllCountries } from '@/lib/celebrity'

interface Celebrity {
  id: string
  name: string
  nickname?: string | null
  profession?: string | null
  birthDate?: Date | string | null
  birthPlace?: string | null
  nationality?: string | null
  bio?: string | null
  image?: string | null
  categories?: { id: string; name: string }[]
}

interface CelebrityFormProps {
  celebrity?: Celebrity
  isEdit?: boolean
}

interface Category {
  id: string
  name: string
  slug: string
}

export default function CelebrityForm({ celebrity, isEdit = false }: CelebrityFormProps) {
  const router = useRouter()
  const { addToast } = useToast()

  const [formData, setFormData] = useState({
    name: celebrity?.name || '',
    nickname: celebrity?.nickname || '',
    profession: celebrity?.profession || '',
    birthDate: celebrity?.birthDate ? new Date(celebrity.birthDate).toISOString().split('T')[0] : '',
    birthPlace: celebrity?.birthPlace || '',
    nationality: celebrity?.nationality || '',
    bio: celebrity?.bio || '',
    image: celebrity?.image || '',
    categoryIds: celebrity?.categories?.map(c => c.id) || []
  })

  const [categories, setCategories] = useState<Category[]>([])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>(celebrity?.image || '')
  
  // Önizleme hatası için state
  const [previewError, setPreviewError] = useState(false)
  
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  // Kategorileri yükle
  useEffect(() => {
    async function loadCategories() {
      const result = await getCategories()
      if (result.success && result.data) {
        setCategories(result.data)
      }
    }
    loadCategories()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Dosya tipi kontrolü
    if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
      addToast('Sadece JPG, PNG ve WEBP formatları desteklenir', 'error')
      return
    }

    // Dosya boyutu kontrolü (5MB)
    if (file.size > 5 * 1024 * 1024) {
      addToast('Dosya boyutu maksimum 5MB olabilir', 'error')
      return
    }

    setImageFile(file)

    // Preview oluştur
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      setPreviewError(false) // Hatayı sıfırla
      setImagePreview(result) // Yeni preview'ı set et
    }
    reader.readAsDataURL(file)
  }

  const handleCategoryToggle = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...prev.categoryIds, categoryId]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationErrors = validateCelebrityForm({
      ...formData,
      image: imagePreview || formData.image
    })

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
      let imagePath = formData.image

      // Resim yükleme
      if (imageFile) {
        setIsUploadingImage(true)
        const uploadFormData = new FormData()
        uploadFormData.append('file', imageFile)

        const uploadResult = await uploadImage(uploadFormData)

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Resim yüklenemedi')
        }

        imagePath = uploadResult.imagePath || ''
        setIsUploadingImage(false)
      }

      const celebrityData = {
        name: formData.name,
        nickname: formData.nickname,
        profession: formData.profession,
        birthDate: formData.birthDate,
        birthPlace: formData.birthPlace,
        nationality: formData.nationality,
        bio: formData.bio,
        image: imagePath,
        categoryIds: formData.categoryIds
      }

      let result
      if (isEdit && celebrity) {
        result = await updateCelebrity(celebrity.id, celebrityData)
      } else {
        result = await createCelebrity(celebrityData)
      }

      if (!result.success) {
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
      setIsUploadingImage(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? 'Ünlü Düzenle' : 'Yeni Ünlü Ekle'}
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

        {/* Takma Ad */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Takma Ad / Lakap
          </label>
          <input
            type="text"
            name="nickname"
            value={formData.nickname}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.nickname ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Örn: Turist Ömer"
          />
          {errors.nickname && (
            <p className="mt-1 text-sm text-red-600">{errors.nickname}</p>
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

        {/* Uyruk */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Uyruk / Vatandaşlık
          </label>
          <select
            name="nationality"
            value={formData.nationality}
            onChange={(e) => handleChange(e as any)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.nationality ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Seçiniz...</option>
            {getAllCountries().map((country) => (
              <option key={country.code} value={country.code}>
                {country.flag} {country.name}
              </option>
            ))}
          </select>
          {errors.nationality && (
            <p className="mt-1 text-sm text-red-600">{errors.nationality}</p>
          )}
        </div>

        {/* Kategoriler */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kategoriler
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {categories.map((category) => (
              <label
                key={category.id}
                className={`flex items-center px-4 py-3 border rounded-lg cursor-pointer transition-colors ${
                  formData.categoryIds.includes(category.id)
                    ? 'bg-blue-50 border-blue-500'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.categoryIds.includes(category.id)}
                  onChange={() => handleCategoryToggle(category.id)}
                  className="mr-2"
                />
                <span className="text-sm">{category.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Doğum Bilgileri */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </div>

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
          </div>
        </div>

        {/* Resim Upload Alanı */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Resim
          </label>

          <div className="mb-4 w-[200px] h-[300px] bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative shadow-sm">
            {imagePreview && !previewError ? (
              // KEY prop'u eklendi: imagePreview değiştiğinde img etiketini zorla yeniden oluşturur
              <img
                key={imagePreview}
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={() => setPreviewError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-600">
                {formData.name ? (
                  <span className="text-6xl font-bold text-white select-none">
                    {formData.name.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <span className="text-4xl text-white">📷</span>
                )}
              </div>
            )}
          </div>

          <input
            type="file"
            accept="image/jpeg,image/png,image/jpg,image/webp"
            onChange={handleImageChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            Maksimum 5MB, JPG/PNG/WEBP formatı
          </p>
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
            disabled={isSubmitting || isUploadingImage}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting || isUploadingImage ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isUploadingImage ? 'Resim yükleniyor...' : isEdit ? 'Güncelleniyor...' : 'Ekleniyor...'}
              </span>
            ) : (
              isEdit ? 'Güncelle' : 'Ekle'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}