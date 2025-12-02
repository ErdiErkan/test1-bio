// Category type
export interface Category {
  id: string
  name: string
  slug: string
  description?: string | null
  createdAt: Date
  updatedAt: Date
}

// Core Celebrity type from Prisma
export interface Celebrity {
  id: string
  name: string
  profession?: string | null
  birthDate?: Date | null
  birthPlace?: string | null
  bio?: string | null
  image?: string | null
  slug: string
  createdAt: Date
  updatedAt: Date
  categories?: Category[]
}

// Form data type for create/update operations
export interface CelebrityFormData {
  name: string
  profession?: string
  birthDate?: string
  birthPlace?: string
  bio?: string
  image?: string
  categoryIds?: string[]
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
