import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function calculateZodiac(birthDate: Date): string | null {
  const date = new Date(birthDate)
  const month = date.getMonth() + 1
  const day = date.getDate()

  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'aquarius'
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 'pisces'
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'aries'
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'taurus'
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'gemini'
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'cancer'
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'leo'
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'virgo'
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'libra'
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'scorpio'
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'sagittarius'
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'capricorn'

  return null
}

async function main() {
  console.log('🔄 Burç bilgileri taranıyor...')

  // Tüm ünlüleri getir
  const celebrities = await prisma.celebrity.findMany()
  
  console.log(`📊 Toplam ${celebrities.length} kayıt bulundu.`)

  let updatedCount = 0
  let skippedCount = 0

  for (const celebrity of celebrities) {
    if (celebrity.birthDate) {
      const zodiac = calculateZodiac(celebrity.birthDate)
      
      if (zodiac) {
        // Sadece burcu boş olanları veya yanlış olanları güncelle
        if (celebrity.zodiac !== zodiac) {
          await prisma.celebrity.update({
            where: { id: celebrity.id },
            data: { zodiac }
          })
          console.log(`✅ ${celebrity.name}: ${zodiac} olarak güncellendi.`)
          updatedCount++
        } else {
          // Zaten doğruysa atla
          skippedCount++
        }
      }
    } else {
      console.log(`⚠️ ${celebrity.name}: Doğum tarihi yok, atlandı.`)
      skippedCount++
    }
  }

  console.log(`\n🎉 İşlem tamamlandı!`)
  console.log(`- Güncellenen: ${updatedCount}`)
  console.log(`- Atlanan/Güncel: ${skippedCount}`)
}

main()
  .catch((e) => {
    console.error('❌ Bir hata oluştu:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })