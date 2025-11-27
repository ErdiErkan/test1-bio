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
}

export interface CelebrityFormData {
  name: string
  profession?: string
  birthDate?: string
  birthPlace?: string
  bio?: string
  image?: string
}
