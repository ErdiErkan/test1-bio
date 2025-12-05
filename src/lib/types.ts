// Category type
export interface Category {
  id: string
  name: string
  slug: string
  description?: string | null
  createdAt: Date
  updatedAt: Date
}

// Social Platform type - mirrors Prisma enum
export type SocialPlatform =
  | 'INSTAGRAM'
  | 'TWITTER'
  | 'YOUTUBE'
  | 'TIKTOK'
  | 'FACEBOOK'
  | 'LINKEDIN'
  | 'WEBSITE'
  | 'IMDB'
  | 'SPOTIFY'

// Social Media Link type
export interface SocialMediaLink {
  id: string
  platform: SocialPlatform
  url: string
  displayOrder: number
  celebrityId: string
  createdAt: Date
  updatedAt: Date
}

// Social Media Link Input for form submissions
export interface SocialMediaLinkInput {
  platform: SocialPlatform
  url: string
  displayOrder?: number
}

// Celebrity Image type (multi-image carousel support)
export interface CelebrityImage {
  id: string
  url: string
  isMain: boolean
  displayOrder: number
  celebrityId: string
  createdAt: Date
  updatedAt: Date
}

// Celebrity Image Input for form submissions
export interface CelebrityImageInput {
  url: string
  isMain?: boolean
  displayOrder?: number
}

// FAQ type for SEO-optimized FAQ section
export interface FAQ {
  id: string
  question: string
  answer: string
  displayOrder: number
  celebrityId: string
  createdAt: Date
  updatedAt: Date
}

// FAQ Input for form submissions
export interface FAQInput {
  question: string
  answer: string
  displayOrder?: number
}

// Core Celebrity type from Prisma
export interface Celebrity {
  id: string
  name: string
  nickname?: string | null
  profession?: string | null
  birthDate?: Date | null
  birthPlace?: string | null
  nationality?: string | null
  bio?: string | null
  image?: string | null // @deprecated - Use images array instead
  slug: string
  zodiac?: string | null
  createdAt: Date
  updatedAt: Date
  categories?: Category[]
  images?: CelebrityImage[]
  faqs?: FAQ[]
  socialMediaLinks?: SocialMediaLink[]
}

// Form data type for create/update operations
export interface CelebrityFormData {
  name: string
  nickname?: string
  profession?: string
  birthDate?: string
  birthPlace?: string
  nationality?: string
  bio?: string
  image?: string // @deprecated - Use images array instead
  categoryIds?: string[]
  socialLinks?: SocialMediaLinkInput[]
  images?: CelebrityImageInput[]
  faqs?: FAQInput[]
}

// Admin search filter types for advanced filtering
export type DataQualityFilter =
  | 'no_bio'
  | 'no_image'
  | 'has_pending_reports'
  | 'no_faqs'

export interface AdminSearchParams {
  query?: string
  category?: string
  nationality?: string
  dataQuality?: DataQualityFilter
  page?: number
  limit?: number
}

// API Response types for better type safety
export interface CelebritiesResponse {
  celebrities: Celebrity[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface ApiErrorResponse {
  error: string
  details?: string
}

// Validation error type
export interface ValidationError {
  field: string
  message: string
}

// Search parameters type
export interface SearchParams {
  search?: string
  page?: number
  limit?: number
}

// Report Status type - mirrors Prisma enum
export type ReportStatus = 'PENDING' | 'IN_REVIEW' | 'RESOLVED' | 'REJECTED'

// Report Type type - mirrors Prisma enum
export type ReportType = 'WRONG_INFO' | 'TYPO' | 'IMAGE_ISSUE' | 'OTHER'

// Report type
export interface Report {
  id: string
  celebrityId: string
  celebrity?: Celebrity
  type: ReportType
  message: string
  contactEmail?: string | null
  status: ReportStatus
  ipAddress?: string | null
  createdAt: Date
  updatedAt: Date
}

// Report form input type
export interface ReportFormData {
  celebrityId: string
  type: ReportType
  message: string
  contactEmail?: string
}

// Report with celebrity name for admin panel
export interface ReportWithCelebrity extends Omit<Report, 'celebrity'> {
  celebrity: {
    id: string
    name: string
    slug: string
  }
}

// Action response type
export interface ActionResponse {
  success: boolean
  message: string
  data?: unknown
}
