import { z } from 'zod';

// --- EXISTING SCHEMAS (Legacy) ---
export const vocabSchema = z.object({
  word: z.string().min(1).max(100),
  translation: z.string().min(1),
  originalSentence: z.string().optional().default("-"),
  mastered: z.boolean().optional()
});

export const historySchema = z.object({
  feature: z.string().min(1),
  details: z.string().min(1),
  source: z.enum(["API", "CACHE"]),
  tokens: z.number().int().nonnegative().default(0)
});

// --- NEW: DICTIONARY SCHEMA ---
export const dictionaryEntrySchema = z.object({
  word: z.string().min(1, "Kata wajib diisi"),
  meaning: z.string().min(1, "Arti wajib diisi"),
  contextUsage: z.string().default("-"),
  nuanceComparison: z.string().default("-"),
  synonyms: z.array(z.string()).default([]),
  
  // Smart Flags
  isTypo: z.boolean().default(false),
  isMisconception: z.boolean().default(false),
  errorAnalysis: z.string().nullable().optional(),
  
  // Figurative
  category: z.string().nullable().optional(),
  literalMeaning: z.string().nullable().optional(),
  figurativeMeaning: z.string().nullable().optional(),
});

// --- NEW: STORY LAB SCHEMA ---
export const storyAttemptSchema = z.object({
  englishText: z.string().min(1),
  userTranslation: z.string().min(1),
  aiFeedback: z.string().min(1),
  score: z.number().int().min(0).max(100),
});

// Type Inference
export type CreateVocabInput = z.infer<typeof vocabSchema>;
export type CreateDictionaryInput = z.infer<typeof dictionaryEntrySchema>;
export type CreateStoryAttemptInput = z.infer<typeof storyAttemptSchema>;