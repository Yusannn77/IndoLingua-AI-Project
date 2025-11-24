import { GoogleGenAI, Type, Schema } from "@google/genai";
import {
  TranslationResult,
  VocabResult,
  GrammarQuestion,
  ChallengeFeedback,
  HistoryItem,
  StoryScenario,
  SurvivalScenario
} from "../types";

const CONFIG = {
  API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '',
  MODEL_NAME: 'gemini-2.5-flash-lite', 
  HISTORY_KEY: 'indolingua_history_v1',
  TOKEN_KEY: 'indolingua_token_usage_v1',
  CACHE_DURATION_MS: 3600000, 
  MAX_HISTORY_ITEMS: 50,
  MAX_RETRIES: 3,
};

// --- TYPES HELPER ---
// Kita buat tipe khusus untuk Error API supaya tidak perlu pakai 'any'
interface GeminiError {
  message?: string;
  status?: number;
}

// --- INFRASTRUCTURE ---

class LocalStore<T> {
  constructor(private key: string) {}
  get(): T[] {
    if (typeof window === 'undefined') return [];
    try {
      const item = localStorage.getItem(this.key);
      return item ? JSON.parse(item) : [];
    } catch { return []; }
  }
  save(data: T[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.key, JSON.stringify(data));
  }
}

const historyStore = new LocalStore<HistoryItem>(CONFIG.HISTORY_KEY);

// FIXED: Menggunakan 'unknown' bukan 'any' untuk data cache yang generik
const cacheStore = new Map<string, { data: unknown; timestamp: number }>();

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

const logHistory = (feature: string, details: string, source: 'API' | 'CACHE', tokens = 0) => {
  const history = historyStore.get();
  const newItem: HistoryItem = {
    id: generateId(),
    timestamp: new Date(),
    feature,
    details,
    source,
    tokens
  };
  const updated = [newItem, ...history].slice(0, CONFIG.MAX_HISTORY_ITEMS);
  historyStore.save(updated);
};

const updateTokenUsage = (newTokens: number) => {
  if (typeof window === 'undefined') return;
  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${now.getMonth()}`;
  try {
    const savedRaw = localStorage.getItem(CONFIG.TOKEN_KEY);
    let saved = savedRaw ? JSON.parse(savedRaw) : { period: currentPeriod, total: 0 };
    if (saved.period !== currentPeriod) {
      saved = { period: currentPeriod, total: newTokens };
    } else {
      saved.total += newTokens;
    }
    localStorage.setItem(CONFIG.TOKEN_KEY, JSON.stringify(saved));
  } catch (e) {
    localStorage.setItem(CONFIG.TOKEN_KEY, JSON.stringify({ period: currentPeriod, total: newTokens }));
  }
};

const getMonthlyTokenUsage = (): number => {
  if (typeof window === 'undefined') return 0;
  try {
    const savedRaw = localStorage.getItem(CONFIG.TOKEN_KEY);
    if (!savedRaw) return 0;
    const saved = JSON.parse(savedRaw);
    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${now.getMonth()}`;
    return saved.period === currentPeriod ? saved.total : 0;
  } catch { return 0; }
};

const client = new GoogleGenAI({ apiKey: CONFIG.API_KEY });
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- TELEMETRY & RETRY WRAPPER ---

async function executeWithTelemetry<T>(
  featureName: string,
  cacheKey: string | null,
  logDetail: string,
  apiCall: () => Promise<{ data: T; tokens: number }>
): Promise<T> {
  if (cacheKey && cacheStore.has(cacheKey)) {
    const cached = cacheStore.get(cacheKey)!;
    if (Date.now() - cached.timestamp < CONFIG.CACHE_DURATION_MS) {
      logHistory(featureName, logDetail, "CACHE");
      // FIXED: Casting 'unknown' kembali ke 'T' saat diambil dari cache
      return cached.data as T;
    }
    cacheStore.delete(cacheKey);
  }

  let attempt = 0;
  while (attempt < CONFIG.MAX_RETRIES) {
    try {
      const { data, tokens } = await apiCall();
      if (cacheKey) cacheStore.set(cacheKey, { data, timestamp: Date.now() });
      logHistory(featureName, logDetail, "API", tokens);
      updateTokenUsage(tokens);
      return data;
    } catch (error: unknown) { 
      // FIXED: Menggunakan tipe khusus GeminiError, bukan any
      const err = error as GeminiError; 
      
      const isRetryable = err?.message?.includes('503') || err?.status === 503 || err?.status === 429;
      
      if (isRetryable && attempt < CONFIG.MAX_RETRIES - 1) {
        attempt++;
        await delay(attempt * 1500);
        continue;
      }
      console.error(`Gemini API Error [${featureName}]:`, err);
      throw error; // Lempar error asli
    }
  }
  throw new Error("Request failed after max retries");
}

async function generateJson<T>(prompt: string, responseSchema: Schema): Promise<{ data: T; tokens: number }> {
  const response = await client.models.generateContent({
    model: CONFIG.MODEL_NAME,
    contents: prompt,
    config: {
      systemInstruction: "You are IndoLingua. Output valid JSON only.",
      responseMimeType: "application/json",
      responseSchema: responseSchema
    }
  });
  return {
    data: JSON.parse(response.text || "{}"),
    tokens: response.usageMetadata?.totalTokenCount || 0
  };
}

// --- EXPORTED SERVICE ---

