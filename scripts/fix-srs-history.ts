import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🛠️  Memulai perbaikan data SRS (Migrasi ke One-Shot Mastery)...');

  // 1. Cari kartu yang "Nyangkut" (Level > 0 tapi belum MASTERED)
  const stuckCards = await prisma.flashcard.findMany({
    where: {
      masteryLevel: { gt: 0 }, // Pernah benar minimal sekali
      status: { not: 'MASTERED' } // Tapi belum dianggap tamat
    },
    include: { dictionaryEntry: true }
  });

  console.log(`📦 Ditemukan ${stuckCards.length} kartu yang perlu di-update.`);

  // 2. Update massal
  if (stuckCards.length > 0) {
    const result = await prisma.flashcard.updateMany({
      where: {
        masteryLevel: { gt: 0 },
        status: { not: 'MASTERED' }
      },
      data: {
        status: 'MASTERED',
        masteryLevel: 5, // Mentokkan levelnya
        nextReviewDate: new Date('2100-01-01') // Jadwalkan jauh di masa depan
      }
    });

    console.log(`✅ Berhasil mengupdate ${result.count} kartu menjadi MASTERED.`);
    
    // Log detail (Opsional)
    stuckCards.forEach(c => {
      console.log(`   - [FIXED] ${c.dictionaryEntry?.word}`);
    });
  } else {
    console.log('✨ Tidak ada data yang perlu diperbaiki.');
  }

  console.log('🎉 Selesai!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });