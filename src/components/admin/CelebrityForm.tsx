'use client'

import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/useToast'
import { validateCelebrityForm } from '@/lib/validations'
import { uploadImage } from '@/actions/upload'
import { createCelebrity, updateCelebrity } from '@/actions/celebrities'
import { getCategories } from '@/actions/categories'
import { getAllCountries } from '@/lib/celebrity'
import type { SocialPlatform, CelebrityImage, FAQ } from '@/lib/types'

// Social Link form state type
interface SocialLinkFormItem {
  id: string
  platform: SocialPlatform | ''
  url: string
}

// Image form state type
interface ImageFormItem {
  id: string
  url: string
  file: File | null
  preview: string
  isMain: boolean
  isUploading: boolean
  error: boolean
}

// FAQ form state type
interface FAQFormItem {
  id: string
  question: string
  answer: string
}

// Platform configuration
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

const MAX_IMAGES = 3

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
  images?: CelebrityImage[]
  faqs?: FAQ[]
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
    categoryIds: celebrity?.categories?.map(c => c.id) || []
  })

  // Social Links state
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

  // Multi-image state
  const [images, setImages] = useState<ImageFormItem[]>(() => {
    // Initialize from existing images
    if (celebrity?.images && celebrity.images.length > 0) {
      return celebrity.images.map((img, index) => {
        // ✅ 1. DÜZELTME: URL Sanitization (Başına slash ekleme)
        let safeUrl = img.url;
        if (safeUrl && !safeUrl.startsWith('http') && !safeUrl.startsWith('data:') && !safeUrl.startsWith('/')) {
          safeUrl = `/${safeUrl}`;
        }

        return {
          id: generateId(),
          url: safeUrl,
          file: null,
          preview: safeUrl, // Preview için de güvenli URL kullan
          isMain: img.isMain || index === 0,
          isUploading: false,
          error: false
        }
      })
    }
    // Fallback to legacy image field
    if (celebrity?.image) {
      // ✅ Legacy image için de aynı kontrol
      let safeUrl = celebrity.image;
      if (safeUrl && !safeUrl.startsWith('http') && !safeUrl.startsWith('data:') && !safeUrl.startsWith('/')) {
        safeUrl = `/${safeUrl}`;
      }

      return [{
        id: generateId(),
        url: safeUrl,
        file: null,
        preview: safeUrl,
        isMain: true,
        isUploading: false,
        error: false
      }]
    }
    return []
  })

  // FAQ state
  const [faqs, setFaqs] = useState<FAQFormItem[]>(() => {
    if (celebrity?.faqs && celebrity.faqs.length > 0) {
      return celebrity.faqs.map(faq => ({
        id: generateId(),
        question: faq.question,
        answer: faq.answer
      }))
    }
    return []
  })

  const [categories, setCategories] = useState<Category[]>([])
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [socialLinkErrors, setSocialLinkErrors] = useState<{[key: string]: string}>({})
  const [faqErrors, setFaqErrors] = useState<{[key: string]: string}>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load categories
  useEffect(() => {
    async function loadCategories() {
      const result = await getCategories()
      if (result.success && result.data) {
        setCategories(result.data)
      }
    }
    loadCategories()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleCategoryToggle = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...prev.categoryIds, categoryId]
    }))
  }

  // ========== Image Handlers ==========

  const handleAddImage = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (images.length >= MAX_IMAGES) {
      addToast(`Maksimum ${MAX_IMAGES} resim ekleyebilirsiniz`, 'error')
      return
    }

    // File type validation
    if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
      addToast('Sadece JPG, PNG ve WEBP formatları desteklenir', 'error')
      return
    }

    // File size validation (5MB)
    if (file.size > 5 * 1024 * 1024) {
      addToast('Dosya boyutu maksimum 5MB olabilir', 'error')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      const newImage: ImageFormItem = {
        id: generateId(),
        url: '',
        file,
        preview: reader.result as string,
        isMain: images.length === 0, // First image is main
        isUploading: false,
        error: false
      }
      setImages(prev => [...prev, newImage])
    }
    reader.readAsDataURL(file)

    // Reset input
    e.target.value = ''
  }, [images.length, addToast])

  const handleRemoveImage = useCallback((imageId: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== imageId)
      // If we removed the main image, make the first one main
      if (filtered.length > 0 && !filtered.some(img => img.isMain)) {
        filtered[0].isMain = true
      }
      return filtered
    })
  }, [])

  const handleSetMainImage = useCallback((imageId: string) => {
    setImages(prev =>
      prev.map(img => ({
        ...img,
        isMain: img.id === imageId
      }))
    )
  }, [])

  // ========== Social Media Handlers ==========

  const handleAddSocialLink = () => {
    setSocialLinks(prev => [...prev, { id: generateId(), platform: '', url: '' }])
  }

  const handleRemoveSocialLink = (id: string) => {
    setSocialLinks(prev => prev.filter(link => link.id !== id))
    setSocialLinkErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[`${id}-platform`]
      delete newErrors[`${id}-url`]
      return newErrors
    })
  }

  const handleSocialPlatformChange = (id: string, platform: SocialPlatform | '') => {
    setSocialLinks(prev =>
      prev.map(link => (link.id === id ? { ...link, platform } : link))
    )
    if (platform && socialLinkErrors[`${id}-platform`]) {
      setSocialLinkErrors(prev => ({ ...prev, [`${id}-platform`]: '' }))
    }
  }

  const handleSocialUrlChange = (id: string, url: string) => {
    setSocialLinks(prev =>
      prev.map(link => (link.id === id ? { ...link, url } : link))
    )
    if (url && socialLinkErrors[`${id}-url`]) {
      setSocialLinkErrors(prev => ({ ...prev, [`${id}-url`]: '' }))
    }
  }

  const getPlaceholderForPlatform = (platform: SocialPlatform | ''): string => {
    if (!platform) return 'Önce platform seçin...'
    const config = SOCIAL_PLATFORMS.find(p => p.value === platform)
    return config?.placeholder || 'URL girin'
  }

  // ========== FAQ Handlers ==========

  const handleAddFAQ = () => {
    setFaqs(prev => [...prev, { id: generateId(), question: '', answer: '' }])
  }

  const handleRemoveFAQ = (id: string) => {
    setFaqs(prev => prev.filter(faq => faq.id !== id))
    setFaqErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[`${id}-question`]
      delete newErrors[`${id}-answer`]
      return newErrors
    })
  }

  const handleFAQChange = (id: string, field: 'question' | 'answer', value: string) => {
    setFaqs(prev =>
      prev.map(faq => (faq.id === id ? { ...faq, [field]: value } : faq))
    )
    if (value && faqErrors[`${id}-${field}`]) {
      setFaqErrors(prev => ({ ...prev, [`${id}-${field}`]: '' }))
    }
  }

  // ========== Validations ==========

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const validateSocialLinks = (): boolean => {
    const newErrors: {[key: string]: string} = {}
    let isValid = true

    socialLinks.forEach(link => {
      if (!link.platform) {
        newErrors[`${link.id}-platform`] = 'Platform seçin'
        isValid = false
      }
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

  const validateFAQs = (): boolean => {
    const newErrors: {[key: string]: string} = {}
    let isValid = true

    faqs.forEach(faq => {
      // Only validate if at least one field is filled
      if (faq.question.trim() || faq.answer.trim()) {
        if (!faq.question.trim()) {
          newErrors[`${faq.id}-question`] = 'Soru boş bırakılamaz'
          isValid = false
        }
        if (!faq.answer.trim()) {
          newErrors[`${faq.id}-answer`] = 'Cevap boş bırakılamaz'
          isValid = false
        }
      }
    })

    setFaqErrors(newErrors)
    return isValid
  }

  // ========== Form Submit ==========

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Get first image for validation
    const mainImageUrl = images.length > 0 ? (images[0].url || images[0].preview) : ''

    const validationErrors = validateCelebrityForm({
      ...formData,
      image: mainImageUrl
    })

    const socialLinksValid = validateSocialLinks()
    const faqsValid = validateFAQs()

    if (validationErrors.length > 0 || !socialLinksValid || !faqsValid) {
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
      // Upload new images
      const uploadedImages: { url: string; isMain: boolean; displayOrder: number }[] = []

      for (let i = 0; i < images.length; i++) {
        const img = images[i]

        if (img.file) {
          // New file needs upload
          setImages(prev =>
            prev.map(x => (x.id === img.id ? { ...x, isUploading: true } : x))
          )

          const uploadFormData = new FormData()
          uploadFormData.append('file', img.file)

          const uploadResult = await uploadImage(uploadFormData)

          if (!uploadResult.success) {
            setImages(prev =>
              prev.map(x => (x.id === img.id ? { ...x, isUploading: false, error: true } : x))
            )
            throw new Error(uploadResult.error || 'Resim yüklenemedi')
          }

          uploadedImages.push({
            url: uploadResult.imagePath || '',
            isMain: img.isMain,
            displayOrder: i
          })

          setImages(prev =>
            prev.map(x => (x.id === img.id ? { ...x, isUploading: false, url: uploadResult.imagePath || '' } : x))
          )
        } else if (img.url) {
          // Existing image
          uploadedImages.push({
            url: img.url,
            isMain: img.isMain,
            displayOrder: i
          })
        }
      }

      // Prepare social links
      const validSocialLinks = socialLinks
        .filter(link => link.platform && link.url.trim())
        .map((link, index) => ({
          platform: link.platform as SocialPlatform,
          url: link.url.trim(),
          displayOrder: index
        }))

      // Prepare FAQs (filter out empty ones)
      const validFaqs = faqs
        .filter(faq => faq.question.trim() && faq.answer.trim())
        .map((faq, index) => ({
          question: faq.question.trim(),
          answer: faq.answer.trim(),
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
        image: uploadedImages.length > 0 ? uploadedImages[0].url : '',
        categoryIds: formData.categoryIds,
        socialLinks: validSocialLinks,
        images: uploadedImages,
        faqs: validFaqs
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
        </div>

        {/* Uyruk */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Uyruk / Vatandaşlık
          </label>
          <select
            name="nationality"
            value={formData.nationality}
            onChange={handleChange}
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
                className={`flex items-center px-4 py-3 border rounded-lg cursor-pointer transition-colors min-h-[44px] ${
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Örn: İstanbul, Türkiye"
            />
          </div>
        </div>

        {/* ========== Multi-Image Upload ========== */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Fotoğraflar (Maks. {MAX_IMAGES})
              </label>
              <p className="text-xs text-gray-500 mt-1">
                İlk fotoğraf ana resim olarak kullanılır. Maksimum 5MB, JPG/PNG/WEBP
              </p>
            </div>
            {images.length < MAX_IMAGES && (
              <label className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors min-h-[44px] cursor-pointer">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Fotoğraf Ekle
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  onChange={handleAddImage}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Image Thumbnails */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {images.map((img, index) => (
              <div
                key={img.id}
                className={`relative aspect-[3/4] rounded-lg overflow-hidden border-2 ${
                  img.isMain ? 'border-blue-500' : 'border-gray-200'
                } ${img.error ? 'border-red-500' : ''}`}
              >
                {/* Image Preview - ✅ 2. DÜZELTME: next/image Kullanımı */}
                <Image
                  src={img.preview}
                  alt={`Fotoğraf ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  unoptimized // ✅ 3. DÜZELTME: Local upload ve Docker volume uyumu için
                  onError={() => {
                    setImages(prev =>
                      prev.map(x => (x.id === img.id ? { ...x, error: true } : x))
                    )
                  }}
                />

                {/* Loading Overlay */}
                {img.isUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                )}

                {/* Main Badge */}
                {img.isMain && (
                  <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded z-10">
                    Ana Resim
                  </div>
                )}

                {/* Action Buttons */}
                <div className="absolute top-2 right-2 flex gap-1 z-10">
                  {!img.isMain && (
                    <button
                      type="button"
                      onClick={() => handleSetMainImage(img.id)}
                      className="w-8 h-8 min-w-[44px] min-h-[44px] flex items-center justify-center bg-white/90 rounded-full hover:bg-white shadow transition-colors"
                      title="Ana resim yap"
                    >
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(img.id)}
                    className="w-8 h-8 min-w-[44px] min-h-[44px] flex items-center justify-center bg-red-500/90 rounded-full hover:bg-red-600 shadow transition-colors"
                    title="Sil"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}

            {/* Empty State */}
            {images.length === 0 && (
              <label className="aspect-[3/4] rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-colors col-span-2 sm:col-span-3">
                <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm text-gray-500">Fotoğraf eklemek için tıklayın</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  onChange={handleAddImage}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {images.length > 0 && (
            <p className="mt-2 text-xs text-gray-500">
              {images.length}/{MAX_IMAGES} fotoğraf eklendi
            </p>
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
          <p className="mt-1 text-sm text-gray-500">
            {formData.bio?.length || 0}/5000 karakter
          </p>
        </div>

        {/* ========== FAQ Management ========== */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Sıkça Sorulan Sorular (SSS)
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Google zengin sonuçları için SSS ekleyin
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddFAQ}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors min-h-[44px]"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Soru Ekle
            </button>
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {faqs.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6 bg-gray-50 rounded-lg">
                Henüz soru eklenmedi. SSS ekleyerek Google zengin sonuçlarında görünürlüğü artırabilirsiniz.
              </p>
            ) : (
              faqs.map((faq, index) => (
                <div key={faq.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm font-medium text-gray-500">Soru {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFAQ(faq.id)}
                      className="text-red-600 hover:text-red-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
                      title="Bu soruyu sil"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={faq.question}
                      onChange={(e) => handleFAQChange(faq.id, 'question', e.target.value)}
                      placeholder="Soru girin (Örn: Kemal Sunal ne zaman doğdu?)"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        faqErrors[`${faq.id}-question`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {faqErrors[`${faq.id}-question`] && (
                      <p className="mt-1 text-xs text-red-600">{faqErrors[`${faq.id}-question`]}</p>
                    )}
                  </div>

                  <div>
                    <textarea
                      value={faq.answer}
                      onChange={(e) => handleFAQChange(faq.id, 'answer', e.target.value)}
                      placeholder="Cevabı yazın..."
                      rows={3}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        faqErrors[`${faq.id}-answer`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {faqErrors[`${faq.id}-answer`] && (
                      <p className="mt-1 text-xs text-red-600">{faqErrors[`${faq.id}-answer`]}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {faqs.length > 0 && (
            <p className="mt-2 text-xs text-gray-500">
              {faqs.filter(f => f.question.trim() && f.answer.trim()).length} geçerli soru eklendi
            </p>
          )}
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
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Hesap Ekle
            </button>
          </div>

          {/* Sosyal Medya Satırları */}
          <div className="space-y-4">
            {socialLinks.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
                Henüz sosyal medya hesabı eklenmedi.
              </p>
            ) : (
              socialLinks.map((link) => (
                <div key={link.id} className="flex flex-col sm:flex-row gap-3 p-4 bg-gray-50 rounded-lg">
                  {/* Platform Select */}
                  <div className="flex-shrink-0 w-full sm:w-48">
                    <select
                      value={link.platform}
                      onChange={(e) => handleSocialPlatformChange(link.id, e.target.value as SocialPlatform | '')}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-h-[44px] ${
                        socialLinkErrors[`${link.id}-platform`] ? 'border-red-500' : 'border-gray-300'
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
                      <p className="mt-1 text-xs text-red-600">{socialLinkErrors[`${link.id}-platform`]}</p>
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
                        socialLinkErrors[`${link.id}-url`] ? 'border-red-500' : 'border-gray-300'
                      } ${!link.platform ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                    />
                    {socialLinkErrors[`${link.id}-url`] && (
                      <p className="mt-1 text-xs text-red-600">{socialLinkErrors[`${link.id}-url`]}</p>
                    )}
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveSocialLink(link.id)}
                    className="flex-shrink-0 inline-flex items-center justify-center w-full sm:w-12 h-12 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors min-h-[44px]"
                    title="Bu hesabı sil"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span className="sm:hidden ml-2">Sil</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Butonlar */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors min-h-[44px]"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isEdit ? 'Güncelleniyor...' : 'Ekleniyor...'}
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