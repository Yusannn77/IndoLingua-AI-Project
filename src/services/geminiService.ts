import {
  TranslationResult,
  VocabResult,
  GrammarQuestion,
  ChallengeFeedback,
  StoryScenario,
  SurvivalScenario,
  HistoryItem
} from "../types";

// --- CORE FETCH FUNCTION ---
async function callAI<T>(feature: string, params: Record<string, unknown>): Promise<{ data: T; tokens: number }> {
  const res = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ feature, params }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'AI Service Failed');
  }
  return await res.json();
}

// --- LOGGING KE DATABASE ---
const logHistoryToDB = (feature: string, details: string, source: 'API' | 'CACHE', tokens = 0) => {
  // Fire-and-forget fetch request ke API History
  fetch('/api/history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      feature,
      details,
      source,
      tokens
    }),
  }).catch(err => console.error("Failed to log history:", err));
};

// --- TELEMETRY WRAPPER ---
async function withTelemetry<T>(
  feature: string,
  cacheKey: string | null,
  logInfo: string,
  fn: () => Promise<{ data: T; tokens: number }>
): Promise<T> {
  // 1. Call API
  const { data, tokens } = await fn();

  // 2. Log ke Database
  logHistoryToDB(feature, logInfo, "API", tokens);

  return data;
}

// --- EXPORTED SERVICE ---
export const GeminiService = {
  // 🟢 FITUR BARU: Batch Definition (Solusi Error 429)
  // Mengambil arti banyak kata sekaligus dalam 1 request
  getBatchWordDefinitions: (words: string[]) =>
    withTelemetry<{ definitions: { word: string; meaning: string }[] }>(
      "Vocab Batch", 
      null, 
      `Batch translate ${words.length} words`, 
      () => callAI('batch_vocab_def', { words })
    ),

  translateAndExplain: (text: string) => 
    withTelemetry<TranslationResult>("Translator", null, `Translate: ${text.substring(0,20)}...`, 
      () => callAI('translate', { text })),

  explainVocab: (word: string) => 
    withTelemetry<VocabResult>("Vocab Builder", null, `Mencari kata: "${word}"`, 
      () => callAI('explain_vocab', { word })),

  generateGrammarQuestion: (level: 'beginner' | 'intermediate') =>
    withTelemetry<GrammarQuestion>("Grammar", null, `Soal Grammar (${level})`, 
      () => callAI('grammar_question', { level })),

  evaluateChallengeResponse: (scenario: string, phrase: string, user: string) =>
    withTelemetry<ChallengeFeedback>("Challenge", null, "Evaluasi Tantangan", 
      () => callAI('evaluate_challenge', { scenario, phrase, user })),

  generateStorySentence: () =>
    withTelemetry<StoryScenario>("Story", null, "Generate Story", 
      () => callAI('generate_story', {})),

  evaluateStoryTranslation: (orig: string, user: string) =>
    withTelemetry<ChallengeFeedback>("Story Eval", null, "Evaluasi Story", 
      () => callAI('evaluate_story', { orig, user })),

  // Helper Wrappers (Tanpa Telemetry berlebih jika dipanggil sub-komponen yang sudah ada logikanya sendiri)
  generateSurvivalScenario: (word: string) =>
    callAI<SurvivalScenario>('survival_scenario', { word }).then(r => r.data),

  evaluateSurvivalResponse: (sit: string, word: string, res: string) =>
    callAI<ChallengeFeedback>('evaluate_survival', { sit, word, res }).then(r => r.data),

  getWordDefinition: (word: string, context: string) =>
    callAI<{ data: string }>('quick_def', { word, context }).then(r => r.data),
};