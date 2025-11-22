export enum AppView {
  CHAT = 'CHAT',
  TRANSLATE = 'TRANSLATE',
  VOCAB = 'VOCAB',
  GRAMMAR = 'GRAMMAR',
  CHALLENGE = 'CHALLENGE',
  HOME = 'HOME'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
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
