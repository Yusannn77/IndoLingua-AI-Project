// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
// Kita pakai relative path karena ts-node kadang bingung dengan alias @
import { storyCollection } from '../src/data/storyData'
import { beginnerQuestions, intermediateQuestions } from '../src/data/grammarQuestions'
import { dailyChallenges } from '../src/data/dailyChallenges'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Start Seeding...')

  // 1. SEED STORIES
  // Hapus data lama biar tidak duplikat kalau dijalankan 2x
  await prisma.story.deleteMany() 
  console.log(`Processing ${storyCollection.length} stories...`)
  
  for (const story of storyCollection) {
    await prisma.story.create({
      data: {
        english: story.english,
        source: story.source,
      }
    })
  }

  // 2. SEED GRAMMAR
  await prisma.grammarQuestion.deleteMany()
  console.log('Processing Grammar Questions...')

  const allGrammar = [
    ...beginnerQuestions.map(q => ({ ...q, level: 'beginner' })),
    ...intermediateQuestions.map(q => ({ ...q, level: 'intermediate' }))
  ]

  for (const q of allGrammar) {
    await prisma.grammarQuestion.create({
      data: {
        // Kita pakai ID dari data lama biar konsisten, atau biarkan auto-cuid
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        difficulty: q.level // Pastikan di schema.prisma kolomnya 'difficulty'
      }
    })
  }

  // 3. SEED DAILY CHALLENGE (Optional, jika mau dijadikan bank soal)
  // Karena di schema tadi belum ada tabel khusus challenge bank, kita skip dulu atau 
  // kamu bisa tambahkan model 'ChallengeBank' di schema.prisma nanti.

  console.log('✅ Seeding Selesai! Database sudah terisi.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })