import {
  TranslationResult,
  VocabResult,
  GrammarQuestion,
  ChallengeFeedback,
  StoryScenario,
  SurvivalScenario,
  VocabRecommendation
} from "../types";

// Core Fetch Wrapper (Type Safe)
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

const logHistoryToDB = (feature: string, details: string, source: 'API' | 'CACHE', tokens = 0) => {
  fetch('/api/history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ feature, details, source, tokens }),
  }).catch((err: unknown) => console.error("Log failed:", err));
};

async function withTelemetry<T>(
  feature: string,
  cacheKey: string | null,
  logInfo: string,
  fn: () => Promise<{ data: T; tokens: number }>
): Promise<T> {
  const { data, tokens } = await fn();
  logHistoryToDB(feature, logInfo, "API", tokens);
  return data;
}

export const GeminiService = {
  getBatchWordDefinitions: (words: string[]) =>
    withTelemetry<{ definitions: { word: string; meaning: string }[] }>(
      "Vocab Batch", null, `Batch translate ${words.length} words`, 
      () => callAI('batch_vocab_def', { words })
    ),

  translateAndExplain: (text: string) => 
    withTelemetry<TranslationResult>("Translator", null, `Translate text`, 
      () => callAI('translate', { text })),

  explainVocab: (word: string) => 
    withTelemetry<VocabResult>("Vocab Builder", null, `Explain: "${word}"`, 
      () => callAI('explain_vocab', { word })),

  generateGrammarQuestion: (level: 'beginner' | 'intermediate') =>
    withTelemetry<GrammarQuestion>("Grammar", null, `Question (${level})`, 
      () => callAI('grammar_question', { level })),

  evaluateChallengeResponse: (scenario: string, phrase: string, user: string) =>
    withTelemetry<ChallengeFeedback>("Challenge", null, "Eval Challenge", 
      () => callAI('evaluate_challenge', { scenario, phrase, user })),

  generateStorySentence: () =>
    withTelemetry<StoryScenario>("Story", null, "Generate Story", 
      () => callAI('generate_story', {})),

  evaluateStoryTranslation: (orig: string, user: string) =>
    withTelemetry<ChallengeFeedback>("Story Eval", null, "Eval Story Translation", 
      () => callAI('evaluate_story', { orig, user })),

  analyzeStoryVocab: (sentence: string) =>
    withTelemetry<{ recommendations: VocabRecommendation[] }>(
      "Story Analysis", null, "Analyze vocab candidates",
      () => callAI('analyze_story_vocab', { sentence })
    ),

  // --- FITUR BARU: EVALUASI RECALL ---
  evaluateRecall: (word: string, correctAnswer: string, userAnswer: string) =>
    withTelemetry<{ isCorrect: boolean; feedback: string }>(
      "Recall Eval", null, `Recall check: ${word}`,
      () => callAI('evaluate_recall', { word, correctAnswer, userAnswer })
    ),

  // Helper Wrappers
  generateSurvivalScenario: (word: string) =>
    callAI<SurvivalScenario>('survival_scenario', { word }).then(r => r.data),

  evaluateSurvivalResponse: (sit: string, word: string, res: string) =>
    callAI<ChallengeFeedback>('evaluate_survival', { sit, word, res }).then(r => r.data),

  getWordDefinition: (word: string, context: string) =>
    callAI<string>('quick_def', { word, context }).then(r => r.data),
};