import { prisma } from '@/shared/lib/prisma';
import { Prisma } from '@prisma/client';
import { CreateFlashcardInput } from '@/shared/types';

export const FlashcardService = {
  /**
   * Membuat kartu baru. 
   * Jika kata belum ada di kamus, akan dibuatkan entry kamusnya dulu.
   */
  async createCard(input: CreateFlashcardInput) {
    // 1. Upsert Dictionary Entry untuk memastikan kata ada di database
    const entry = await prisma.dictionaryEntry.upsert({
      where: { word: input.word },
      update: {},
      create: {
        word: input.word,
        meaning: input.meaning,
        contextUsage: input.contextUsage || '-',
        nuanceComparison: 'Added via Flashcard',
        synonyms: [],
        isTypo: false,
      }
    });

    // 2. Cek apakah Flashcard untuk kata ini sudah aktif
    const existingCard = await prisma.flashcard.findUnique({
      where: { dictionaryEntryId: entry.id }
    });

    if (existingCard) {
      throw new Error(`Kartu untuk kata "${input.word}" sudah ada di koleksi.`);
    }

    // 3. Buat Flashcard baru
    const newCard = await prisma.flashcard.create({
      data: {
        dictionaryEntryId: entry.id,
        sourceType: input.sourceType,
        sourceContext: input.contextUsage,
        status: 'NEW',
        masteryLevel: 0,
        nextReviewDate: new Date() // Siap direview segera
      },
      include: { dictionaryEntry: true }
    });

    return newCard;
  },

  /**
   * Mengambil daftar kartu dengan sorting cerdas.
   * @param onlyDue Jika true, hanya ambil yang jadwalnya sudah tiba (untuk Quiz).
   */
  async getCards(onlyDue: boolean = false) {
    const whereClause: Prisma.FlashcardWhereInput = {};
    
    if (onlyDue) {
      // Logic untuk MODE REVIEW: Filter kartu yang jatuh tempo atau baru
      whereClause.OR = [
        { nextReviewDate: { lte: new Date() } }, 
        { status: 'NEW' },
        { status: 'LEARNING' }
      ];
      whereClause.status = { not: 'MASTERED' };
    }

    // 🔥 LOGIC SORTING (SOLUSI ITEM TERBARU MUNCUL DI AWAL) 🔥
    // Review Mode: Prioritas berdasarkan jadwal (asc).
    // Collection Mode: Prioritas berdasarkan yang baru dibuat (desc).
    const orderByClause: Prisma.FlashcardOrderByWithRelationInput = onlyDue 
      ? { nextReviewDate: 'asc' } 
      : { createdAt: 'desc' };

    const cards = await prisma.flashcard.findMany({
      where: whereClause,
      include: { dictionaryEntry: true },
      orderBy: orderByClause
    });

    return cards;
  },

  /**
   * Update status hafalan (Spaced Repetition System sederhana).
   */
  async submitReview(id: string, isRemembered: boolean) {
    let newStatus = 'LEARNING';
    let newLevel = 0;
    const nextDate = new Date();

    if (isRemembered) {
      // Simplifikasi: Sekali benar langsung MASTERED (Tamat)
      newStatus = 'MASTERED';
      newLevel = 5; 
      nextDate.setFullYear(nextDate.getFullYear() + 100); // Jadwal ulang 100 tahun lagi
    } else {
      // Salah -> Ulang besok
      newStatus = 'LEARNING';
      newLevel = 0;
      nextDate.setDate(nextDate.getDate() + 1); 
    }

    return await prisma.flashcard.update({
      where: { id },
      data: {
        masteryLevel: newLevel,
        status: newStatus,
        nextReviewDate: nextDate,
        lastReviewedAt: new Date()
      }
    });
  },

  async deleteCard(id: string) {
    return await prisma.flashcard.delete({ where: { id } });
  }
};