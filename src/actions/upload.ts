'use server'

import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB for Covers
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']

type UploadContext = 'default' | 'competition-cover' | 'competition-logo'

export async function uploadImage(
  formData: FormData,
  context: UploadContext = 'default'
): Promise<{
  success: boolean
  imagePath?: string
  error?: string
}> {
  try {
    const file = formData.get('file') as File

    if (!file) {
      return { success: false, error: 'No file selected' }
    }

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        success: false,
        error: 'Only JPG, PNG, and WEBP formats are supported',
      }
    }

    // Validate size based on context
    const limit = context === 'competition-logo' ? 2 * 1024 * 1024 : MAX_FILE_SIZE
    if (file.size > limit) {
      return {
        success: false,
        error: `File size must be under ${limit / (1024 * 1024)}MB`,
      }
    }

    // Determine target directory
    let subDir = ''
    if (context === 'competition-cover') subDir = 'competitions/covers'
    else if (context === 'competition-logo') subDir = 'competitions/logos'

    const targetDir = subDir ? join(UPLOAD_DIR, subDir) : UPLOAD_DIR

    // Ensure directory exists
    if (!existsSync(targetDir)) {
      try {
        await mkdir(targetDir, { recursive: true })
      } catch (err) {
        console.error('Directory creation error:', err)
        return { success: false, error: 'Server permission error (Directory)' }
      }
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const originalName = file.name.replace(/[^a-zA-Z0-9.]/g, '')
    const extension = originalName.split('.').pop()
    const fileName = `${timestamp}-${randomString}.${extension}`

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = join(targetDir, fileName)

    try {
      await writeFile(filePath, buffer)
    } catch (err) {
      console.error('File write error:', err)
      return { success: false, error: 'Server permission error (File)' }
    }
  
    // Return Public URL
    const imagePath = subDir ? `/uploads/${subDir}/${fileName}` : `/uploads/${fileName}`

    return {
      success: true,
      imagePath,
    }
  } catch (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: 'An error occurred while uploading the file',
    }
  }
}
