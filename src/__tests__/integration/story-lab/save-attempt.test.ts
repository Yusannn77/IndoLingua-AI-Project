import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '@/shared/lib/prisma';
import { assertTestDatabase } from '../../helpers/db-guard';
import { StoryAttemptFactory } from '../../helpers/factories';

describe('Story Lab: Persistence Layer (Database Only)', () => {
  
  // --- KATEGORI A: SAFETY ---
  beforeAll(async () => {
    await assertTestDatabase(); // 🛡️ Guard aktif
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // --- KATEGORI B: ISOLASI ---
  // Kita tidak menggunakan global sharedId lagi. Setiap test independent.

  describe('Priority 1: Core CRUD Operations', () => {
    it('CREATE: Should persist data correctly', async () => {
      // 1. Arrange: Siapkan data unik dari factory
      const payload = StoryAttemptFactory.build({ score: 88 });

      // 2. Act: Simpan
      const attempt = await prisma.storyAttempt.create({ data: payload });

      // 3. Assert: Cek apakah data yang KEMBALI sama dengan yang DIKIRIM
      expect(attempt.id).toBeDefined();
      expect(attempt.score).toBe(88);
      // Ini menjawab keraguan Anda: Kita memvalidasi string input vs output DB
      expect(attempt.userTranslation).toBe(payload.userTranslation); 
      
      // 4. Cleanup
      await prisma.storyAttempt.delete({ where: { id: attempt.id } });
    });

    it('UPDATE: Should update score without corrupting text', async () => {
      const created = await prisma.storyAttempt.create({ 
        data: StoryAttemptFactory.build() 
      });

      const updated = await prisma.storyAttempt.update({
        where: { id: created.id },
        data: { score: 100, aiFeedback: 'UPDATED_FEEDBACK' }
      });

      expect(updated.score).toBe(100);
      expect(updated.aiFeedback).toBe('UPDATED_FEEDBACK');
      // Pastikan field lain TIDAK berubah
      expect(updated.englishText).toBe(created.englishText);

      await prisma.storyAttempt.delete({ where: { id: created.id } });
    });

    it('DELETE: Should physically remove record', async () => {
      const created = await prisma.storyAttempt.create({ data: StoryAttemptFactory.build() });
      
      await prisma.storyAttempt.delete({ where: { id: created.id } });

      const check = await prisma.storyAttempt.findUnique({ where: { id: created.id } });
      expect(check).toBeNull();
    });
  });

  describe('Priority 2: Edge Cases & Validation', () => {
    it('BOUNDARY: Should handle very long text (Text type check)', async () => {
      const payload = StoryAttemptFactory.buildLongText(5000); // 5000 chars
      const attempt = await prisma.storyAttempt.create({ data: payload });

      expect(attempt.userTranslation.length).toBe(5000);
      await prisma.storyAttempt.delete({ where: { id: attempt.id } });
    });

    it('INTEGRITY: Should accept negative scores (Database Constraint Check)', async () => {
      // Kita cek apakah DB menolak atau menerima (sesuai schema Int)
      const payload = StoryAttemptFactory.build({ score: -10 });
      const attempt = await prisma.storyAttempt.create({ data: payload });
      expect(attempt.score).toBe(-10);
      await prisma.storyAttempt.delete({ where: { id: attempt.id } });
    });
  });

  describe('Priority 3: Advanced Scenarios', () => {
    it('TRANSACTION: Should Rollback all if one fails', async () => {
      const countBefore = await prisma.storyAttempt.count();

      // Kita coba simpan data valid, lalu paksa error di langkah kedua
      await expect(
        prisma.$transaction(async (tx) => {
          await tx.storyAttempt.create({ data: StoryAttemptFactory.build() });
          throw new Error('Simulated Failure'); // Pemicu Rollback
        })
      ).rejects.toThrow('Simulated Failure');

      const countAfter = await prisma.storyAttempt.count();
      // Assert: Jumlah data TIDAK boleh bertambah karena rollback
      expect(countAfter).toBe(countBefore);
    });

    it('CONCURRENCY: Should handle multiple writes simultaneously', async () => {
      const batchSize = 5;
      const tasks = Array.from({ length: batchSize }).map(() => 
        prisma.storyAttempt.create({ data: StoryAttemptFactory.build() })
      );

      const results = await Promise.allSettled(tasks);
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      
      expect(successCount).toBe(batchSize);
      
      // Cleanup batch
      const ids = results
        .map(r => (r.status === 'fulfilled' ? r.value.id : null))
        .filter(Boolean) as string[];
      
      await prisma.storyAttempt.deleteMany({ where: { id: { in: ids } } });
    });
  });
});