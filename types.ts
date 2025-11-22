export enum AppView {
  // CHAT dihapus
  TRANSLATE = 'TRANSLATE',
  VOCAB = 'VOCAB',
  GRAMMAR = 'GRAMMAR',
  CHALLENGE = 'CHALLENGE',
  HISTORY = 'HISTORY',
  HOME = 'HOME'
}

// ChatMessage interface dihapus karena fitur Chat Tutor dihapus

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

export interface ChallengeScenario {
  scenario: string;
  goal: string;
}

export interface ChallengeFeedback {
  score: number;
  feedback: string;
  improved_response: string;
}