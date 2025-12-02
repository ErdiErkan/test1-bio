'use client'

import { useState } from 'react'
import { createCategory, updateCategory, deleteCategory } from '@/actions/categories'
import { useToast } from '@/hooks/useToast'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  _count?: {
    celebrities: number
  }
}

interface CategoriesManagerProps {
  initialCategories: Category[]
}

export default function CategoriesManager({ initialCategories }: CategoriesManagerProps) {
  const { addToast } = useToast()
  const [categories, setCategories] = useState(initialCategories)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formDataObj = new FormData()
      formDataObj.append('name', formData.name)
      formDataObj.append('description', formData.description)

      let result
      if (editingId) {
        result = await updateCategory(editingId, formDataObj)
      } else {
        result = await createCategory(formDataObj)
      }

      if (result.success) {
        addToast(
          editingId ? 'Kategori güncellendi' : 'Kategori eklendi',
          'success'
        )

        // Listeyi güncelle
        if (editingId) {
          setCategories(prev =>
            prev.map(cat => cat.id === editingId ? { ...cat, ...result.data } : cat)
          )
        } else {
          setCategories(prev => [...prev, result.data as Category])
        }

        // Formu sıfırla
        setFormData({ name: '', description: '' })
        setIsAdding(false)
        setEditingId(null)
      } else {
        addToast(result.error || 'Bir hata oluştu', 'error')
      }
    } catch (error) {
      addToast('Bir hata oluştu', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (category: Category) => {
    setFormData({
      name: category.name,
      description: category.description || ''
    })
    setEditingId(category.id)
    setIsAdding(true)
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

  const handleCancel = () => {
    setFormData({ name: '', description: '' })
    setIsAdding(false)
    setEditingId(null)
  }

  return (
    <div className="space-y-6">
      {/* Yeni Kategori Butonu */}
      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + Yeni Kategori Ekle
        </button>
      )}

      {/* Form */}
      {isAdding && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            {editingId ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategori Adı *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Örn: Oyuncu"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Açıklama
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Kategori açıklaması..."
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Kaydediliyor...' : editingId ? 'Güncelle' : 'Ekle'}
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
