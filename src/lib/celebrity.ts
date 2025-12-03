export interface Celebrity {
  id: string
  name: string
  nickname?: string | null
  profession?: string | null
  birthDate?: Date | string | null
  birthPlace?: string | null
  nationality?: string | null
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

// ============================================
// Zodiac (Burç) Hesaplama
// ============================================
export type ZodiacSign =
  | 'aries' | 'taurus' | 'gemini' | 'cancer'
  | 'leo' | 'virgo' | 'libra' | 'scorpio'
  | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces'

export interface ZodiacInfo {
  sign: ZodiacSign
  nameTR: string
  symbol: string
  dateRange: string
}

export function calculateZodiac(birthDate: string | Date | null | undefined): ZodiacInfo | null {
  if (!birthDate) return null

  const date = new Date(birthDate)
  const month = date.getMonth() + 1
  const day = date.getDate()

  const zodiacSigns: ZodiacInfo[] = [
    { sign: 'capricorn', nameTR: 'Oğlak', symbol: '♑', dateRange: '22 Aralık - 19 Ocak' },
    { sign: 'aquarius', nameTR: 'Kova', symbol: '♒', dateRange: '20 Ocak - 18 Şubat' },
    { sign: 'pisces', nameTR: 'Balık', symbol: '♓', dateRange: '19 Şubat - 20 Mart' },
    { sign: 'aries', nameTR: 'Koç', symbol: '♈', dateRange: '21 Mart - 19 Nisan' },
    { sign: 'taurus', nameTR: 'Boğa', symbol: '♉', dateRange: '20 Nisan - 20 Mayıs' },
    { sign: 'gemini', nameTR: 'İkizler', symbol: '♊', dateRange: '21 Mayıs - 20 Haziran' },
    { sign: 'cancer', nameTR: 'Yengeç', symbol: '♋', dateRange: '21 Haziran - 22 Temmuz' },
    { sign: 'leo', nameTR: 'Aslan', symbol: '♌', dateRange: '23 Temmuz - 22 Ağustos' },
    { sign: 'virgo', nameTR: 'Başak', symbol: '♍', dateRange: '23 Ağustos - 22 Eylül' },
    { sign: 'libra', nameTR: 'Terazi', symbol: '♎', dateRange: '23 Eylül - 22 Ekim' },
    { sign: 'scorpio', nameTR: 'Akrep', symbol: '♏', dateRange: '23 Ekim - 21 Kasım' },
    { sign: 'sagittarius', nameTR: 'Yay', symbol: '♐', dateRange: '22 Kasım - 21 Aralık' },
  ]

  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return zodiacSigns[1] // Aquarius
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return zodiacSigns[2] // Pisces
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return zodiacSigns[3] // Aries
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return zodiacSigns[4] // Taurus
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return zodiacSigns[5] // Gemini
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return zodiacSigns[6] // Cancer
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return zodiacSigns[7] // Leo
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return zodiacSigns[8] // Virgo
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return zodiacSigns[9] // Libra
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return zodiacSigns[10] // Scorpio
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return zodiacSigns[11] // Sagittarius
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return zodiacSigns[0] // Capricorn

  return null
}

// ============================================
// Ülke (Nationality) Yardımcıları
// ============================================
export interface CountryInfo {
  code: string
  name: string
  flag: string
}

const COUNTRIES: Record<string, CountryInfo> = {
  TR: { code: 'TR', name: 'Türkiye', flag: '🇹🇷' },
  US: { code: 'US', name: 'Amerika Birleşik Devletleri', flag: '🇺🇸' },
  GB: { code: 'GB', name: 'Birleşik Krallık', flag: '🇬🇧' },
  DE: { code: 'DE', name: 'Almanya', flag: '🇩🇪' },
  FR: { code: 'FR', name: 'Fransa', flag: '🇫🇷' },
  IT: { code: 'IT', name: 'İtalya', flag: '🇮🇹' },
  ES: { code: 'ES', name: 'İspanya', flag: '🇪🇸' },
  RU: { code: 'RU', name: 'Rusya', flag: '🇷🇺' },
  JP: { code: 'JP', name: 'Japonya', flag: '🇯🇵' },
  CN: { code: 'CN', name: 'Çin', flag: '🇨🇳' },
  IN: { code: 'IN', name: 'Hindistan', flag: '🇮🇳' },
  BR: { code: 'BR', name: 'Brezilya', flag: '🇧🇷' },
  CA: { code: 'CA', name: 'Kanada', flag: '🇨🇦' },
  AU: { code: 'AU', name: 'Avustralya', flag: '🇦🇺' },
  MX: { code: 'MX', name: 'Meksika', flag: '🇲🇽' },
  AR: { code: 'AR', name: 'Arjantin', flag: '🇦🇷' },
  KR: { code: 'KR', name: 'Güney Kore', flag: '🇰🇷' },
  NL: { code: 'NL', name: 'Hollanda', flag: '🇳🇱' },
  SE: { code: 'SE', name: 'İsveç', flag: '🇸🇪' },
  NO: { code: 'NO', name: 'Norveç', flag: '🇳🇴' },
  DK: { code: 'DK', name: 'Danimarka', flag: '🇩🇰' },
  FI: { code: 'FI', name: 'Finlandiya', flag: '🇫🇮' },
  PL: { code: 'PL', name: 'Polonya', flag: '🇵🇱' },
  GR: { code: 'GR', name: 'Yunanistan', flag: '🇬🇷' },
  PT: { code: 'PT', name: 'Portekiz', flag: '🇵🇹' },
  IE: { code: 'IE', name: 'İrlanda', flag: '🇮🇪' },
  AT: { code: 'AT', name: 'Avusturya', flag: '🇦🇹' },
  CH: { code: 'CH', name: 'İsviçre', flag: '🇨🇭' },
  BE: { code: 'BE', name: 'Belçika', flag: '🇧🇪' },
  AE: { code: 'AE', name: 'Birleşik Arap Emirlikleri', flag: '🇦🇪' },
  SA: { code: 'SA', name: 'Suudi Arabistan', flag: '🇸🇦' },
  EG: { code: 'EG', name: 'Mısır', flag: '🇪🇬' },
  ZA: { code: 'ZA', name: 'Güney Afrika', flag: '🇿🇦' },
  NG: { code: 'NG', name: 'Nijerya', flag: '🇳🇬' },
}

export function getCountryInfo(countryCode: string | null | undefined): CountryInfo | null {
  if (!countryCode) return null
  return COUNTRIES[countryCode.toUpperCase()] || null
}

export function getAllCountries(): CountryInfo[] {
  return Object.values(COUNTRIES).sort((a, b) => a.name.localeCompare(b.name, 'tr'))
}

export function getDisplayName(celebrity: Celebrity): string {
  if (celebrity.nickname) {
    return `${celebrity.name} (${celebrity.nickname})`
  }
  return celebrity.name
}