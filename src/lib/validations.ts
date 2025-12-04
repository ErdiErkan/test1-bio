export interface CelebrityFormData {
  name: string
  profession?: string
  birthDate?: string
  birthPlace?: string
  bio?: string
  image?: string
}

export interface ValidationError {
  field: string
  message: string
}

export function validateCelebrityForm(data: CelebrityFormData): ValidationError[] {
  const errors: ValidationError[] = []

  // İsim zorunlu
  if (!data.name || data.name.trim().length < 2) {
    errors.push({
      field: 'name',
      message: 'İsim en az 2 karakter olmalıdır'
    })
  }

  if (data.name && data.name.trim().length > 100) {
    errors.push({
      field: 'name',
      message: 'İsim 100 karakterden fazla olamaz'
    })
  }

  // Meslek kontrolü
  if (data.profession && data.profession.trim().length > 100) {
    errors.push({
      field: 'profession',
      message: 'Meslek 100 karakterden fazla olamaz'
    })
  }

  // Doğum tarihi kontrolü
  if (data.birthDate) {
    const date = new Date(data.birthDate)
    const now = new Date()

    if (date > now) {
      errors.push({
        field: 'birthDate',
        message: 'Doğum tarihi gelecekte olamaz'
      })
    }

    if (date.getFullYear() < 1800) {
      errors.push({
        field: 'birthDate',
        message: 'Geçerli bir doğum tarihi girin'
      })
    }
  }

  // Doğum yeri kontrolü
  if (data.birthPlace && data.birthPlace.trim().length > 100) {
    errors.push({
      field: 'birthPlace',
      message: 'Doğum yeri 100 karakterden fazla olamaz'
    })
  }

  // Biyografi kontrolü
  if (data.bio && data.bio.trim().length > 5000) {
    errors.push({
      field: 'bio',
      message: 'Biyografi 5000 karakterden fazla olamaz'
    })
  }

  // Resim URL kontrolü - DÜZELTİLEN KISIM
  if (data.image && data.image.trim()) {
    const imagePath = data.image.trim()
    
    // 1. Data URL (Base64) kontrolü (yeni yüklemeler için)
    const isDataUrl = imagePath.startsWith('data:')
    // 2. Relative path kontrolü (yerel dosyalar için)
    const isRelativePath = imagePath.startsWith('/')
    // 3. Absolute URL kontrolü (dış linkler için)
    let isAbsoluteUrl = false
    try {
      new URL(imagePath)
      isAbsoluteUrl = true
    } catch {
      isAbsoluteUrl = false
    }

    if (!isDataUrl && !isRelativePath && !isAbsoluteUrl) {
      errors.push({
        field: 'image',
        message: 'Geçerli bir resim URL\'i girin'
      })
    }
  }

  return errors
}