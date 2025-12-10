'use client'

import { useState, useEffect, useTransition } from 'react'
import { createCategory, updateCategory, deleteCategory } from '@/actions/categories'
import { useToast } from '@/hooks/useToast'
import { slugify } from '@/lib/utils'
import { useTranslations } from 'next-intl'

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
  rootName?: string
  rootSlug?: string
  rootDescription?: string | null
  translations?: { language: Language; name: string; slug: string; description: string | null }[]
  _count?: {
    celebrities: number
  }
}

interface CommonData {}

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
  locale: string
}

const getInitialTranslation = (): TranslationData => ({
  name: '',
  slug: '',
  description: ''
})

export default function CategoriesManager({ initialCategories, locale }: CategoriesManagerProps) {
  const t = useTranslations('admin.categories')
  const { addToast } = useToast()

  // Use the passed locale as the active language (Single Source of Truth)
  const activeLang = locale.toUpperCase() as Language
  // Ensure we fallback if passed locale isn't in our supported list (though middleware should catch this)
  const isSupported = LANGUAGES.some(l => l.code === activeLang)
  const currentLangCode = isSupported ? activeLang : 'EN'

  const [categories, setCategories] = useState(initialCategories)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // REMOVED: const [activeLang, setActiveLang] = useState<Language>('EN')
  
  const [isPending, startTransition] = useTransition()
  
  const [isSlugManuallyChanged, setIsSlugManuallyChanged] = useState(false)

  const [formState, setFormState] = useState<FormState>({
    common: {},
    translations: LANGUAGES.reduce((acc, lang) => ({ ...acc, [lang.code]: getInitialTranslation() }), {} as Record<Language, TranslationData>)
  })

  useEffect(() => {
    if (!isAdding) {
      setFormState({
        common: {},
        translations: LANGUAGES.reduce((acc, lang) => ({ ...acc, [lang.code]: getInitialTranslation() }), {} as Record<Language, TranslationData>)
      })
      setIsSlugManuallyChanged(false)
      setEditingId(null)
    }
  }, [isAdding])

  const resetForm = () => {
    setIsAdding(false)
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
    setIsSlugManuallyChanged(true)
    
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleTranslationChange = (field: keyof TranslationData, value: string) => {
    setFormState(prev => {
      const updatedTranslations = {
        ...prev.translations,
        [currentLangCode]: {
          ...prev.translations[currentLangCode],
          [field]: value
        }
      }

      if (field === 'name' && !isSlugManuallyChanged) {
        updatedTranslations[currentLangCode].slug = slugify(value)
      }

      if (field === 'slug') {
        setIsSlugManuallyChanged(true)
      }

      return {
        ...prev,
        translations: updatedTranslations
      }
    })
  }
  
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setIsSlugManuallyChanged(true)
      handleTranslationChange('slug', e.target.value)
  }

  const handleGenerateSlug = () => {
    const currentName = formState.translations[currentLangCode].name
    if (currentName) {
      handleTranslationChange('slug', slugify(currentName))
      setIsSlugManuallyChanged(true)
    }
  }

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

    startTransition(async () => {
      try {
        const cleanTranslations: Record<string, any> = {};
        
        Object.entries(formState.translations).forEach(([key, data]) => {
          if (data.name?.trim()) {
              if (!data.slug?.trim()) {
                  data.slug = slugify(data.name)
              }
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
          addToast(editingId ? t('success_update') : t('success_create'), 'success')
          window.location.reload()
        } else {
          addToast(result.error || 'Error', 'error')
        }
      } catch (error) {
        addToast('Error', 'error')
      }
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('delete_confirm'))) return
    
    const result = await deleteCategory(id)
    if (result.success) {
      addToast(t('success_delete'), 'success')
      setCategories(prev => prev.filter(cat => cat.id !== id))
    } else {
      addToast(result.error || 'Error', 'error')
    }
  }

  const getLocalizedCategoryData = (category: Category) => {
    const translation = category.translations?.find(t => t.language === currentLangCode);
    
    if (translation) {
      return {
        name: translation.name,
        slug: translation.slug,
        description: translation.description || '-',
        isFallback: false 
      };
    }

    return {
      name: category.name,
      slug: category.slug,
      description: category.description || '-',
      isFallback: true 
    };
  };

  const activeLanguageLabel = LANGUAGES.find(l => l.code === currentLangCode)?.label || 'English';

  return (
    <div className="space-y-6">
      
      {/* Üst Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-xl font-bold text-gray-900">
          {editingId ? t('edit_title') : t('list_title')}
        </h3>

        <div className="flex items-center gap-4 w-full md:w-auto">

          {/* REMOVED LANGUAGE SELECTOR */}

          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm whitespace-nowrap ml-auto"
            >
              {t('add_new')}
            </button>
          )}
        </div>
      </div>

      {/* Ekleme/Düzenleme Formu */}
      {isAdding && (
        <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-blue-100 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex justify-between items-center mb-4">
             <h4 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                {LANGUAGES.find(l => l.code === currentLangCode)?.flag}
                {t('content_entry', { lang: activeLanguageLabel })}
             </h4>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('form.name')} *
                  </label>
                  <input
                      type="text"
                      value={formState.translations[currentLangCode]?.name || ''}
                      onChange={(e) => handleTranslationChange('name', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder={`Örn: ${currentLangCode === 'TR' ? 'Oyuncu' : 'Actor'}`}
                      required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('form.slug')}
                      <button 
                          type="button" 
                          onClick={handleGenerateSlug}
                          className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline font-medium"
                      >
                          {t('form.auto_generate')}
                      </button>
                  </label>
                  <input
                      type="text"
                      value={formState.translations[currentLangCode]?.slug || ''}
                      onChange={handleSlugChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-gray-600 font-mono text-sm transition-colors"
                      placeholder="url-slug"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                      {t('form.slug_hint')}
                  </p>
                </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('form.description')}
              </label>
              <textarea
                value={formState.translations[currentLangCode]?.description || ''}
                onChange={(e) => handleTranslationChange('description', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder={t('form.description_placeholder')}
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                {t('form.cancel')}
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm flex items-center"
              >
                {isPending && (
                   <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                )}
                {isPending ? t('form.saving') : editingId ? t('form.update') : t('form.save')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Kategori Listesi Tablosu */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {t('table.category')} ({currentLangCode})
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {t('table.description')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {t('table.count')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {t('table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                        <span className="text-4xl mb-2">📭</span>
                        <p>{t('no_records')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                categories.map((category) => {
                  const localizedData = getLocalizedCategoryData(category);
                  return (
                    <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                            <div className="text-sm font-bold text-gray-900">
                                {localizedData.name}
                            </div>
                            {localizedData.isFallback && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-800 border border-yellow-200" title={t('no_translation')}>
                                    {t('no_translation')}
                                </span>
                            )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 font-mono bg-gray-100 px-2 py-0.5 rounded inline-block">
                          /{localizedData.slug}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-sm ${localizedData.isFallback ? 'text-gray-400 italic' : 'text-gray-600'}`}>
                          {localizedData.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                          {category._count?.celebrities || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                        <button
                          onClick={() => handleEdit(category)}
                          className="text-blue-600 hover:text-blue-900 font-medium hover:underline"
                        >
                          {t('table.edit')}
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="text-red-600 hover:text-red-900 font-medium hover:underline"
                        >
                          {t('table.delete')}
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
