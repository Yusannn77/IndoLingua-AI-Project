import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Memulai Backfill Data: DictionaryEntry -> Flashcard...');

  // 1. Ambil semua DictionaryEntry, sertakan relasi flashcard untuk pengecekan
  const allEntries = await prisma.dictionaryEntry.findMany({
    include: {
      flashcard: true
    }
  });

  console.log(`📦 Total Dictionary Entries: ${allEntries.length}`);

  let createdCount = 0;
  let skippedCount = 0;

  for (const entry of allEntries) {
    // 2. Cek apakah sudah punya flashcard
    if (entry.flashcard) {
      skippedCount++;
      continue;
    }

    // 3. Jika belum, buatkan Flashcard baru
    try {
      await prisma.flashcard.create({
        data: {
          dictionaryEntryId: entry.id,
          sourceContext: entry.contextUsage, // Gunakan konteks yang ada di kamus
          sourceType: 'MIGRATION', // Label khusus
          status: 'NEW',
          masteryLevel: 0,
          nextReviewDate: new Date() // Langsung siap di-review
        }
      });
      process.stdout.write('+'); // Feedback visual
      createdCount++;
    } catch (error) {
      console.error(`\n❌ Gagal membuat kartu untuk "${entry.word}":`, error);
    }
  }

  console.log('\n\n=============================================');
  console.log(`🎉 Migrasi Selesai!`);
  console.log(`✅ Kartu Baru Dibuat: ${createdCount}`);
  console.log(`⏩ Dilewati (Sudah Ada): ${skippedCount}`);
  console.log('=============================================\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });