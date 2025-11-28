import { z } from 'zod';

export const vocabSchema = z.object({
  word: z.string().min(1, "Word is required").max(100),
  translation: z.string().min(1, "Translation is required"),
  originalSentence: z.string().optional().default("-"),
  mastered: z.boolean().optional()
});

export const historySchema = z.object({
  feature: z.string().min(1),
  details: z.string().min(1),
  source: z.enum(["API", "CACHE"]),
  tokens: z.number().int().nonnegative().default(0)
});

export type CreateVocabInput = z.infer<typeof vocabSchema>;