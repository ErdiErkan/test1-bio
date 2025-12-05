// src/app/uploads/[filename]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    // URL'den dosya adını al (await params kullanımı Next.js 15 için)
    const { filename } = await params

    // Dosyanın diskteki tam yolunu bul
    const filePath = path.join(process.cwd(), 'public', 'uploads', filename)

    // Dosya var mı kontrol et
    if (!fs.existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 })
    }

    // Dosyayı oku
    const fileBuffer = fs.readFileSync(filePath)

    // Dosya uzantısına göre Content-Type belirle
    const ext = path.extname(filename).toLowerCase()
    let contentType = 'application/octet-stream'
    
    if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg'
    else if (ext === '.png') contentType = 'image/png'
    else if (ext === '.webp') contentType = 'image/webp'
    else if (ext === '.svg') contentType = 'image/svg+xml'

    // Dosyayı tarayıcıya gönder
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Image serve error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}