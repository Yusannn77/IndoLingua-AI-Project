// src/shared/types/index.ts

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  VOCAB = 'VOCAB',
  GRAMMAR = 'GRAMMAR',
  CHALLENGE = 'CHALLENGE',
  HISTORY = 'HISTORY',
  STORY_LAB = 'STORY_LAB',
  HOME = 'HOME'
}

export type LabMode = 'STORY' | 'FLASHCARD' | 'RECALL' | 'HISTORY';

export interface HistoryItem {
  id: string;
  timestamp: Date;
  feature: string;
  details: string;
  source: 'API' | 'CACHE';
  tokens?: number;
}

// --- AI RESULT TYPES (Dari Gemini) ---
export interface VocabResult {
  word: string;
  meaning: string;
  context_usage: string;
  nuance_comparison: string;
  synonyms: string[];
  isTypo?: boolean;
  isMisconception?: boolean;
  misconceptionRule?: string;
  errorAnalysis?: string; 
  originalInput?: string;
  category?: 'Literal' | 'Idiom' | 'Metaphor' | 'Proverb' | 'Slang';
  literal_meaning?: string;
  figurative_meaning?: string;
}

// --- NEW CORE: DICTIONARY ENTRY (Sesuai Schema Prisma Baru) ---
export interface DictionaryEntry {
  id: string;
  word: string;
  meaning: string;
  contextUsage: string;
  nuanceComparison: string;
  synonyms: string[];
  
  // Smart Analysis
  isTypo: boolean;
  isMisconception: boolean;
  errorAnalysis?: string | null;
  
  // Figurative
  category?: string | null;
  literalMeaning?: string | null;
  figurativeMeaning?: string | null;

  createdAt: string | Date; // API return string (ISO), DB return Date
}

export interface Flashcard {
  id: string;
  dictionaryEntryId: string;
  // Include relasi agar UI bisa menampilkan kata & arti
  dictionaryEntry?: DictionaryEntry; 
  
  sourceContext: string | null;
  sourceType: string; // 'STORY' | 'DICTIONARY' | 'MANUAL'

  // SRS Progress
  status: 'NEW' | 'LEARNING' | 'REVIEWING' | 'MASTERED';
  masteryLevel: number;
  nextReviewDate: string | Date | null;
  lastReviewedAt: string | Date | null;

  createdAt: string | Date;
  updatedAt: string | Date;
}

// Payload untuk membuat Flashcard baru dari UI
export interface CreateFlashcardInput {
  word: string;
  meaning: string;
  contextUsage?: string;
  sourceType: 'STORY' | 'DICTIONARY' | 'MANUAL';
}

// Payload untuk membuat Entry baru (tanpa ID dan createdAt)
export type CreateEntryPayload = Omit<DictionaryEntry, 'id' | 'createdAt'>;

// --- NEW CORE: STORY LAB LOGS ---
export interface StoryAttempt {
  id: string;
  englishText: string;
  userTranslation: string;
  aiFeedback: string;
  score: number;
  createdAt: string | Date;
}

// Payload untuk log aktivitas baru
export type CreateStoryAttemptInput = Omit<StoryAttempt, 'id' | 'createdAt'>;

// --- OTHER FEATURE TYPES ---
export interface GrammarError {
  original: string;
  correction: string;
  type: 'Spelling' | 'Grammar' | 'Tense' | 'Punctuation' | 'Word Order';
  explanation: string;
}

export interface GrammarCheckResult {
  correctedSentence: string;
  errors: GrammarError[];
  generalFeedback: string;
}

export interface TranslationResult {
  translation: string;
  explanation: string;
  variations: string[];
}

export interface GrammarQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: string;
}

export interface ChallengeFeedback {
  score: number;
  feedback: string;
  improved_response: string;
}

export interface StoryScenario {
  sentence: string;
  translation: string;
}

export interface VocabRecommendation {
  text: string;
  type: 'word' | 'phrase';
  translation: string;
}

export interface CachedAnalysis {
  timestamp: number;
  recommendations: VocabRecommendation[];
}

export interface DailyProgress {
  date: string; 
  targets: string[];
  memorized: string[];
  completed: string[];
  meanings: Record<string, string>;
}

export interface SurvivalScenario {
  word: string;
  situation: string;
}