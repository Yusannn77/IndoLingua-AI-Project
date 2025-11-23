export enum AppView {
  TRANSLATE = 'TRANSLATE',
  VOCAB = 'VOCAB',
  GRAMMAR = 'GRAMMAR',
  CHALLENGE = 'CHALLENGE',
  HISTORY = 'HISTORY',
  STORY_LAB = 'STORY_LAB',
  HOME = 'HOME'
}

export interface HistoryItem {
  id: string;
  timestamp: Date;
  feature: string;
  details: string;
  source: 'API' | 'CACHE';
  tokens?: number;
}

export interface TranslationResult {
  translation: string;
  explanation: string;
  variations: string[];
}

export interface VocabResult {
  word: string;
  meaning: string;
  context_usage: string;
  nuance_comparison: string;
  synonyms: string[];
}

export interface GrammarQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ChallengeFeedback {
  score: number;
  feedback: string;
  improved_response: string;
}

// --- STORY LAB ---
export interface StoryScenario {
  sentence: string;
  translation: string;
}

export interface SavedVocab {
  id: string;
  word: string;
  originalSentence: string;
  translation: string;
  mastered: boolean;
  timestamp: number;
}

// --- DAILY CHALLENGE & SURVIVAL ---
export interface DailyProgress {
  date: string; // Format YYYY-MM-DD
  targets: string[]; // 10 kata target
  memorized: string[]; // Kata yang sudah di-checklist
  completed: string[]; // Kata yang sudah lulus survival
}

export interface SurvivalScenario {
  word: string;
  situation: string;
}