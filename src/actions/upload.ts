'use server'

import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']

export async function uploadImage(formData: FormData): Promise<{
  success: boolean
  imagePath?: string
  error?: string
}> {
  try {
    const file = formData.get('file') as File

    if (!file) {
      return { success: false, error: 'Dosya seçilmedi' }
    }

    // Dosya tipi kontrolü
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        success: false,
        error: 'Sadece JPG, PNG ve WEBP formatları desteklenir',
      }
    }

    // Dosya boyutu kontrolü
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: 'Dosya boyutu maksimum 2MB olabilir',
      }
    }

    // Klasör kontrolü ve oluşturma
    if (!existsSync(UPLOAD_DIR)) {
      try {
        await mkdir(UPLOAD_DIR, { recursive: true })
      } catch (err) {
        console.error('Klasör oluşturma hatası:', err)
        return { success: false, error: 'Sunucu yazma izni hatası (Klasör)' }
      }
    }

    // Benzersiz dosya adı oluştur
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    // Dosya adındaki Türkçe karakterleri ve boşlukları temizleyelim
    const originalName = file.name.replace(/[^a-zA-Z0-9.]/g, '')
    const extension = originalName.split('.').pop()
    const fileName = `${timestamp}-${randomString}.${extension}`

    // Dosyayı kaydet
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = join(UPLOAD_DIR, fileName)

    try {
      await writeFile(filePath, buffer)
    } catch (err) {
      console.error('Dosya yazma hatası:', err)
      return { success: false, error: 'Sunucu yazma izni hatası (Dosya)' }
    }

    // await writeFile(filePath, buffer) eski halinden kaldı işe yararsa silinecek
  
    // Public URL oluştur
    const imagePath = `/uploads/${fileName}`

    return {
      success: true,
      imagePath,
    }
  } catch (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: 'Dosya yüklenirken bir hata oluştu',
    }
  }
}
