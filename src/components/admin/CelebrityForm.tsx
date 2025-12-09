'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/useToast'
import { uploadImage } from '@/actions/upload'
import { createCelebrity, updateCelebrity } from '@/actions/celebrities'
import { getCategories } from '@/actions/categories'
import type { SocialPlatform } from '@/lib/types'
import { useTranslations } from 'next-intl'
import { getAllCountries } from 'countries-and-timezones'

// --- TYPES & INTERFACES ---

const COUNTRIES = Object.values(getAllCountries()).map(c => ({
  name: c.name,
  code: c.id
})).sort((a, b) => a.name.localeCompare(b.name))

type Language = 'EN' | 'TR' | 'ES' | 'IT' | 'PT' | 'FR' | 'DE'

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'EN', label: 'English', flag: '🇺🇸' },
  { code: 'TR', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'ES', label: 'Español', flag: '🇪🇸' },
  { code: 'IT', label: 'Italiano', flag: '🇮🇹' },
  { code: 'PT', label: 'Português', flag: '🇵🇹' },
  { code: 'FR', label: 'Français', flag: '🇫🇷' },
  { code: 'DE', label: 'Deutsch', flag: '🇩🇪' },
]

// Configuration-Driven Fields
interface FieldConfig {
  key: string
  type: 'text' | 'textarea' | 'select'
  required?: boolean
  rows?: number // for textarea
  options?: { label: string; value: string }[] // for select
}

// Language Specific Fields
const LANGUAGE_SPECIFIC_FIELDS: FieldConfig[] = [
  { key: 'profession', type: 'text', required: true },
  { key: 'nickname', type: 'text' },
  { key: 'altText', type: 'text' },
  { key: 'bio', type: 'textarea', rows: 6 },
]

interface ImageInput {
  id: string
  url: string
  file: File | null
  preview: string
  isMain: boolean
  isUploading: boolean
  error: boolean
}

interface CommonData {
  birthDate: string
  gender: string
  categoryIds: string[]
  images: ImageInput[]
  publishedLanguages: Language[]
}

// "SharedState" holds values that populate all languages automatically
interface SharedState {
  name: string
  birthPlace: string
  nationality: string
}

interface TranslationData {
  name: string
  nickname: string
  profession: string
  slug: string
  birthPlace: string
  nationality: string
  zodiac: string
  bio: string
  altText: string
  faqs: FAQInput[]
  [key: string]: any
}

type FormState = {
  common: CommonData
  shared: SharedState
  translations: Record<Language, TranslationData>
}

interface SocialLinkInput {
  id: string
  platform: SocialPlatform | ''
  url: string
}

interface FAQInput {
  id: string
  question: string
  answer: string
}

interface CelebrityFormProps {
  celebrity?: any
  isEdit?: boolean
}

interface Category {
  id: string
  name: string
}

// --- CONSTANTS ---

const MAX_IMAGES = 3
const SOCIAL_PLATFORMS: { value: SocialPlatform; label: string; icon: string }[] = [
  { value: 'INSTAGRAM', label: 'Instagram', icon: '📷' },
  { value: 'TWITTER', label: 'Twitter / X', icon: '𝕏' },
  { value: 'YOUTUBE', label: 'YouTube', icon: '▶️' },
  { value: 'TIKTOK', label: 'TikTok', icon: '🎵' },
  { value: 'FACEBOOK', label: 'Facebook', icon: '👤' },
  { value: 'LINKEDIN', label: 'LinkedIn', icon: '💼' },
  { value: 'WEBSITE', label: 'Website', icon: '🌐' },
  { value: 'IMDB', label: 'IMDb', icon: '🎬' },
  { value: 'SPOTIFY', label: 'Spotify', icon: '🎧' },
]

const generateId = () => Math.random().toString(36).substring(2, 9)

const getSafeUrl = (url: string | null | undefined): string => {
  if (!url) return ''
  if (url.startsWith('http') || url.startsWith('data:')) return url
  return url.startsWith('/') ? url : `/${url}`
}

