import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Password hashing with bcrypt
async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10)
}

// Slug oluşturma fonksiyonu
function createSlug(text: string): string {
  const turkishMap: Record<string, string> = {
    'ç': 'c', 'Ç': 'C',
    'ğ': 'g', 'Ğ': 'G',
    'ı': 'i', 'I': 'I',
    'İ': 'I',
    'ö': 'o', 'Ö': 'O',
    'ş': 's', 'Ş': 'S',
    'ü': 'u', 'Ü': 'U',
  }

  return text
    .split('')
    .map(char => turkishMap[char] || char)
    .join('')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function main() {
  console.log('🌱 Seeding database...')

  // ============================================
  // 1. Varsayılan Admin Kullanıcı
  // ============================================
  console.log('👤 Creating admin user...')

  const adminEmail = 'admin@celebhub.com'
  const adminPassword = 'Admin123!' // PRODUCTION'da mutlaka değiştirilmeli!

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  })

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: await hashPassword(adminPassword),
        name: 'Admin User',
        role: 'admin'
      }
    })
    console.log(`✅ Admin created: ${adminEmail} / ${adminPassword}`)
  } else {
    console.log('ℹ️  Admin user already exists')
  }

  // ============================================
  // 2. Varsayılan Kategoriler
  // ============================================
  console.log('📁 Creating categories...')

  const categories = [
    { name: 'Oyuncu', description: 'Sinema ve dizi oyuncuları' },
    { name: 'Müzisyen', description: 'Şarkıcılar ve müzik sanatçıları' },
    { name: 'Yönetmen', description: 'Film ve dizi yönetmenleri' },
    { name: 'Sporcu', description: 'Profesyonel sporcular' },
    { name: 'İnfluencer', description: 'Sosyal medya fenomenleri' },
    { name: 'Yazar', description: 'Kitap yazarları' },
    { name: 'Sanatçı', description: 'Ressamlar ve heykeltıraşlar' },
    { name: 'Komedyen', description: 'Stand-up ve komedi sanatçıları' },
  ]

  for (const category of categories) {
    const slug = createSlug(category.name)

    const existing = await prisma.category.findUnique({
      where: { slug }
    })

    if (!existing) {
      await prisma.category.create({
        data: {
          name: category.name,
          slug,
          description: category.description
        }
      })
      console.log(`✅ Category created: ${category.name}`)
    } else {
      console.log(`ℹ️  Category already exists: ${category.name}`)
    }
  }

  // ============================================
  // 3. Örnek Ünlü (opsiyonel - test için)
  // ============================================
  console.log('🌟 Creating sample celebrities...')

  const oyuncuCategory = await prisma.category.findUnique({
    where: { slug: 'oyuncu' }
  })

  const muzisyenCategory = await prisma.category.findUnique({
    where: { slug: 'muzisyen' }
  })

  if (oyuncuCategory) {
    const kemalSlug = createSlug('Kemal Sunal')
    const existingKemal = await prisma.celebrity.findUnique({
      where: { slug: kemalSlug }
    })

    if (!existingKemal) {
      await prisma.celebrity.create({
        data: {
          name: 'Kemal Sunal',
          slug: kemalSlug,
          profession: 'Oyuncu, Komedyen',
          birthDate: new Date('1944-11-11'),
          birthPlace: 'İstanbul, Türkiye',
          bio: 'Türk sinema tarihinin en sevilen oyuncularından biri olan Kemal Sunal, özellikle komedi filmleriyle tanınmıştır.',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Kemal_Sunal.jpg/400px-Kemal_Sunal.jpg',
          categories: {
            connect: [{ id: oyuncuCategory.id }]
          }
        }
      })
      console.log('✅ Sample celebrity created: Kemal Sunal')
    }
  }

  if (muzisyenCategory) {
    const barisSlug = createSlug('Barış Manço')
    const existingBaris = await prisma.celebrity.findUnique({
      where: { slug: barisSlug }
    })

    if (!existingBaris) {
      await prisma.celebrity.create({
        data: {
          name: 'Barış Manço',
          slug: barisSlug,
          profession: 'Müzisyen, Şarkıcı',
          birthDate: new Date('1943-01-02'),
          birthPlace: 'İstanbul, Türkiye',
          bio: 'Türk rock müziğinin öncülerinden olan Barış Manço, televizyon programcılığı da yapmıştır.',
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Bar%C4%B1%C5%9F_Man%C3%A7o_1988.jpg/400px-Bar%C4%B1%C5%9F_Man%C3%A7o_1988.jpg',
          categories: {
            connect: [{ id: muzisyenCategory.id }]
          }
        }
      })
      console.log('✅ Sample celebrity created: Barış Manço')
    }
  }

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
