// scripts/migrate-vocab.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Memulai migrasi data: Vocab -> DictionaryEntry...');

  // 1. Ambil semua data dari tabel lama
  const oldVocabs = await prisma.vocab.findMany();
  console.log(`📦 Ditemukan ${oldVocabs.length} kata legacy.`);

  let successCount = 0;
  let skipCount = 0;

  for (const vocab of oldVocabs) {
    try {
      // 2. Cek Duplikasi: Apakah kata ini sudah ada di kamus baru?
      // (Agar script ini aman dijalankan berkali-kali / idempoten)
      const existing = await prisma.dictionaryEntry.findFirst({
        where: { word: { equals: vocab.word, mode: 'insensitive' } }
      });

      if (existing) {
        process.stdout.write('.'); // Progress bar minimalis
        skipCount++;
        continue;
      }

      // 3. Transformasi & Simpan ke Tabel Baru
      await prisma.dictionaryEntry.create({
        data: {
          // Mapping Field Lama -> Baru
          word: vocab.word,
          meaning: vocab.translation,       // Translation lama jadi Meaning
          contextUsage: vocab.originalSentence || "-", // Sentence lama jadi Context
          
          // Default Value untuk Field Baru (Rich Data)
          nuanceComparison: "Migrated from legacy database.",
          synonyms: [], // Array kosong karena data lama tidak punya ini
          isTypo: false,
          isMisconception: false,
          errorAnalysis: null,
          
          // Tagging Khusus (Penting untuk audit data)
          category: "Legacy", 
          literalMeaning: null,
          figurativeMeaning: null,

          // Pertahankan Timestamp Asli (Agar urutan history tidak berantakan)
          createdAt: vocab.createdAt, 
        }
      });

      process.stdout.write('+'); // Tanda sukses
      successCount++;

    } catch (error) {
      console.error(`\n❌ Gagal migrasi "${vocab.word}":`, error);
    }
  }

  console.log('\n\n=============================================');
  console.log(`🎉 Migrasi Selesai!`);
  console.log(`✅ Berhasil dipindahkan: ${successCount}`);
  console.log(`⚠️  Dilewati (Sudah ada): ${skipCount}`);
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