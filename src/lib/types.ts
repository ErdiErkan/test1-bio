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
  image?: string | null
  slug: string
  zodiac?: string | null
  createdAt: Date
  updatedAt: Date
  categories?: Category[]
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
  image?: string
  categoryIds?: string[]
  socialLinks?: SocialMediaLinkInput[]
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
