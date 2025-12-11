'use server';

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { auth } from '@/lib/auth';

const UPLOAD_BASE = join(process.cwd(), 'public', 'uploads');

// Competition-specific upload directories
const COMPETITION_DIRS = {
  cover: join(UPLOAD_BASE, 'competitions', 'covers'),
  logo: join(UPLOAD_BASE, 'competitions', 'logos'),
} as const;

type CompetitionImageType = keyof typeof COMPETITION_DIRS;

export async function uploadCompetitionImage(
  formData: FormData,
  imageType: CompetitionImageType
): Promise<{ success: boolean; imagePath?: string; error?: string }> {
  try {
    // Auth Check
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return { success: false, error: 'Unauthorized' };
    }

    const file = formData.get('file') as File;

    if (!file) {
      return { success: false, error: 'Dosya seçilmedi' };
    }

    // Validation
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    const MAX_SIZE = imageType === 'cover' ? 5 * 1024 * 1024 : 2 * 1024 * 1024; // 5MB cover, 2MB logo

    if (!ALLOWED_TYPES.includes(file.type)) {
      return { success: false, error: 'Sadece JPG, PNG ve WEBP formatları desteklenir' };
    }

    if (file.size > MAX_SIZE) {
      return { success: false, error: `Dosya boyutu maksimum ${MAX_SIZE / 1024 / 1024}MB olabilir` };
    }

    // Ensure directory exists
    const uploadDir = COMPETITION_DIRS[imageType];
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${timestamp}-${randomString}.${extension}`;

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // Return public URL path
    const publicPath = `/uploads/competitions/${imageType === 'cover' ? 'covers' : 'logos'}/${fileName}`;

    return { success: true, imagePath: publicPath };

  } catch (error) {
    console.error('Competition upload error:', error);
    return { success: false, error: 'Dosya yüklenirken bir hata oluştu' };
  }
}
