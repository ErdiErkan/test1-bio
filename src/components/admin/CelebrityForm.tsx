'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/useToast'
import { validateCelebrityForm } from '@/lib/validations'
import { uploadImage } from '@/actions/upload'
import { createCelebrity, updateCelebrity } from '@/actions/celebrities'
import { getCategories } from '@/actions/categories'
import { getAllCountries } from '@/lib/celebrity'
import type { SocialPlatform } from '@/lib/types'

// Social Link form state tipi
interface SocialLinkFormItem {
  id: string // Benzersiz key için geçici ID
  platform: SocialPlatform | ''
  url: string
}

// Platform konfigürasyonu
const SOCIAL_PLATFORMS: {
  value: SocialPlatform
  label: string
  placeholder: string
  icon: string
}[] = [
  { value: 'INSTAGRAM', label: 'Instagram', placeholder: 'https://instagram.com/kullaniciadi', icon: '📷' },
  { value: 'TWITTER', label: 'Twitter / X', placeholder: 'https://twitter.com/kullaniciadi', icon: '𝕏' },
  { value: 'YOUTUBE', label: 'YouTube', placeholder: 'https://youtube.com/@kanal', icon: '▶️' },
  { value: 'TIKTOK', label: 'TikTok', placeholder: 'https://tiktok.com/@kullaniciadi', icon: '🎵' },
  { value: 'FACEBOOK', label: 'Facebook', placeholder: 'https://facebook.com/sayfa', icon: '👤' },
  { value: 'LINKEDIN', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/kullaniciadi', icon: '💼' },
  { value: 'WEBSITE', label: 'Website', placeholder: 'https://www.ornek.com', icon: '🌐' },
  { value: 'IMDB', label: 'IMDb', placeholder: 'https://imdb.com/name/nm123456', icon: '🎬' },
  { value: 'SPOTIFY', label: 'Spotify', placeholder: 'https://open.spotify.com/artist/...', icon: '🎧' },
]

// Unique ID generator
const generateId = () => Math.random().toString(36).substring(2, 9)

interface SocialMediaLink {
  id: string
  platform: SocialPlatform
  url: string
  displayOrder: number
}

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
  socialMediaLinks?: SocialMediaLink[]
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

  // Social Links state - mevcut verileri yükle veya boş başla
  const [socialLinks, setSocialLinks] = useState<SocialLinkFormItem[]>(() => {
    if (celebrity?.socialMediaLinks && celebrity.socialMediaLinks.length > 0) {
      return celebrity.socialMediaLinks.map(link => ({
        id: generateId(),
        platform: link.platform,
        url: link.url
      }))
    }
    return []
  })

  const [categories, setCategories] = useState<Category[]>([])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>(celebrity?.image || '')

  // Önizleme hatası için state
  const [previewError, setPreviewError] = useState(false)

  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [socialLinkErrors, setSocialLinkErrors] = useState<{[key: string]: string}>({})
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

  // ========== Sosyal Medya Handler'ları ==========

  // Yeni sosyal medya satırı ekle
  const handleAddSocialLink = () => {
    setSocialLinks(prev => [...prev, { id: generateId(), platform: '', url: '' }])
  }

  // Sosyal medya satırını sil
  const handleRemoveSocialLink = (id: string) => {
    setSocialLinks(prev => prev.filter(link => link.id !== id))
    // İlgili hata mesajını da temizle
    setSocialLinkErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[`${id}-platform`]
      delete newErrors[`${id}-url`]
      return newErrors
    })
  }

  // Sosyal medya platform değişikliği
  const handleSocialPlatformChange = (id: string, platform: SocialPlatform | '') => {
    setSocialLinks(prev =>
      prev.map(link => (link.id === id ? { ...link, platform } : link))
    )
    // Platform seçilince hata temizle
    if (platform && socialLinkErrors[`${id}-platform`]) {
      setSocialLinkErrors(prev => ({ ...prev, [`${id}-platform`]: '' }))
    }
  }

  // Sosyal medya URL değişikliği
  const handleSocialUrlChange = (id: string, url: string) => {
    setSocialLinks(prev =>
      prev.map(link => (link.id === id ? { ...link, url } : link))
    )
    // URL girilince hata temizle
    if (url && socialLinkErrors[`${id}-url`]) {
      setSocialLinkErrors(prev => ({ ...prev, [`${id}-url`]: '' }))
    }
  }

  // Platform için placeholder getir
  const getPlaceholderForPlatform = (platform: SocialPlatform | ''): string => {
    if (!platform) return 'Önce platform seçin...'
    const config = SOCIAL_PLATFORMS.find(p => p.value === platform)
    return config?.placeholder || 'URL girin'
  }

  // URL validasyonu
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  // Sosyal link validasyonu
  const validateSocialLinks = (): boolean => {
    const newErrors: {[key: string]: string} = {}
    let isValid = true

    socialLinks.forEach(link => {
      // Platform kontrolü
      if (!link.platform) {
        newErrors[`${link.id}-platform`] = 'Platform seçin'
        isValid = false
      }

      // URL kontrolü
      if (!link.url.trim()) {
        newErrors[`${link.id}-url`] = 'URL boş bırakılamaz'
        isValid = false
      } else if (!isValidUrl(link.url)) {
        newErrors[`${link.id}-url`] = 'Geçerli bir URL girin'
        isValid = false
      }
    })

    setSocialLinkErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationErrors = validateCelebrityForm({
      ...formData,
      image: imagePreview || formData.image
    })

    // Sosyal link validasyonu
    const socialLinksValid = validateSocialLinks()

    if (validationErrors.length > 0 || !socialLinksValid) {
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

      // Geçerli sosyal linkleri hazırla
      const validSocialLinks = socialLinks
        .filter(link => link.platform && link.url.trim())
        .map((link, index) => ({
          platform: link.platform as SocialPlatform,
          url: link.url.trim(),
          displayOrder: index
        }))

      const celebrityData = {
        name: formData.name,
        nickname: formData.nickname,
        profession: formData.profession,
        birthDate: formData.birthDate,
        birthPlace: formData.birthPlace,
        nationality: formData.nationality,
        bio: formData.bio,
        image: imagePath,
        categoryIds: formData.categoryIds,
        socialLinks: validSocialLinks
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

        {/* ========== Sosyal Medya Hesapları ========== */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Sosyal Medya Hesapları
            </label>
            <button
              type="button"
              onClick={handleAddSocialLink}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors min-h-[44px]"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Hesap Ekle
            </button>
          </div>

          {/* Sosyal Medya Satırları */}
          <div className="space-y-4">
            {socialLinks.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
                Henüz sosyal medya hesabı eklenmedi. Yukarıdaki butona tıklayarak ekleyebilirsiniz.
              </p>
            ) : (
              socialLinks.map((link, index) => (
                <div
                  key={link.id}
                  className="flex flex-col sm:flex-row gap-3 p-4 bg-gray-50 rounded-lg"
                >
                  {/* Platform Select */}
                  <div className="flex-shrink-0 w-full sm:w-48">
                    <select
                      value={link.platform}
                      onChange={(e) =>
                        handleSocialPlatformChange(link.id, e.target.value as SocialPlatform | '')
                      }
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-h-[44px] ${
                        socialLinkErrors[`${link.id}-platform`]
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}
                    >
                      <option value="">Platform Seçin</option>
                      {SOCIAL_PLATFORMS.map((platform) => (
                        <option key={platform.value} value={platform.value}>
                          {platform.icon} {platform.label}
                        </option>
                      ))}
                    </select>
                    {socialLinkErrors[`${link.id}-platform`] && (
                      <p className="mt-1 text-xs text-red-600">
                        {socialLinkErrors[`${link.id}-platform`]}
                      </p>
                    )}
                  </div>

                  {/* URL Input */}
                  <div className="flex-grow">
                    <input
                      type="url"
                      value={link.url}
                      onChange={(e) => handleSocialUrlChange(link.id, e.target.value)}
                      placeholder={getPlaceholderForPlatform(link.platform)}
                      disabled={!link.platform}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px] ${
                        socialLinkErrors[`${link.id}-url`]
                          ? 'border-red-500'
                          : 'border-gray-300'
                      } ${!link.platform ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                    />
                    {socialLinkErrors[`${link.id}-url`] && (
                      <p className="mt-1 text-xs text-red-600">
                        {socialLinkErrors[`${link.id}-url`]}
                      </p>
                    )}
                  </div>

                  {/* Sil Butonu */}
                  <button
                    type="button"
                    onClick={() => handleRemoveSocialLink(link.id)}
                    className="flex-shrink-0 inline-flex items-center justify-center w-full sm:w-12 h-12 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors min-h-[44px]"
                    title="Bu hesabı sil"
                    aria-label="Bu sosyal medya hesabını sil"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    <span className="sm:hidden ml-2">Sil</span>
                  </button>
                </div>
              ))
            )}
          </div>

          {socialLinks.length > 0 && (
            <p className="mt-2 text-xs text-gray-500">
              {socialLinks.length} sosyal medya hesabı eklendi. Sıralama, eklenme sırasına göre belirlenir.
            </p>
          )}
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