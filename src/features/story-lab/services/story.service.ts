import { prisma } from '@/shared/lib/prisma';
import { storyAttemptSchema, type CreateStoryAttemptInput } from '@/shared/lib/validators';

export const StoryService = {
  /**
   * Menyimpan log pengerjaan cerita (StoryAttempt).
   * Data ini TERPISAH dari kamus utama.
   */
  async logAttempt(rawInput: CreateStoryAttemptInput) {
    // 1. Validasi
    const payload = storyAttemptSchema.parse(rawInput);

    // 2. Simpan Log
    return await prisma.storyAttempt.create({
      data: payload
    });
  },

  /**
   * Mengambil riwayat latihan cerita user
   */
  async getHistory(limit = 10) {
    return await prisma.storyAttempt.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  },

  /**
   * Mendapatkan statistik rata-rata skor
   */
  async getAverageScore() {
    const agg = await prisma.storyAttempt.aggregate({
      _avg: { score: true },
      _count: { score: true }
    });
    
    return {
      average: agg._avg.score ? Math.round(agg._avg.score) : 0,
      totalAttempts: agg._count.score
    };
  }
};