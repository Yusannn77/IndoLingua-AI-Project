import { GoogleGenAI, Type } from "@google/genai";
import { TranslationResult, VocabResult, GrammarQuestion, ChallengeFeedback, HistoryItem } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const MODEL_NAME = 'gemini-2.5-flash';
const HISTORY_STORAGE_KEY = 'indolingua_history_v1';

// --- STORAGE ---
const cache = {
  vocab: new Map<string, { data: VocabResult, timestamp: number }>(),
  translation: new Map<string, { data: TranslationResult, timestamp: number }>(),
};

// Cache expiration time (1 hour)
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// Function to clean expired cache entries
function cleanExpiredCache() {
  const now = Date.now();
  // Clean vocab cache
  for (const [key, value] of cache.vocab.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      cache.vocab.delete(key);
    }
  }
  // Clean translation cache
  for (const [key, value] of cache.translation.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      cache.translation.delete(key);
    }
  }
}

// --- LOAD HISTORY ---
let requestHistory: HistoryItem[] = [];

try {
  // Cek dulu apakah localStorage tersedia
  if (typeof Storage !== 'undefined' && localStorage) {
    const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (saved) {
      requestHistory = JSON.parse(saved).map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      }));
    }
  }
} catch (error) {
  console.error("History error:", error);
  requestHistory = [];
}

const addToHistory = (feature: string, details: string, source: 'API' | 'CACHE', tokens?: number) => {
  const newItem: HistoryItem = {
    id: Date.now().toString() + Math.random().toString().slice(2, 5),
    timestamp: new Date(),
    feature,
    details,
    source,
    tokens
  };
  requestHistory.push(newItem);
  if (requestHistory.length > 50) requestHistory.shift();
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(requestHistory));
  } catch (e) {
    // Jika localStorage penuh atau error, abaikan saja, tidak perlu crash aplikasi
    console.warn("Tidak bisa menyimpan ke localStorage:", e);
  }
};

// --- BALANCED SYSTEM INSTRUCTION ---
const TUTOR_INSTRUCTION = `
You are IndoLingua, a helpful English tutor for Indonesians.
Output JSON ONLY.
Your goal is to provide CLEAR and HELPFUL explanations.
For nuances and context, use natural Indonesian language that is easy to understand.
`;

// --- RETRY LOGIC ---
async function callWithRetry<T>(apiCall: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await apiCall();
    } catch (error: any) {
      const isRateLimit = error?.response?.status === 429 || error?.status === 429;
      if (isRateLimit && i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      } else {
        throw error;
      }
    }
  }
  throw new Error("Max retries reached");
}

export const GeminiService = {
  getHistory: () => requestHistory,
  clearHistory: () => {
    requestHistory = [];
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch (e) {
      console.warn("Tidak bisa menghapus dari localStorage:", e);
    }
  },

  // FUNGSI CHAT DIHAPUS

  // 2. Translate & Explain (BALANCED)
  translateAndExplain: async (text: string): Promise<TranslationResult> => {
    const key = text.trim().toLowerCase();
    cleanExpiredCache(); // Clean expired entries before checking cache

    if (cache.translation.has(key)) {
      const cachedValue = cache.translation.get(key)!;
      // Check if cache entry is still valid
      if (Date.now() - cachedValue.timestamp <= CACHE_DURATION) {
        addToHistory("Translator", `Menerjemahkan: "${text.substring(0, 20)}..."`, "CACHE", 0);
        return cachedValue.data;
      } else {
        // Remove expired entry
        cache.translation.delete(key);
      }
    }

    const wrapper = await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Translate to English naturally. Explain the grammar structure clearly in Indonesian (why is it translated this way?). Give 3 natural sentence variations. Input: "${text}"`,
        config: {
          systemInstruction: TUTOR_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              translation: { type: Type.STRING },
              explanation: { type: Type.STRING },
              variations: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["translation", "explanation", "variations"]
          }
        }
      });
      return {
        data: JSON.parse(response.text || "{}"),
        tokens: response.usageMetadata?.totalTokenCount || 0
      };
    });

    const result = wrapper.data;
    cache.translation.set(key, { data: result, timestamp: Date.now() });
    addToHistory("Translator", `Menerjemahkan: "${text.substring(0, 20)}..."`, "API", wrapper.tokens);
    return result;
  },

  // 3. Vocab Builder (QUALITY RESTORED)
  explainVocab: async (word: string): Promise<VocabResult> => {
    const key = word.trim().toLowerCase();
    cleanExpiredCache(); // Clean expired entries before checking cache

    if (cache.vocab.has(key)) {
      const cachedValue = cache.vocab.get(key)!;
      // Check if cache entry is still valid
      if (Date.now() - cachedValue.timestamp <= CACHE_DURATION) {
        addToHistory("Vocab Builder", `Mencari kata: "${word}"`, "CACHE", 0);
        return cachedValue.data;
      } else {
        // Remove expired entry
        cache.vocab.delete(key);
      }
    }

    const wrapper = await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Explain the word "${word}" for an Indonesian learner.
        1. Meaning: In Indonesian.
        2. Context Usage: A full, natural English sentence examples with its Indonesian translation.
        3. Nuance: Explain in Indonesian how this word differs from its synonyms or when to use it properly (give a solid explanation).
        4. Synonyms: List 3 synonyms.`,
        config: {
          systemInstruction: TUTOR_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
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
        }
      });
      return {
        data: JSON.parse(response.text || "{}"),
        tokens: response.usageMetadata?.totalTokenCount || 0
      };
    });

    const result = wrapper.data;
    cache.vocab.set(key, { data: result, timestamp: Date.now() });
    addToHistory("Vocab Builder", `Mencari kata: "${word}"`, "API", wrapper.tokens);
    return result;
  },

  // 4. Grammar Practice
  generateGrammarQuestion: async (level: 'beginner' | 'intermediate'): Promise<GrammarQuestion> => {
    const wrapper = await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Generate 1 multiple choice grammar question (${level}) relevant for Indonesians. Provide a helpful explanation in Indonesian why the answer is correct.`,
        config: {
          systemInstruction: TUTOR_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING }
            },
            required: ["question", "options", "correctIndex", "explanation"]
          }
        }
      });
      return {
        data: JSON.parse(response.text || "{}"),
        tokens: response.usageMetadata?.totalTokenCount || 0
      };
    });

    addToHistory("Grammar Practice", `Generate soal level ${level}`, "API", wrapper.tokens);
    return wrapper.data;
  },

  // 5. Daily Challenge Evaluation
  evaluateChallengeResponse: async (scenario: string, englishPhrase: string, userTranslation: string): Promise<ChallengeFeedback> => {
    const wrapper = await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Evaluate this translation. Context: ${scenario}. Target: ${englishPhrase}. User: ${userTranslation}.
        Give a score (1-10).
        Feedback: Explain in Indonesian where the user can improve (grammar/vocab).
        Improved Response: The most natural way to say it in Indonesian.`,
        config: {
          systemInstruction: TUTOR_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              feedback: { type: Type.STRING },
              improved_response: { type: Type.STRING }
            },
            required: ["score", "feedback", "improved_response"]
          }
        }
      });
      return {
        data: JSON.parse(response.text || "{}"),
        tokens: response.usageMetadata?.totalTokenCount || 0
      };
    });

    addToHistory("Daily Challenge", "Evaluasi jawaban user", "API", wrapper.tokens);
    return wrapper.data;
  }
};