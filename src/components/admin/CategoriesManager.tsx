'use client'

import { useState, useEffect } from 'react'
import { createCategory, updateCategory, deleteCategory } from '@/actions/categories'
import { useToast } from '@/hooks/useToast'

// --- Types ---
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

interface Category {
  id: string
  name: string
  slug: string
  description: string | null

  // Root fields for safe fallback (populated by backend DTO)
  rootName?: string
  rootSlug?: string
  rootDescription?: string | null

  translations?: { language: Language; name: string; slug: string; description: string | null }[]
  _count?: {
    celebrities: number
  }
}

interface CommonData {
  // Empty for Category, but preserved for structure
}

interface TranslationData {
  name: string
  slug: string
  description: string
}

type FormState = {
  common: CommonData
  translations: Record<Language, TranslationData>
}

interface CategoriesManagerProps {
  initialCategories: Category[]
}

const getInitialTranslation = (): TranslationData => ({
  name: '',
  slug: '',
  description: ''
})

export default function CategoriesManager({ initialCategories }: CategoriesManagerProps) {
  const { addToast } = useToast()

  const [categories, setCategories] = useState(initialCategories)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [activeLang, setActiveLang] = useState<Language>('EN')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formState, setFormState] = useState<FormState>({
    common: {},
    translations: LANGUAGES.reduce((acc, lang) => ({ ...acc, [lang.code]: getInitialTranslation() }), {} as Record<Language, TranslationData>)
  })

  // Reset form to active default
  useEffect(() => {
    if (!isAdding) {
      setFormState({
        common: {},
        translations: LANGUAGES.reduce((acc, lang) => ({ ...acc, [lang.code]: getInitialTranslation() }), {} as Record<Language, TranslationData>)
      })
      setActiveLang('EN')
    }
  }, [isAdding])

  const resetForm = () => {
    setIsAdding(false)
    setEditingId(null)
  }

  const handleEdit = (category: Category) => {
    const newTranslations: Partial<Record<Language, TranslationData>> = {}

    LANGUAGES.forEach(lang => {
      const found = category.translations?.find((t: any) => t.language === lang.code)
      if (found) {
        newTranslations[lang.code] = {
          name: found.name,
          slug: found.slug,
          description: found.description || ''
        }
      } else {
        // SAFE FALLBACK STRATEGY
        // If English translation is missing, we MUST use the root fields.
        // This prevents overwriting the root data with empty strings or different language data.
        if (lang.code === 'EN') {
          newTranslations[lang.code] = {
            name: category.rootName || category.name,
            slug: category.rootSlug || category.slug,
            description: category.rootDescription || category.description || ''
          }
        } else {
          newTranslations[lang.code] = getInitialTranslation()
        }
      }
    })

    setFormState({
      common: {},
      translations: newTranslations as Record<Language, TranslationData>
    })
    setEditingId(category.id)
    setIsAdding(true)
  }

  const handleTranslationChange = (field: keyof TranslationData, value: string) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Prepare Payload
      const cleanTranslations: Record<string, any> = {};
      Object.entries(formState.translations).forEach(([key, data]) => {
        // Send if name exists
        if (data.name?.trim()) {
          cleanTranslations[key.toUpperCase()] = data
        }
      });

      const rawPayload = {
        common: {},
        translations: cleanTranslations
      }

      const payload = sanitizePayload(rawPayload)

      let result
      if (editingId) {
        result = await updateCategory(editingId, payload)
      } else {
        result = await createCategory(payload)
      }

      if (result.success) {
        addToast(
          editingId ? 'Kategori güncellendi' : 'Kategori eklendi',
          'success'
        )
        // Full page reload to ensure server data is fresh and synced
        window.location.reload()
      } else {
        if (result.details) {
          console.dir(result.details)
          addToast('Validasyon hatası', 'error')
        } else {
          addToast(result.error || 'Bir hata oluştu', 'error')
        }
      }
    } catch (error) {
      addToast('Bir hata oluştu', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) {
      return
    }

    const result = await deleteCategory(id)

    if (result.success) {
      addToast('Kategori silindi', 'success')
      setCategories(prev => prev.filter(cat => cat.id !== id))
    } else {
      addToast(result.error || 'Kategori silinemedi', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {/* Yeni Kategori Butonu */}
      {!isAdding && (
        <button
          onClick={() => { setIsAdding(true); }}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + Yeni Kategori Ekle
        </button>
      )}

      {/* Form */}
      {isAdding && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              {editingId ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}
            </h3>
            <div className="flex items-center gap-2 mt-2 md:mt-0">
              <span className="text-sm text-gray-600">Dil:</span>
              <select
                value={activeLang}
                onChange={(e) => setActiveLang(e.target.value as Language)}
                className="bg-white border text-gray-900 text-sm rounded-md focus:ring-blue-500 block p-2 cursor-pointer"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 mb-6">
              <h4 className="text-md font-semibold text-blue-900 mb-4 flex items-center gap-2">
                {LANGUAGES.find(l => l.code === activeLang)?.flag}
                {LANGUAGES.find(l => l.code === activeLang)?.label} İçerik
              </h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori Adı *
                </label>
                <input
                  type="text"
                  value={formState.translations[activeLang]?.name || ''}
                  onChange={(e) => handleTranslationChange('name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Örn: Oyuncu"
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Açıklama
                </label>
                <textarea
                  value={formState.translations[activeLang]?.description || ''}
                  onChange={(e) => handleTranslationChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Kategori açıklaması..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Kaydediliyor...' : editingId ? 'Güncelle' : 'Kaydet'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Kategori Listesi */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kategori
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Açıklama
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ünlü Sayısı
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    Henüz kategori eklenmemiş
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {category.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {category.slug}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {/* Show localized description if available in mapped DTO, otherwise entity field */}
                        {category.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {category._count?.celebrities || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button
                        onClick={() => handleEdit(category)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
