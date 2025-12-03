import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '@/shared/lib/prisma';
import { assertTestDatabase } from '../../helpers/db-guard';
import { DictionaryEntryFactory, FlashcardFactory } from '../../helpers/factories';

describe('Flashcard Feature: Persistence Layer', () => {
  
  beforeAll(async () => {
    await assertTestDatabase();
  });

  beforeEach(async () => {
    await prisma.flashcard.deleteMany();
    await prisma.dictionaryEntry.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // --- TEST CASE 1: CREATE FLASHCARD (Happy Path) ---
  it('Should create a Flashcard linked to a DictionaryEntry', async () => {
    // 1. Arrange: Buat Dictionary Entry dulu (Syarat wajib)
    const entry = await prisma.dictionaryEntry.create({
      data: DictionaryEntryFactory.build({ word: "Epiphany" })
    });

    // 2. Act: Buat Flashcard yang me-refer ke entry tersebut
    const flashcard = await prisma.flashcard.create({
      data: FlashcardFactory.build(entry.id, {
        sourceType: 'STORY',
        sourceContext: 'I had an epiphany.'
      })
    });

    // 3. Assert
    expect(flashcard.id).toBeDefined();
    expect(flashcard.dictionaryEntryId).toBe(entry.id);
    expect(flashcard.status).toBe('NEW');
    expect(flashcard.sourceType).toBe('STORY');
  });

  // --- TEST CASE 2: READ WITH RELATION ---
  it('Should retrieve Flashcard along with its Word details', async () => {
    // 1. Arrange
    const entry = await prisma.dictionaryEntry.create({
      data: DictionaryEntryFactory.build({ word: "Serendipity", meaning: "Keberuntungan" })
    });
    
    await prisma.flashcard.create({
      data: FlashcardFactory.build(entry.id)
    });

    // 2. Act: Fetch Flashcard + Include DictionaryEntry
    const fetchedCard = await prisma.flashcard.findUnique({
      where: { dictionaryEntryId: entry.id },
      include: { dictionaryEntry: true } // Join table
    });

    // 3. Assert
    expect(fetchedCard).not.toBeNull();
    expect(fetchedCard?.dictionaryEntry.word).toBe("Serendipity");
    expect(fetchedCard?.dictionaryEntry.meaning).toBe("Keberuntungan");
  });

  // --- TEST CASE 3: DUPLICATE CONSTRAINT ---
  it('Should prevent duplicate Flashcards for the same Word', async () => {
    // 1. Arrange
    const entry = await prisma.dictionaryEntry.create({
      data: DictionaryEntryFactory.build({ word: "DuplicateCheck" })
    });

    // 2. Act: Buat Flashcard pertama (Sukses)
    await prisma.flashcard.create({
      data: FlashcardFactory.build(entry.id)
    });

    // 3. Assert: Buat Flashcard kedua untuk kata yang sama (Harus Gagal)
    await expect(
      prisma.flashcard.create({
        data: FlashcardFactory.build(entry.id)
      })
    ).rejects.toThrow(); // Prisma akan throw error unique constraint violation
  });

});