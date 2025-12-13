import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/shared/lib/prisma';
import { assertTestDatabase } from '../../helpers/db-guard';
import { DictionaryEntryFactory } from '../../helpers/factories';

describe('Dictionary Feature: Persistence Layer (TDD)', () => {
  
  // SAFETY: Pastikan hanya berjalan di Database Test
  beforeAll(async () => {
    await assertTestDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // --- SUITE 1: CRUD OPERATIONS ---
  describe('Core CRUD Operations', () => {
    
    it('CREATE: Should persist a complete entry with Arrays and Flags', async () => {
      // Arrange
      const payload = DictionaryEntryFactory.build({ 
        word: "UniqueWord", 
        synonyms: ["SynA", "SynB"] 
      });

      // Act
      const entry = await prisma.dictionaryEntry.create({ data: payload });

      // Assert
      expect(entry.id).toBeDefined();
      expect(entry.word).toBe("UniqueWord");
      expect(entry.synonyms).toHaveLength(2);
      expect(entry.synonyms).toContain("SynA");
      expect(entry.isTypo).toBe(false);

      // Cleanup
      await prisma.dictionaryEntry.delete({ where: { id: entry.id } });
    });

    it('READ: Should retrieve data exactly as it was saved', async () => {
      const payload = DictionaryEntryFactory.build();
      const created = await prisma.dictionaryEntry.create({ data: payload });

      const fetched = await prisma.dictionaryEntry.findUnique({
        where: { id: created.id }
      });

      expect(fetched).not.toBeNull();
      expect(fetched?.word).toBe(payload.word);
      // Validasi integritas Array PostgreSQL
      expect(fetched?.synonyms).toEqual(payload.synonyms);

      await prisma.dictionaryEntry.delete({ where: { id: created.id } });
    });

    it('UPDATE: Should update specific fields without data loss', async () => {
      const created = await prisma.dictionaryEntry.create({ 
        data: DictionaryEntryFactory.build({ meaning: "Old Meaning" }) 
      });

      const updated = await prisma.dictionaryEntry.update({
        where: { id: created.id },
        data: {
          meaning: "New Meaning",
          synonyms: ["UpdatedSyn"]
        }
      });

      expect(updated.meaning).toBe("New Meaning");
      expect(updated.synonyms).toEqual(["UpdatedSyn"]);
      // Pastikan field lain tidak berubah
      expect(updated.word).toBe(created.word);

      await prisma.dictionaryEntry.delete({ where: { id: created.id } });
    });

    it('DELETE: Should remove entry permanently', async () => {
      const created = await prisma.dictionaryEntry.create({ 
        data: DictionaryEntryFactory.build() 
      });

      await prisma.dictionaryEntry.delete({ where: { id: created.id } });

      const check = await prisma.dictionaryEntry.findUnique({ 
        where: { id: created.id } 
      });
      expect(check).toBeNull();
    });
  });

  // --- SUITE 2: DATA INTEGRITY & DEFAULTS ---
  describe('Data Integrity & Defaults', () => {
    
    it('DEFAULTS: Should apply default values for minimal entry', async () => {
      // Menggunakan helper minimal dari factory
      const payload = DictionaryEntryFactory.buildMinimal();

      const entry = await prisma.dictionaryEntry.create({ data: payload });

      expect(entry.word).toBe(payload.word);
      // Validasi nilai default schema.prisma
      expect(entry.isTypo).toBe(false);
      expect(entry.isMisconception).toBe(false);
      expect(entry.synonyms).toEqual([]);
      
      await prisma.dictionaryEntry.delete({ where: { id: entry.id } });
    });

    it('NULL HANDLING: Should accept null for optional fields', async () => {
      const payload = DictionaryEntryFactory.build({
        errorAnalysis: null,
        category: null
      });

      const entry = await prisma.dictionaryEntry.create({ data: payload });
      
      expect(entry.errorAnalysis).toBeNull();
      expect(entry.category).toBeNull();

      await prisma.dictionaryEntry.delete({ where: { id: entry.id } });
    });
  });

  // --- SUITE 3: ADVANCED SCENARIOS ---
  describe('Advanced Scenarios', () => {

    it('TRANSACTION: Should Rollback all changes if one fails', async () => {
      const countBefore = await prisma.dictionaryEntry.count();

      // Skenario: Insert sukses lalu Insert gagal dalam satu transaksi
      await expect(
        prisma.$transaction(async (tx) => {
          await tx.dictionaryEntry.create({ 
            data: DictionaryEntryFactory.build() 
          });
          
          throw new Error('Simulated Transaction Failure');
        })
      ).rejects.toThrow('Simulated Transaction Failure');

      const countAfter = await prisma.dictionaryEntry.count();
      // Assert: Jumlah data tidak boleh bertambah
      expect(countAfter).toBe(countBefore);
    });

    it('CONCURRENCY: Should handle batch inserts correctly', async () => {
      const batchSize = 5;
      const tasks = Array.from({ length: batchSize }).map(() => 
        prisma.dictionaryEntry.create({ 
          data: DictionaryEntryFactory.build() 
        })
      );

      const results = await Promise.allSettled(tasks);
      
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      expect(successCount).toBe(batchSize);

      // Cleanup batch
      const ids = results
        .map(r => (r.status === 'fulfilled' ? r.value.id : null))
        .filter(Boolean) as string[];

      await prisma.dictionaryEntry.deleteMany({ where: { id: { in: ids } } });
    });
  });
});