import { prisma } from '@/shared/lib/prisma';
import { Prisma } from '@prisma/client';
import { CreateFlashcardInput } from '@/shared/types';

export const FlashcardService = {
  async createCard(input: CreateFlashcardInput) {
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

    const existingCard = await prisma.flashcard.findUnique({
      where: { dictionaryEntryId: entry.id }
    });

    if (existingCard) {
      throw new Error(`Kartu untuk kata "${input.word}" sudah ada.`);
    }

    const newCard = await prisma.flashcard.create({
      data: {
        dictionaryEntryId: entry.id,
        sourceType: input.sourceType,
        sourceContext: input.contextUsage,
        status: 'NEW',
        masteryLevel: 0,
        nextReviewDate: new Date()
      },
      include: { dictionaryEntry: true }
    });

    return newCard;
  },

  async getCards(onlyDue: boolean = false) {
    const whereClause: Prisma.FlashcardWhereInput = {};
    
    if (onlyDue) {
      whereClause.OR = [
        { nextReviewDate: { lte: new Date() } }, 
        { status: 'NEW' },
        { status: 'LEARNING' }
      ];
      whereClause.status = { not: 'MASTERED' };
    }

    const cards = await prisma.flashcard.findMany({
      where: whereClause,
      include: { dictionaryEntry: true },
      orderBy: { nextReviewDate: 'asc' }
    });

    return cards;
  },

  // --- REFACTORED: SIMPLIFIED MASTERY LOGIC ---
  async submitReview(id: string, isRemembered: boolean) {
    // Logic Baru: Sekali benar langsung MASTERED
    let newStatus = 'LEARNING';
    let newLevel = 0;
    const nextDate = new Date();

    if (isRemembered) {
      // Langsung Tamat
      newStatus = 'MASTERED';
      newLevel = 5; // Max level
      nextDate.setFullYear(nextDate.getFullYear() + 100); // Review lagi 100 tahun lagi (tidak akan muncul)
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