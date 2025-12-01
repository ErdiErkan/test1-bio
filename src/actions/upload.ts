'use server'

import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
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
        error: 'Dosya boyutu maksimum 5MB olabilir',
      }
    }

    // Uploads klasörünü oluştur (yoksa)
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true })
    }

    // Benzersiz dosya adı oluştur
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const extension = file.name.split('.').pop()
    const fileName = `${timestamp}-${randomString}.${extension}`

    // Dosyayı kaydet
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = join(UPLOAD_DIR, fileName)

    await writeFile(filePath, buffer)

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
