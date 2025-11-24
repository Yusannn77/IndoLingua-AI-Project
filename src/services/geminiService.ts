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

// --- LOGGING KE DATABASE (BUKAN LOCALSTORAGE LAGI) ---
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
  cacheKey: string | null, // Cache key bisa kita abaikan dulu atau implementasi Redis nanti
  logInfo: string,
  fn: () => Promise<{ data: T; tokens: number }>
): Promise<T> {
  // 1. Call API (Langsung tembak API dulu untuk sekarang, bypass cache client-side yang rumit)
  const { data, tokens } = await fn();

  // 2. Log ke Database
  logHistoryToDB(feature, logInfo, "API", tokens);

  return data;
}

// --- EXPORTED SERVICE ---
export const GeminiService = {
  // Fitur ini dihapus dari sini karena sekarang tanggung jawab DBService
  // getHistory: ... 
  // getTotalTokens: ...
  
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

  generateSurvivalScenario: (word: string) =>
    withTelemetry<SurvivalScenario>("Survival", null, `Misi Survival: ${word}`, 
      () => callAI('survival_scenario', { word })),

  evaluateSurvivalResponse: (sit: string, word: string, res: string) =>
    withTelemetry<ChallengeFeedback>("Survival Eval", null, "Evaluasi Misi", 
      () => callAI('evaluate_survival', { sit, word, res })),

  getWordDefinition: (word: string, context: string) =>
    withTelemetry<string>("Smart Dictionary", null, `Definisi: ${word}`, async () => {
      const res = await callAI<{ data: string }>('quick_def', { word, context });
      // Casting aman
      return { data: res.data as unknown as string, tokens: res.tokens };
    }),
};