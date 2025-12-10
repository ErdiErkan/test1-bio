import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Password hashing with bcrypt
async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10)
}

async function main() {
  console.log('🌱 Seeding database (admin user only)...')

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
