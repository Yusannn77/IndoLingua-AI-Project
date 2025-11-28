import {
  TranslationResult,
  VocabResult,
  GrammarQuestion,
  ChallengeFeedback,
  StoryScenario,
  SurvivalScenario,
  VocabRecommendation,
  GrammarCheckResult
} from "@/shared/types";

// --- SECURITY CONFIG ---
const API_SECRET_HEADER = { 'x-indolingua-secure': 'internal-client-v1' };

interface AIResponse<T> {
  data: T;
  tokens: number;
}

interface AIErrorResponse {
  error: string;
}

// Helper Generic: Memaksa tipe kembalian sesuai T
async function callAI<T>(feature: string, params: Record<string, unknown>): Promise<AIResponse<T>> {
  const res = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...API_SECRET_HEADER
    },
    body: JSON.stringify({ feature, params }),
  });

  if (!res.ok) {
    const err = (await res.json()) as AIErrorResponse;
    throw new Error(err.error || 'AI Service Failed');
  }
  
  return (await res.json()) as AIResponse<T>;
}

const logHistoryToDB = (feature: string, details: string, source: 'API' | 'CACHE', tokens = 0): void => {
  fetch('/api/history', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...API_SECRET_HEADER
    },
    body: JSON.stringify({ feature, details, source, tokens }),
  }).catch(err => console.error("Log failed:", err));
};

async function withTelemetry<T>(
  feature: string,
  cacheKey: string | null, 
  logInfo: string,
  fn: () => Promise<AIResponse<T>>
): Promise<T> {
  const { data, tokens } = await fn();
  logHistoryToDB(feature, logInfo, "API", tokens);
  return data;
}

export const GeminiService = {
  // --- DICTIONARY FEATURE ---
  getBatchWordDefinitions: (words: string[]) =>
    withTelemetry<{ definitions: { word: string; meaning: string }[] }>(
      "Vocab Batch", null, `Batch translate ${words.length} words`, 
      () => callAI('batch_vocab_def', { words })
    ),

  translateAndExplain: (text: string) => 
    withTelemetry<TranslationResult>(
      "Translator", null, `Translate: ${text.substring(0,20)}...`, 
      () => callAI('translate', { text })
    ),

  explainVocab: (word: string) => 
    withTelemetry<VocabResult>(
      "Vocab Builder", null, `Explain: "${word}"`, 
      () => callAI('explain_vocab', { word })
    ),

  getWordDefinition: (word: string, context: string) =>
    callAI<{ translation: string }>('quick_def', { word, context })
      .then(r => r.data.translation),

  // --- GRAMMAR CHECKER FEATURE ---
  checkGrammar: (sentence: string) =>
    withTelemetry<GrammarCheckResult>(
      "Grammar Check", null, "Checking grammar sentence",
      () => callAI('grammar_check', { sentence })
    ),

  generateGrammarQuestion: (level: 'beginner' | 'intermediate') =>
    withTelemetry<GrammarQuestion>(
      "Grammar", null, `Question (${level})`, 
      () => callAI('grammar_question', { level })
    ),

  // --- STORY & CHALLENGE FEATURES ---
  evaluateChallengeResponse: (scenario: string, phrase: string, user: string) =>
    withTelemetry<ChallengeFeedback>(
      "Challenge", null, "Eval Challenge", 
      () => callAI('evaluate_challenge', { scenario, phrase, user })
    ),

  generateStorySentence: () =>
    withTelemetry<StoryScenario>(
      "Story", null, "Generate Story", 
      () => callAI('generate_story', {})
    ),

  evaluateStoryTranslation: (orig: string, user: string) =>
    withTelemetry<ChallengeFeedback>(
      "Story Eval", null, "Eval Story Translation", 
      () => callAI('evaluate_story', { orig, user })
    ),

  analyzeStoryVocab: (sentence: string) =>
    withTelemetry<{ recommendations: VocabRecommendation[] }>(
      "Story Analysis", null, "Analyze vocab candidates",
      () => callAI('analyze_story_vocab', { sentence })
    ),

  evaluateRecall: (word: string, correctAnswer: string, userAnswer: string) =>
    withTelemetry<{ isCorrect: boolean; feedback: string }>(
      "Recall Eval", null, `Recall check: ${word}`,
      () => callAI('evaluate_recall', { word, correctAnswer, userAnswer })
    ),

  generateSurvivalScenario: (word: string) =>
    callAI<SurvivalScenario>('survival_scenario', { word }).then(r => r.data),

  evaluateSurvivalResponse: (sit: string, word: string, res: string) =>
    callAI<ChallengeFeedback>('evaluate_survival', { sit, word, res }).then(r => r.data),
};