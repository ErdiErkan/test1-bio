'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import type { ReportStatus, ReportType, ActionResponse, ReportWithCelebrity } from '@/lib/types'

// Validation helpers
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function validateMessage(message: string): { valid: boolean; error?: string } {
  if (!message || message.trim().length < 10) {
    return { valid: false, error: 'Mesaj en az 10 karakter olmalıdır' }
  }
  if (message.trim().length > 1000) {
    return { valid: false, error: 'Mesaj en fazla 1000 karakter olabilir' }
  }
  return { valid: true }
}

function validateReportType(type: string): type is ReportType {
  return ['WRONG_INFO', 'TYPO', 'IMAGE_ISSUE', 'OTHER'].includes(type)
}

function validateReportStatus(status: string): status is ReportStatus {
  return ['PENDING', 'IN_REVIEW', 'RESOLVED', 'REJECTED'].includes(status)
}

/**
 * Creates a new report from user feedback
 */
export async function createReport(formData: FormData): Promise<ActionResponse> {
  try {
    // Honeypot check - if _gotcha field is filled, silently reject
    const honeypot = formData.get('_gotcha') as string
    if (honeypot && honeypot.trim().length > 0) {
      // Silently reject spam bots
      return { success: true, message: 'Geri bildiriminiz alındı. Teşekkürler!' }
    }

    // Extract form data
    const celebrityId = formData.get('celebrityId') as string
    const type = formData.get('type') as string
    const message = formData.get('message') as string
    const contactEmail = formData.get('contactEmail') as string | null

    // Validate celebrityId
    if (!celebrityId || celebrityId.trim().length === 0) {
      return { success: false, message: 'Geçersiz ünlü bilgisi' }
    }

    // Validate report type
    if (!type || !validateReportType(type)) {
      return { success: false, message: 'Geçerli bir sorun türü seçin' }
    }

    // Validate message
    const messageValidation = validateMessage(message)
    if (!messageValidation.valid) {
      return { success: false, message: messageValidation.error || 'Geçersiz mesaj' }
    }

    // Validate email if provided
    if (contactEmail && contactEmail.trim().length > 0) {
      if (!validateEmail(contactEmail.trim())) {
        return { success: false, message: 'Geçerli bir e-posta adresi girin' }
      }
    }

    // Verify celebrity exists
    const celebrity = await prisma.celebrity.findUnique({
      where: { id: celebrityId }
    })

    if (!celebrity) {
      return { success: false, message: 'Ünlü bulunamadı' }
    }

    // Create report
    await prisma.report.create({
      data: {
        celebrityId,
        type: type as ReportType,
        message: message.trim(),
        contactEmail: contactEmail?.trim() || null,
        status: 'PENDING'
      }
    })

    return { success: true, message: 'Geri bildiriminiz için teşekkürler!' }
  } catch (error) {
    console.error('Create report error:', error)
    return { success: false, message: 'Bir hata oluştu. Lütfen tekrar deneyin.' }
  }
}

/**
 * Updates report status (Admin only)
 */
export async function updateReportStatus(
  id: string,
  status: ReportStatus
): Promise<ActionResponse> {
  try {
    // Check admin authorization
    const session = await auth()
    if (!session?.user || session.user.role !== 'admin') {
      return { success: false, message: 'Yetkisiz erişim' }
    }

    // Validate status
    if (!validateReportStatus(status)) {
      return { success: false, message: 'Geçersiz durum' }
    }

    // Update report
    await prisma.report.update({
      where: { id },
      data: { status }
    })

    revalidatePath('/admin/reports')
    return { success: true, message: 'Durum güncellendi' }
  } catch (error) {
    console.error('Update report status error:', error)
    return { success: false, message: 'Güncelleme hatası' }
  }
}

/**
 * Gets all reports for admin panel
 */
export async function getReports(options?: {
  status?: ReportStatus
  page?: number
  limit?: number
}): Promise<{
  success: boolean
  data?: ReportWithCelebrity[]
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  error?: string
}> {
  try {
    // Check admin authorization
    const session = await auth()
    if (!session?.user || session.user.role !== 'admin') {
      return { success: false, error: 'Yetkisiz erişim' }
    }

    const page = options?.page || 1
    const limit = options?.limit || 20
    const skip = (page - 1) * limit

    // Build where clause
    const where = options?.status ? { status: options.status } : {}

    // Get total count
    const total = await prisma.report.count({ where })

    // Get reports with celebrity info
    const reports = await prisma.report.findMany({
      where,
      include: {
        celebrity: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    })

    return {
      success: true,
      data: reports as ReportWithCelebrity[],
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (error) {
    console.error('Get reports error:', error)
    return { success: false, error: 'Raporlar yüklenemedi' }
  }
}

/**
 * Deletes a report (Admin only)
 */
export async function deleteReport(id: string): Promise<ActionResponse> {
  try {
    // Check admin authorization
    const session = await auth()
    if (!session?.user || session.user.role !== 'admin') {
      return { success: false, message: 'Yetkisiz erişim' }
    }

    await prisma.report.delete({
      where: { id }
    })

    revalidatePath('/admin/reports')
    return { success: true, message: 'Rapor silindi' }
  } catch (error) {
    console.error('Delete report error:', error)
    return { success: false, message: 'Silme hatası' }
  }
}

/**
 * Gets report count by status for admin dashboard
 */
export async function getReportCounts(): Promise<{
  success: boolean
  data?: {
    pending: number
    inReview: number
    resolved: number
    rejected: number
    total: number
  }
  error?: string
}> {
  try {
    // Check admin authorization
    const session = await auth()
    if (!session?.user || session.user.role !== 'admin') {
      return { success: false, error: 'Yetkisiz erişim' }
    }

    const [pending, inReview, resolved, rejected, total] = await Promise.all([
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.report.count({ where: { status: 'IN_REVIEW' } }),
      prisma.report.count({ where: { status: 'RESOLVED' } }),
      prisma.report.count({ where: { status: 'REJECTED' } }),
      prisma.report.count()
    ])

    return {
      success: true,
      data: { pending, inReview, resolved, rejected, total }
    }
  } catch (error) {
    console.error('Get report counts error:', error)
    return { success: false, error: 'Sayılar yüklenemedi' }
  }
}
