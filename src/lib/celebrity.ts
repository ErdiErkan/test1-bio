export interface Celebrity {
  id: string
  name: string
  profession?: string | null
  birthDate?: Date | string | null
  birthPlace?: string | null
  bio?: string | null
  image?: string | null
  slug: string
  createdAt: Date | string
  updatedAt: Date | string
}

export function calculateAge(birthDate: string | Date): number | null {
  if (!birthDate) return null

  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }

  return age
}

export function formatDateTurkish(dateString: string | Date): string {
  return new Date(dateString).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export function getFullName(celebrity: Celebrity): string {
  return celebrity.name
}

export function getCelebrityTitle(celebrity: Celebrity): string {
  if (celebrity.profession) {
    return `${celebrity.name} - ${celebrity.profession}`
  }
  return celebrity.name
}

export function getCelebrityDescription(celebrity: Celebrity, maxLength: number = 160): string {
  if (celebrity.bio) {
    return truncateText(celebrity.bio, maxLength)
  }

  const parts: string[] = []
  if (celebrity.profession) parts.push(celebrity.profession)
  if (celebrity.birthPlace) parts.push(celebrity.birthPlace)

  if (parts.length > 0) {
    return `${celebrity.name} hakkında bilgi edinin. ${parts.join(', ')}.`
  }

  return `${celebrity.name} hakkında bilgi edinin.`
}
