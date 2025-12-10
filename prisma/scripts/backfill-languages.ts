import { PrismaClient, Language } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting backfill of publishedLanguages...');

  // Fetch all celebrities with their translations
  const celebrities = await prisma.celebrity.findMany({
    select: {
      id: true,
      translations: {
        select: {
          language: true,
        },
      },
      publishedLanguages: true, // check current state
    },
  });

  console.log(`Found ${celebrities.length} celebrities.`);

  let updatedCount = 0;

  for (const celebrity of celebrities) {
    const existingLangs = new Set(celebrity.publishedLanguages);

    // Extract languages from translations
    const translationLangs = celebrity.translations.map((t) => t.language);

    // Default to EN if no translations (safety net, though likely rare if created properly)
    const finalLangs = translationLangs.length > 0 ? translationLangs : [Language.EN];

    // Convert to string array for storage
    const newPublishedLanguages = finalLangs.map(l => l.toString());

    // Check if update is needed (simple length + content check)
    const needsUpdate =
        newPublishedLanguages.length !== existingLangs.size ||
        !newPublishedLanguages.every(l => existingLangs.has(l));

    if (needsUpdate || celebrity.publishedLanguages.length === 0) {
        await prisma.celebrity.update({
            where: { id: celebrity.id },
            data: {
                publishedLanguages: newPublishedLanguages
            }
        });
        updatedCount++;
    }
  }

  console.log(`Backfill complete. Updated ${updatedCount} celebrities.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
