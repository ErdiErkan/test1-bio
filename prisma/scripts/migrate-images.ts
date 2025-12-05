/**
 * Migration Script: Migrate Celebrity.image to CelebrityImage table
 *
 * This script migrates existing image data from the deprecated `image` field
 * to the new `CelebrityImage` table with proper relations.
 *
 * Run after: npx prisma migrate dev
 * Execute with: npx ts-node prisma/migrations/migrate-images.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateImages() {
  console.log('🔄 Starting image migration...')

  try {
    // Get all celebrities with an image but no entries in CelebrityImage table
    const celebrities = await prisma.celebrity.findMany({
      where: {
        image: { not: null },
        images: { none: {} }
      },
      select: {
        id: true,
        name: true,
        image: true
      }
    })

    console.log(`📸 Found ${celebrities.length} celebrities with legacy images to migrate`)

    let successCount = 0
    let errorCount = 0

    for (const celebrity of celebrities) {
      if (!celebrity.image) continue

      try {
        await prisma.celebrityImage.create({
          data: {
            url: celebrity.image,
            isMain: true,
            displayOrder: 0,
            celebrityId: celebrity.id
          }
        })

        console.log(`✅ Migrated image for: ${celebrity.name}`)
        successCount++
      } catch (error) {
        console.error(`❌ Failed to migrate image for ${celebrity.name}:`, error)
        errorCount++
      }
    }

    console.log('\n📊 Migration Summary:')
    console.log(`   ✅ Success: ${successCount}`)
    console.log(`   ❌ Errors: ${errorCount}`)
    console.log(`   📸 Total processed: ${celebrities.length}`)

    console.log('\n🎉 Image migration completed!')
    console.log('\n💡 Note: The old `image` field is kept for backward compatibility.')
    console.log('   You can remove it in a future migration once all code is updated.')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

migrateImages()
  .catch((e) => {
    console.error('❌ Migration error:', e)
    process.exit(1)
  })
