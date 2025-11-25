// src/types/index.ts

// --- Enums & Literals ---
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

// --- Interfaces ---

export interface HistoryItem {
  id: string;
  timestamp: Date;
  feature: string;
  details: string;
  source: 'API' | 'CACHE';
  tokens?: number;
}

export interface VocabResult {
  word: string;
  meaning: string;
  context_usage: string;
  nuance_comparison: string;
  synonyms: string[];
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
}

export interface ChallengeFeedback {
  score: number;
  feedback: string;
  improved_response: string;
}

// --- Story Lab Specific ---

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

export interface VocabRecommendation {
  text: string;
  type: 'word' | 'phrase';
  translation: string;
}

export interface CachedAnalysis {
  timestamp: number;
  recommendations: VocabRecommendation[];
}

// --- Daily Challenge & Survival ---

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