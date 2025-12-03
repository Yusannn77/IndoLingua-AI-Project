import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';

// --- 1. Story Attempt Factory ---
export const StoryAttemptFactory = {
  build: (overrides: Partial<Prisma.StoryAttemptCreateInput> = {}): Prisma.StoryAttemptCreateInput => ({
    englishText: `En-Text-${randomUUID().slice(0, 8)}`,
    userTranslation: `Id-Trans-${randomUUID().slice(0, 8)}`,
    aiFeedback: `Feedback-${randomUUID().slice(0, 8)}`,
    score: Math.floor(Math.random() * 100),
    ...overrides,
  }),

  buildLongText: (length: number): Prisma.StoryAttemptCreateInput => ({
    englishText: "Long Text Test",
    userTranslation: "A".repeat(length),
    aiFeedback: "Length check",
    score: 50
  })
};

// --- 2. Dictionary Entry Factory ---
export const DictionaryEntryFactory = {
  build: (overrides: Partial<Prisma.DictionaryEntryCreateInput> = {}): Prisma.DictionaryEntryCreateInput => ({
    word: `Word-${randomUUID().slice(0, 8)}`, 
    meaning: "Arti kata generated",
    contextUsage: "Contoh kalimat penggunaan context.",
    nuanceComparison: "Penjelasan nuansa kata.",
    synonyms: ["syn1", "syn2"],
    isTypo: false,
    isMisconception: false,
    errorAnalysis: null,
    category: "Literal",
    literalMeaning: null,
    figurativeMeaning: null,
    ...overrides,
  }),

  buildMinimal: (): Prisma.DictionaryEntryCreateInput => ({
    word: `MinWord-${randomUUID().slice(0, 8)}`,
    meaning: "Arti sederhana",
    contextUsage: "-", 
    nuanceComparison: "-",
    synonyms: [], 
  })
};

// --- 3. FLASHCARD FACTORY (REVISED LOGIC) ---
export const FlashcardFactory = {
  build: (
    dictionaryEntryId: string, 
    overrides: Partial<Prisma.FlashcardUncheckedCreateInput> = {}
  ): Prisma.FlashcardUncheckedCreateInput => {
    
    // Definisi default values
    const defaultData = {
      dictionaryEntryId,
      sourceContext: "Context from factory test",
      sourceType: "TEST",
      status: "NEW",
      masteryLevel: 0,
      nextReviewDate: null,
      lastReviewedAt: null,
    };

    // Merge dan paksa tipe output (Strict Type Assertion)
    // Ini memberitahu TS: "Percayalah, hasil gabungan ini SESUAI dengan tipe UncheckedCreateInput"
    return {
      ...defaultData,
      ...overrides,
    } as Prisma.FlashcardUncheckedCreateInput;
  }
};