const getInitialTranslation = (code: string): TranslationData => ({
  name: '', nickname: '', profession: '', slug: '',
  birthPlace: '', nationality: '', zodiac: '', bio: '', altText: '',
  faqs: []
})

// --- MAIN COMPONENT ---

export default function CelebrityForm({ celebrity, isEdit }: CelebrityFormProps) {
  const router = useRouter()
  const t = useTranslations('admin.form')
  const { addToast } = useToast()

  const [activeLang, setActiveLang] = useState<Language>('EN')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Determine initial shared values
  const getInitialShared = (): SharedState => {
    if (celebrity) {
      const en = celebrity.translations?.find((t: any) => t.language === 'EN')
      if (en) return { name: en.name, birthPlace: en.birthPlace, nationality: en.nationality }

      if (celebrity.name) return { name: celebrity.name, birthPlace: celebrity.birthPlace || '', nationality: celebrity.nationality || '' }

      const anyT = celebrity.translations?.[0]
      if (anyT) return { name: anyT.name, birthPlace: anyT.birthPlace, nationality: anyT.nationality }
    }
    return { name: '', birthPlace: '', nationality: '' }
  }

  const [formState, setFormState] = useState<FormState>(() => {
    const initialTranslations: Partial<Record<Language, TranslationData>> = {}

    // Initialize translations from prop or empty
    LANGUAGES.forEach(lang => {
      let data = getInitialTranslation(lang.code)

      if (celebrity?.translations) {
        const found = celebrity.translations.find((t: any) => t.language === lang.code)
        if (found) {
          data = { ...data, ...found }
        }
        data.faqs = [] // Initial empty FAQs, will be populated by useEffect
      }
      initialTranslations[lang.code] = data
    })

    return {
      common: {
        birthDate: celebrity?.birthDate ? new Date(celebrity.birthDate).toISOString().split('T')[0] : '',
        gender: celebrity?.gender || '',
        categoryIds: celebrity?.categories?.map((c: any) => c.id) || [],
        publishedLanguages: celebrity?.publishedLanguages || [],
        images: (celebrity?.images || []).map((img: any, idx: number) => ({
          id: generateId(),
          url: getSafeUrl(img.url),
          file: null,
          preview: getSafeUrl(img.url),
          isMain: img.isMain,
          isUploading: false,
          error: false
        }))
      },
      shared: getInitialShared(),
      translations: initialTranslations as Record<Language, TranslationData>
    }
  })

  // Sync state with props when celebrity changes (Fix for Edit Mode - Reactive State)
  useEffect(() => {
    if (!celebrity) return

    // 1. Calculate Shared State
    const enTranslation = celebrity.translations?.find((t: any) => t.language === 'EN')
    const sharedName = enTranslation?.name || celebrity.name || ''
    const sharedBirthPlace = enTranslation?.birthPlace || celebrity.birthPlace || ''
    const sharedNationality = enTranslation?.nationality || celebrity.nationality || ''

    const newShared = {
      name: sharedName,
      birthPlace: sharedBirthPlace,
      nationality: sharedNationality
    }

    // 2. Prepare Translations
    const newTranslations: Partial<Record<Language, TranslationData>> = {}

    LANGUAGES.forEach(lang => {
      // Start with empty defaults
      let data = getInitialTranslation(lang.code)

      // Merge with existing translation if found
      const found = celebrity.translations?.find((t: any) => t.language === lang.code)
      if (found) {
        data = { ...data, ...found }
      }

      // Populate FAQs from Root Array (filtered by language)
      if (celebrity.faqs && Array.isArray(celebrity.faqs)) {
        const langFaqs = celebrity.faqs.filter((f: any) =>
          (f.language === lang.code) || (!f.language && lang.code === 'EN') // Handle legacy/default EN
        )

        data.faqs = langFaqs.map((f: any) => ({
          id: generateId(), // Always generate new ID for UI handling
          question: f.question,
          answer: f.answer
        }))
      }

      // Enforce Shared Fields
      data.name = newShared.name
      data.birthPlace = newShared.birthPlace
      data.nationality = newShared.nationality

      newTranslations[lang.code] = data
    })

    // 3. Fallback for Explicit EN Creation (if missing in DB)
    if (!newTranslations['EN']?.slug && celebrity.slug) {
      newTranslations['EN'] = {
        ...newTranslations['EN']!,
        slug: celebrity.slug,
        bio: celebrity.bio || '',
        name: celebrity.name
      }
    }

    // 4. Update Form State
    setFormState(prev => ({
      common: {
        ...prev.common,
        birthDate: celebrity.birthDate ? new Date(celebrity.birthDate).toISOString().split('T')[0] : '',
        gender: celebrity.gender || '',
        categoryIds: celebrity.categories?.map((c: any) => c.id) || [],
        publishedLanguages: celebrity.publishedLanguages || [],
        images: (celebrity.images || []).map((img: any) => ({
          id: generateId(),
          url: getSafeUrl(img.url),
          file: null,
          preview: getSafeUrl(img.url),
          isMain: img.isMain,
          isUploading: false,
          error: false
        }))
      },
      shared: newShared,
      translations: newTranslations as Record<Language, TranslationData>
    }))

    // 5. Update Standalone States
    setSocialLinks(celebrity.socialMediaLinks?.map((l: any) => ({
      id: generateId(), platform: l.platform, url: l.url
    })) || [])

  }, [celebrity]) // Re-run when celebrity prop updates

  // Sync Shared State to all translations on init/change
  useEffect(() => {
    setFormState(prev => {
      const nextTranslations = { ...prev.translations }
      LANGUAGES.forEach(lang => {
        nextTranslations[lang.code] = {
          ...nextTranslations[lang.code],
          name: prev.shared.name,
          birthPlace: prev.shared.birthPlace,
          nationality: prev.shared.nationality
        }
      })
      return { ...prev, translations: nextTranslations }
    })
  }, [formState.shared.name, formState.shared.birthPlace, formState.shared.nationality])


  const [socialLinks, setSocialLinks] = useState<SocialLinkInput[]>(() =>
    celebrity?.socialMediaLinks?.map((l: any) => ({
      id: generateId(), platform: l.platform, url: l.url
    })) || []
  )

  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    async function loadCategories() {
      const result = await getCategories()
      if (result.success && result.data) {
        setCategories(result.data)
      }
    }
    loadCategories()
  }, [])

  // --- HANDLERS ---

  const handleCommonChange = (field: keyof CommonData, value: any) => {
    setFormState(prev => ({
      ...prev,
      common: { ...prev.common, [field]: value }
    }))
  }

  const handleSharedChange = (field: keyof SharedState, value: string) => {
    setFormState(prev => {
      const nextTranslations = { ...prev.translations }
      // Propagate to ALL languages
      LANGUAGES.forEach(lang => {
        nextTranslations[lang.code] = {
          ...nextTranslations[lang.code],
          [field]: value
        }
      })
      return {
        ...prev,
        shared: { ...prev.shared, [field]: value },
        translations: nextTranslations
      }
    })
  }

  const handleTranslationChange = (field: string, value: any) => {
    setFormState(prev => ({
      ...prev,
      translations: {
        ...prev.translations,
        [activeLang]: {
          ...prev.translations[activeLang],
          [field]: value
        }
      }
    }))
  }

  // FAQ Handlers
  const handleAddFaq = () => {
    const newFaq: FAQInput = { id: generateId(), question: '', answer: '' }
    const currentFaqs = formState.translations[activeLang].faqs || []
    handleTranslationChange('faqs', [...currentFaqs, newFaq])
  }

  const handleRemoveFaq = (id: string) => {
    const currentFaqs = formState.translations[activeLang].faqs || []
    handleTranslationChange('faqs', currentFaqs.filter(f => f.id !== id))
  }

  const handleFaqChange = (id: string, field: 'question' | 'answer', value: string) => {
    const currentFaqs = formState.translations[activeLang].faqs || []
    const updatedFaqs = currentFaqs.map(f => f.id === id ? { ...f, [field]: value } : f)
    handleTranslationChange('faqs', updatedFaqs)
  }

  const handleCategoryToggle = (id: string) => {
    const current = formState.common.categoryIds
    const next = current.includes(id)
      ? current.filter(c => c !== id)
      : [...current, id]
    handleCommonChange('categoryIds', next)
  }

  const handleLanguageToggle = (code: Language) => {
    const current = formState.common.publishedLanguages
    const next = current.includes(code)
        ? current.filter(c => c !== code)
        : [...current, code]
    handleCommonChange('publishedLanguages', next)
  }

  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (formState.common.images.length >= MAX_IMAGES) return
    const reader = new FileReader()
    reader.onloadend = () => {
      const newImg: ImageInput = {
        id: generateId(), url: '', file, preview: reader.result as string,
        isMain: formState.common.images.length === 0, isUploading: false, error: false
      }
      setFormState(prev => ({
        ...prev, common: { ...prev.common, images: [...prev.common.images, newImg] }
      }))
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = (id: string) => {
    setFormState(prev => {
      const filtered = prev.common.images.filter(i => i.id !== id)
      if (filtered.length > 0 && !filtered.some(i => i.isMain)) filtered[0].isMain = true
      return { ...prev, common: { ...prev.common, images: filtered } }
    })
  }

  // Helper: Sanitize Payload (Convert empty strings to undefined/null)
  const sanitizePayload = (obj: any): any => {
    if (obj === null || obj === undefined) return obj
    if (typeof obj === 'string') return obj.trim() === '' ? undefined : obj.trim()
    if (Array.isArray(obj)) return obj.map(sanitizePayload)
    if (typeof obj === 'object') {
      const newObj: any = {}
      for (const key in obj) {
        newObj[key] = sanitizePayload(obj[key])
      }
      return newObj
    }
    return obj
  }

  // Helper: Dynamic Input Renderer
  const renderInput = (field: FieldConfig, lang: Language) => {
    const value = formState.translations[lang][field.key] || ''

    if (field.type === 'select' && field.options) {
      return (
        <select
          value={value}
          onChange={(e) => handleTranslationChange(field.key, e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">{t('select')}</option>
          {field.options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )
    }

    if (field.type === 'textarea') {
      return (
        <textarea
          value={value}
          onChange={(e) => handleTranslationChange(field.key, e.target.value)}
          rows={field.rows || 4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
          placeholder={t(`fields.${field.key}`)}
        />
      )
    }

    return (
      <input
        type="text"
        value={value}
        onChange={(e) => handleTranslationChange(field.key, e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
        placeholder={t(`fields.${field.key}`)}
      />
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // 1. Upload Images
      const uploadedImages = []
      for (const img of formState.common.images) {
        if (img.file) {
          const fd = new FormData()
          fd.append('file', img.file)
          const res = await uploadImage(fd)
          if (!res.success) throw new Error('Image upload failed')
          uploadedImages.push({
            url: getSafeUrl(res.imagePath),
            isMain: img.isMain,
            displayOrder: uploadedImages.length
          })
        } else {
          uploadedImages.push({
            url: img.url,
            isMain: img.isMain,
            displayOrder: uploadedImages.length
          })
        }
      }

      // 2. Prepare Payload (STRICT CLEANING)
      const cleanTranslations: Record<string, any> = {};
      Object.entries(formState.translations).forEach(([key, data]) => {
        // Ensure we only send languages that actually have data (and at least a name)
        // Name comes from shared state, so check shared name primarily.
        if (formState.shared.name?.trim()) {
          cleanTranslations[key.toUpperCase()] = {
            ...data,
            faqs: data.faqs // Ensure FAQs are included
          }
        }
      });

      // Fix BirthDate empty string issue
      const finalBirthDate = formState.common.birthDate === '' ? null : formState.common.birthDate

      const rawPayload = {
        common: {
          ...formState.common,
          birthDate: finalBirthDate,
          images: uploadedImages,
          socialLinks,
          // faqs removed from common
        },
        translations: cleanTranslations // Send cleaned translations
      }

      // 3. Sanitize Payload (Convert "" -> undefined)
      const payload = sanitizePayload(rawPayload)
      console.log('Submitting Payload:', payload)

      let result
      if (isEdit && celebrity?.id) {
        result = await updateCelebrity(celebrity.id, payload)
      } else {
        result = await createCelebrity(payload)
      }

      if (!result.success) {
        if (result.details) {
          console.dir(result.details, { depth: null }) // Log deep details on client too
          throw new Error(t('error_validation'))
        }
        throw new Error(result.error)
      }

      addToast(isEdit ? t('success_update') : t('success'), 'success')
      router.refresh()
      router.push('/admin')

    } catch (err: any) {
      console.error(err)
      addToast(err.message || t('error'), 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="border-b px-8 py-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          {isEdit ? t('title_edit') : t('title_new')}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">

        {/* === SHARED / GLOBAL INFO SECTION === */}
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            🌍 Primary Information (Shared across all languages)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('fields.name')} <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formState.shared.name}
                onChange={(e) => handleSharedChange('name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Full Name (John Doe)"
              />
              <p className="text-xs text-gray-500 mt-1">This name will be used for all languages.</p>
            </div>

            {/* Birth Place */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('fields.birthPlace')}</label>
              <input
                type="text"
                value={formState.shared.birthPlace}
                onChange={(e) => handleSharedChange('birthPlace', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="e.g. New York, USA"
              />
            </div>

            {/* Nationality (Dropdown) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('fields.nationality')}</label>
              <select
                value={formState.shared.nationality}
                onChange={(e) => handleSharedChange('nationality', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">{t('select')}</option>
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Birth Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('birth_date')}</label>
              <input
                type="date"
                value={formState.common.birthDate}
                onChange={(e) => handleCommonChange('birthDate', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">Zodiac: Calculated Automatically</p>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('gender')}</label>
              <select
                value={formState.common.gender}
                onChange={(e) => handleCommonChange('gender', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">{t('select')}</option>
                <option value="MALE">{t('male')}</option>
                <option value="FEMALE">{t('female')}</option>
                <option value="OTHER">{t('other')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* === LANGUAGE SPECIFIC SECTION === */}
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 transition-all duration-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-blue-800 flex items-center gap-2">
              <span>{LANGUAGES.find(l => l.code === activeLang)?.flag}</span>
              <span>{LANGUAGES.find(l => l.code === activeLang)?.label}</span>
              <span>{t('language_specific_details')}</span>
            </h3>

            {/* Language Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-blue-800">Editing:</span>
              <select
                value={activeLang}
                onChange={(e) => setActiveLang(e.target.value as Language)}
                className="bg-white border-blue-300 text-blue-900 text-sm rounded-md focus:ring-blue-500 block p-2 cursor-pointer"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-6">
            {LANGUAGE_SPECIFIC_FIELDS.map(field => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t(`fields.${field.key}`)}
                  {field.required && <span className="text-red-500">*</span>}
                </label>
                {renderInput(field, activeLang)}
              </div>
            ))}
          </div>

          {/* FAQs (Localized) */}
          <div className="mt-8 pt-6 border-t border-blue-200">
            <label className="block text-lg font-medium text-blue-900 mb-4">{t('faqs')} ({activeLang})</label>
            <div className="space-y-4">
              {(formState.translations[activeLang].faqs || []).map((faq, index) => (
                <div key={faq.id} className="p-4 bg-white rounded-lg border border-blue-100 space-y-3 shadow-sm">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-medium text-gray-500">FAQ #{index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => handleRemoveFaq(faq.id)}
                      className="text-red-500 hover:text-red-700 text-xs font-medium"
                    >
                      Delete
                    </button>
                  </div>
                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) => handleFaqChange(faq.id, 'question', e.target.value)}
                    placeholder="Question"
                    className="w-full px-3 py-2 border rounded-md"
                  />
                  <textarea
                    value={faq.answer}
                    onChange={(e) => handleFaqChange(faq.id, 'answer', e.target.value)}
                    placeholder="Answer"
                    rows={2}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddFaq}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                + Add FAQ ({activeLang})
              </button>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('categories')}</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {categories.map(cat => (
              <label key={cat.id} className={`flex items-center px-4 py-3 border rounded-lg cursor-pointer transition-colors ${formState.common.categoryIds.includes(cat.id) ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'
                }`}>
                <input
                  type="checkbox"
                  checked={formState.common.categoryIds.includes(cat.id)}
                  onChange={() => handleCategoryToggle(cat.id)}
                  className="mr-2"
                />
                <span className="text-sm">{cat.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Published Languages */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Published Languages</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {LANGUAGES.map(lang => (
              <label key={lang.code} className={`flex items-center px-4 py-3 border rounded-lg cursor-pointer transition-colors ${formState.common.publishedLanguages.includes(lang.code) ? 'bg-green-50 border-green-500' : 'hover:bg-gray-50'
                }`}>
                <input
                  type="checkbox"
                  checked={formState.common.publishedLanguages.includes(lang.code)}
                  onChange={() => handleLanguageToggle(lang.code)}
                  className="mr-2"
                />
                <span className="text-sm flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                </span>
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">If unchecked, the profile will return 404 for that language locale.</p>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('photos')}</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {formState.common.images.map((img) => (
              <div key={img.id} className="relative aspect-[3/4] group">
                <Image src={img.preview} alt="preview" fill className="object-cover rounded-lg" />
                <button type="button" onClick={() => handleRemoveImage(img.id)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                  X
                </button>
                {img.isMain && <span className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full shadow-md">Main</span>}
              </div>
            ))}
            {formState.common.images.length < MAX_IMAGES && (
              <label className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 aspect-[3/4] transition-colors">
                <span className="text-3xl text-gray-400 mb-2">+</span>
                <span className="text-sm text-gray-600 font-medium">{t('add_photo')}</span>
                <input type="file" onChange={handleAddImage} className="hidden" accept="image/*" />
              </label>
            )}
          </div>
        </div>

        {/* Social Media Links */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Social Media</label>
          <div className="space-y-3">
            {socialLinks.map((link, index) => (
              <div key={link.id} className="flex flex-col md:flex-row gap-3">
                <select
                  value={link.platform}
                  onChange={(e) => {
                    const newLinks = [...socialLinks]
                    newLinks[index].platform = e.target.value as SocialPlatform
                    setSocialLinks(newLinks)
                  }}
                  className="w-full md:w-1/3 px-4 py-2 border rounded-lg bg-gray-50"
                >
                  <option value="">Select Platform</option>
                  {SOCIAL_PLATFORMS.map(p => (
                    <option key={p.value} value={p.value}>{p.icon} {p.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={link.url}
                  onChange={(e) => {
                    const newLinks = [...socialLinks]
                    newLinks[index].url = e.target.value
                    setSocialLinks(newLinks)
                  }}
                  placeholder="Profile URL"
                  className="flex-1 px-4 py-2 border rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setSocialLinks(prev => prev.filter(l => l.id !== link.id))}
                  className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg border border-red-200"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setSocialLinks(prev => [...prev, { id: generateId(), platform: '', url: '' }])}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 mt-2"
            >
              + Add Social Link
            </button>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white p-4 shadow-top z-10">
          <button type="button" onClick={() => router.back()} className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
            {t('cancel')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-lg"
          >
            {isSubmitting ? t('saving') : (isEdit ? t('update') : t('save'))}
          </button>
        </div>
      </form>
    </div>
  )
}