export const GeminiService = {
  getHistory: () => historyStore.get().map(h => ({ ...h, timestamp: new Date(h.timestamp) })),
  getTotalTokens: () => getMonthlyTokenUsage(),
  clearHistory: () => localStorage.removeItem(CONFIG.HISTORY_KEY),

  translateAndExplain: (text: string) => 
    executeWithTelemetry<TranslationResult>("Translator", `trans:${text.trim().toLowerCase()}`, `Menerjemahkan: "${text.substring(0, 20)}..."`, 
      () => generateJson(`Translate "${text}"...`, { type: Type.OBJECT, properties: { translation: { type: Type.STRING }, explanation: { type: Type.STRING }, variations: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["translation", "explanation", "variations"] })),

  explainVocab: (word: string) => 
    executeWithTelemetry<VocabResult>("Vocab Builder", `vocab:${word.trim().toLowerCase()}`, `Mencari kata: "${word}"`, 
      () => generateJson(
        `Role: Strict English Dictionary & Validator.
         Input Word: "${word}"

         TASK 1: VALIDATION (Gatekeeper)
         - Check if "${word}" is a VALID ENGLISH WORD.
         - REJECT IF: The word is Indonesian (e.g., "mencuri", "makan", "rumah") OR meaningless.
         - ACTION ON REJECT: Return JSON with "word" = "INVALID_SCOPE" IMMEDIATELY. Leave other fields empty. Do NOT explain why.

         TASK 2: DEFINITION (Only if Valid)
         - If Valid English: Provide definition, context, and nuance.
         - CRITICAL RULE for 'context_usage': 
           Format MUST be: "English sentence. (Indonesian translation)".
           Example: "The building is tall. (Bangunan itu tinggi.)"

         JSON Output Structure:
         {
           "word": "The word OR 'INVALID_SCOPE'",
           "meaning": "Indonesian definition (or empty if invalid)",
           "context_usage": "English sentence. (Indonesian translation) (or empty if invalid)",
           "nuance_comparison": "Nuance explanation (or empty if invalid)",
           "synonyms": ["synonym1"] (or empty array)
         }`,
        { 
          type: Type.OBJECT, 
          properties: { 
            word: { type: Type.STRING }, 
            meaning: { type: Type.STRING }, 
            context_usage: { type: Type.STRING }, 
            nuance_comparison: { type: Type.STRING }, 
            synonyms: { type: Type.ARRAY, items: { type: Type.STRING } } 
          }, 
          required: ["word", "meaning", "context_usage", "nuance_comparison", "synonyms"] 
        }
      )
    ),

  generateGrammarQuestion: (level: 'beginner' | 'intermediate') =>
    executeWithTelemetry<GrammarQuestion>("Grammar Practice", null, `Generate soal ${level}`, 
      () => generateJson(`Generate grammar question...`, { type: Type.OBJECT, properties: { id: { type: Type.STRING }, question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correctIndex: { type: Type.INTEGER }, explanation: { type: Type.STRING } }, required: ["question", "options", "correctIndex", "explanation"] })),

  evaluateChallengeResponse: (scenario: string, phrase: string, user: string) =>
    executeWithTelemetry<ChallengeFeedback>("Daily Challenge", null, "Evaluasi Challenge", 
      () => generateJson(`Evaluate "${user}" vs "${phrase}"...`, { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, feedback: { type: Type.STRING }, improved_response: { type: Type.STRING } }, required: ["score", "feedback", "improved_response"] })),

  generateStorySentence: () =>
    executeWithTelemetry<StoryScenario>("Story Lab", null, "Generate Story", 
      () => generateJson(`Generate sentence...`, { type: Type.OBJECT, properties: { sentence: { type: Type.STRING }, translation: { type: Type.STRING } }, required: ["sentence", "translation"] })),

  evaluateStoryTranslation: (orig: string, user: string) =>
    executeWithTelemetry<ChallengeFeedback>("Story Lab", null, "Evaluasi Terjemahan", 
      () => generateJson(`Evaluate translation...`, { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, feedback: { type: Type.STRING }, improved_response: { type: Type.STRING } }, required: ["score", "feedback", "improved_response"] })),

  generateSurvivalScenario: (word: string) =>
    executeWithTelemetry<SurvivalScenario>("Survival Mode", null, `Misi: ${word}`, 
      () => generateJson(`Create scenario for "${word}"...`, { type: Type.OBJECT, properties: { word: { type: Type.STRING }, situation: { type: Type.STRING } }, required: ["word", "situation"] })),

  evaluateSurvivalResponse: (sit: string, word: string, res: string) =>
    executeWithTelemetry<ChallengeFeedback>("Survival Mode", null, "Evaluasi Misi", 
      () => generateJson(
        `Role: Friendly English Tutor.
         Context: A student is practicing English in a scenario.
         Scenario: "${sit}"
         Target Word to Use: "${word}"
         Student Answer: "${res}"

         GRADING RULES:
         1. IF the student uses the word "${word}" correctly AND the sentence makes sense in context -> Give Score 7-10.
         2. IF the grammar is slightly wrong but understandable -> Give Score 6-8.
         3. ONLY give low score (<5) if the answer is irrelevant or missing the target word.
         
         OUTPUT FORMAT (JSON):
         - "score": (Integer 1-10)
         - "feedback": (Bahasa Indonesia) Explain friendly why it's good or how to improve. Don't be too formal.
         - "improved_response": (English) A perfect, natural sentence example for this scenario using the word.`,
        { 
          type: Type.OBJECT, 
          properties: { 
            score: { type: Type.INTEGER }, 
            feedback: { type: Type.STRING }, 
            improved_response: { type: Type.STRING } 
          }, 
          required: ["score", "feedback", "improved_response"] 
        }
      )
    ),

  getWordDefinition: (word: string, context: string) =>
    executeWithTelemetry<string>("Smart Dictionary", `def:${word}:${context.substring(0,10)}`, `Definisi: ${word}`, async () => {
        const res = await client.models.generateContent({ 
            model: CONFIG.MODEL_NAME, 
            contents: `
              Task: Translate the word "${word}" into Indonesian.
              Context: "${context}"
              RULES: Translate ONLY the word. Do NOT include surrounding words. Output ONLY the Indonesian word.
            ` 
        });
        return { data: res.text?.trim() || "", tokens: res.usageMetadata?.totalTokenCount || 0 };
    }),
};