import { prisma } from '@/shared/lib/prisma';
import { dictionaryEntrySchema, type CreateDictionaryInput } from '@/shared/lib/validators';

export const DictionaryService = {
  /**
   * Menyimpan entry baru ke kamus (DictionaryEntry).
   * Validasi dilakukan via Zod sebelum masuk DB.
   */
  async saveEntry(rawInput: CreateDictionaryInput) {
    // 1. Validasi Input (Runtime Check)
    const payload = dictionaryEntrySchema.parse(rawInput);

    // 2. Cek Duplikasi (Opsional: Update jika ada, atau Reject)
    // Di sini kita pilih strategi: Reject jika word sudah ada (seperti test case)
    const existing = await prisma.dictionaryEntry.findFirst({
      where: { word: { equals: payload.word, mode: 'insensitive' } }
    });

    if (existing) {
      throw new Error(`Kata "${payload.word}" sudah ada di kamus.`);
    }

    // 3. Simpan ke Database
    return await prisma.dictionaryEntry.create({
      data: payload
    });
  },

  /**
   * Mengambil daftar kata (support pagination/filtering nanti)
   */
  async getEntries(limit = 20) {
    return await prisma.dictionaryEntry.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  },

  /**
   * Menghapus kata berdasarkan ID
   */
  async deleteEntry(id: string) {
    return await prisma.dictionaryEntry.delete({
      where: { id }
    });
  },
  
  /**
   * Update status typo/misconception atau data lainnya
   */
  async updateEntry(id: string, data: Partial<CreateDictionaryInput>) {
    return await prisma.dictionaryEntry.update({
      where: { id },
      data
    });
  }
};