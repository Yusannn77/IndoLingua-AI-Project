import { GoogleGenAI, Type } from "@google/genai";
import {
  TranslationResult,
  VocabResult,
  GrammarQuestion,
  ChallengeFeedback,
  HistoryItem,
  StoryScenario,
  SurvivalScenario
} from "../types";

// --- CONFIGURATION & CONSTANTS ---
const CONFIG = {
  API_KEY: process.env.API_KEY || '',
  MODEL_NAME: 'gemini-2.5-flash-lite',
  HISTORY_KEY: 'indolingua_history_v1',
  CACHE_DURATION_MS: 60 * 60 * 1000, // 1 hour
  MAX_HISTORY_ITEMS: 50,
  RETRY: {
    COUNT: 3,
    DELAY_MS: 2000,
  }
};

const PROMPTS = {
  TUTOR_INSTRUCTION: `
You are IndoLingua, a helpful English tutor for Indonesians.
Output JSON ONLY.
Your goal is to provide CLEAR and HELPFUL explanations.
For nuances and context, use natural Indonesian language that is easy to understand.
`,
};

// --- CACHE SYSTEM ---
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class CacheService {
  private store = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T): void {
    this.store.set(key, { data, timestamp: Date.now() });
  }

  get<T>(key: string): T | null {
    if (!this.store.has(key)) return null;
    
    const entry = this.store.get(key)!;
    const isExpired = Date.now() - entry.timestamp > CONFIG.CACHE_DURATION_MS;
    
    if (isExpired) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  clean(): void {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (now - value.timestamp > CONFIG.CACHE_DURATION_MS) {
        this.store.delete(key);
      }
    }
  }
}

const cacheService = new CacheService();

// --- HISTORY SYSTEM ---
class HistoryService {
  private history: HistoryItem[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (typeof localStorage === 'undefined') return;
      const saved = localStorage.getItem(CONFIG.HISTORY_KEY);
      if (saved) {
        this.history = JSON.parse(saved).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
      }
    } catch (error) {
      console.error("Failed to load history:", error);
      this.history = [];
    }
  }

  private save() {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(CONFIG.HISTORY_KEY, JSON.stringify(this.history));
    } catch (e) {
      console.warn("Failed to save history:", e);
    }
  }

  add(feature: string, details: string, source: 'API' | 'CACHE', tokens: number = 0) {
    const newItem: HistoryItem = {
      id: Date.now().toString() + Math.random().toString().slice(2, 5),
      timestamp: new Date(),
      feature,
      details,
      source,
      tokens
    };
    
    this.history.push(newItem);
    if (this.history.length > CONFIG.MAX_HISTORY_ITEMS) {
      this.history.shift();
    }
    this.save();
  }

  getAll(): HistoryItem[] {
    return this.history;
  }

  clear() {
    this.history = [];
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(CONFIG.HISTORY_KEY);
      }
    } catch (e) {
      console.warn("Failed to clear history:", e);
    }
  }
}

const historyService = new HistoryService();

// --- API CLIENT ---
interface ApiResult<T> {
  data: T;
  tokens: number;
}

class GeminiClient {
  private client: GoogleGenAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  private async callWithRetry<T>(apiCall: () => Promise<T>): Promise<T> {
    let delay = CONFIG.RETRY.DELAY_MS;
    for (let i = 0; i < CONFIG.RETRY.COUNT; i++) {
      try {
        return await apiCall();
      } catch (error: any) {
        const isRateLimit = error?.response?.status === 429 || error?.status === 429;
        if (isRateLimit && i < CONFIG.RETRY.COUNT - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
        } else {
          throw error;
        }
      }
    }
    throw new Error("API request failed after max retries");
  }

  async generateJson<T>(prompt: string, schemaProperties: any, requiredFields: string[]): Promise<ApiResult<T>> {
    return this.callWithRetry(async () => {
      const response = await this.client.models.generateContent({
        model: CONFIG.MODEL_NAME,
        contents: prompt,
        config: {
          systemInstruction: PROMPTS.TUTOR_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: schemaProperties,
            required: requiredFields
          } as any // Cast to any if type definitions are strict
        }
      });

      return {
        data: JSON.parse(response.text || "{}"),
        tokens: response.usageMetadata?.totalTokenCount || 0
      };
    });
  }

  async generateText(prompt: string, maxTokens = 50): Promise<ApiResult<string>> {
    return this.callWithRetry(async () => {
      const response = await this.client.models.generateContent({
        model: CONFIG.MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: "text/plain",
          maxOutputTokens: maxTokens,
          temperature: 0.1
        }
      });

      const text = response.text?.trim().replace(/^["']|["']$|\.$/g, '') || "Tidak ditemukan";
      return {
        data: text,
        tokens: response.usageMetadata?.totalTokenCount || 0
      };
    });
  }
}

const apiClient = new GeminiClient(CONFIG.API_KEY);

// --- MAIN SERVICE EXPORT ---

export const GeminiService = {
  getHistory: () => historyService.getAll(),
  clearHistory: () => historyService.clear(),

  // 1. Translate & Explain
  translateAndExplain: async (text: string): Promise<TranslationResult> => {
    const key = `trans:${text.trim().toLowerCase()}`;
    
    // Check cache
    const cached = cacheService.get<TranslationResult>(key);
    if (cached) {
      historyService.add("Translator", `Menerjemahkan: "${text.substring(0, 20)}..."`, "CACHE");
      return cached;
    }

    // Call API
    const prompt = `Translate to English naturally. Explain the grammar structure clearly in Indonesian (why is it translated this way?). Give 3 natural sentence variations. Input: "${text}"`;
    const schema = {
      translation: { type: Type.STRING },
      explanation: { type: Type.STRING },
      variations: { type: Type.ARRAY, items: { type: Type.STRING } }
    };

    const result = await apiClient.generateJson<TranslationResult>(prompt, schema, ["translation", "explanation", "variations"]);
    
    // Update state
    cacheService.set(key, result.data);
    historyService.add("Translator", `Menerjemahkan: "${text.substring(0, 20)}..."`, "API", result.tokens);
    
    return result.data;
  },

  // 2. Vocab Builder
  explainVocab: async (word: string): Promise<VocabResult> => {
    const key = `vocab:${word.trim().toLowerCase()}`;

    const cached = cacheService.get<VocabResult>(key);
    if (cached) {
      historyService.add("Vocab Builder", `Mencari kata: "${word}"`, "CACHE");
      return cached;
    }

    const prompt = `Explain the word "${word}" for an Indonesian learner.
        1. Meaning: In Indonesian.
        2. Context Usage: A full, natural English sentence examples with its Indonesian translation.
        3. Nuance: Explain in Indonesian how this word differs from its synonyms or when to use it properly (give a solid explanation).
        4. Synonyms: List 3 synonyms.`;
    
    const schema = {
      word: { type: Type.STRING },
      meaning: { type: Type.STRING },
      context_usage: { type: Type.STRING },
      nuance_comparison: { type: Type.STRING },
      synonyms: { type: Type.ARRAY, items: { type: Type.STRING } }
    };

    const result = await apiClient.generateJson<VocabResult>(prompt, schema, ["word", "meaning", "context_usage", "nuance_comparison", "synonyms"]);

    cacheService.set(key, result.data);
    historyService.add("Vocab Builder", `Mencari kata: "${word}"`, "API", result.tokens);

    return result.data;
  },

  // 3. Grammar Practice
  generateGrammarQuestion: async (level: 'beginner' | 'intermediate'): Promise<GrammarQuestion> => {
    const prompt = `Generate 1 multiple choice grammar question (${level}) relevant for Indonesians. Provide a helpful explanation in Indonesian why the answer is correct.`;
    const schema = {
      id: { type: Type.STRING },
      question: { type: Type.STRING },
      options: { type: Type.ARRAY, items: { type: Type.STRING } },
      correctIndex: { type: Type.INTEGER },
      explanation: { type: Type.STRING }
    };

    const result = await apiClient.generateJson<GrammarQuestion>(prompt, schema, ["question", "options", "correctIndex", "explanation"]);
    
    historyService.add("Grammar Practice", `Generate soal level ${level}`, "API", result.tokens);
    return result.data;
  },

  // 4. Daily Challenge Evaluation
  evaluateChallengeResponse: async (scenario: string, englishPhrase: string, userTranslation: string): Promise<ChallengeFeedback> => {
    const prompt = `Evaluate accuracy. Target: "${englishPhrase}". User: "${userTranslation}".
        Output JSON: score (1-10), feedback (Indonesian), improved_response (Indonesian).`;
    const schema = {
      score: { type: Type.NUMBER },
      feedback: { type: Type.STRING },
      improved_response: { type: Type.STRING }
    };

    const result = await apiClient.generateJson<ChallengeFeedback>(prompt, schema, ["score", "feedback", "improved_response"]);
    
    historyService.add("Daily Challenge", "Evaluasi jawaban user", "API", result.tokens);
    return result.data;
  },

  // 5. Story Lab - Generate Sentence
  generateStorySentence: async (): Promise<StoryScenario> => {
    const prompt = `Generate 1 short, evocative English sentence usually found in novels, anime subtitles, or slice-of-life comics. 
        It should describe a feeling, a scenery, or a character action.
        Example: "She smiled, as if remembering something from a distant past."
        Output JSON: { "sentence": "...", "translation": "Terjemahan Indonesia yang puitis/natural" }`;
    const schema = {
      sentence: { type: Type.STRING },
      translation: { type: Type.STRING }
    };

    const result = await apiClient.generateJson<StoryScenario>(prompt, schema, ["sentence", "translation"]);
    
    historyService.add("Story Lab", "Generate Kalimat Cerita", "API", result.tokens);
    return result.data;
  },

  // 6. Evaluate Translation - Story Mode
  evaluateStoryTranslation: async (original: string, userTranslate: string): Promise<ChallengeFeedback> => {
    const prompt = `Context: Translating a novel/anime line.
        Original English: "${original}"
        User Indonesian Translation: "${userTranslate}"
        
        Evaluate accuracy and nuance. 
        Output JSON: 
        - score (1-10)
        - feedback (in Indonesian)
        - improved_response (The ideal INDONESIAN translation).`;
    
    const schema = {
      score: { type: Type.NUMBER },
      feedback: { type: Type.STRING },
      improved_response: { type: Type.STRING }
    };

    const result = await apiClient.generateJson<ChallengeFeedback>(prompt, schema, ["score", "feedback", "improved_response"]);
    
    historyService.add("Story Lab", "Evaluasi Terjemahan", "API", result.tokens);
    return result.data;
  },

  // 7. Get Word Definition (TEXT MODE)
  getWordDefinition: async (word: string, contextSentence: string): Promise<string> => {
    const prompt = `Translate english word "${word}" to Indonesian.
        Context: "${contextSentence}"
        Output ONLY the Indonesian meaning.`;
    
    const result = await apiClient.generateText(prompt);
    
    historyService.add("Smart Dictionary", `Menerjemahkan: ${word}`, "API", result.tokens);
    return result.data;
  },

  // 8. Survival Mode - Generate Scenario
  generateSurvivalScenario: async (targetWord: string): Promise<SurvivalScenario> => {
    const prompt = `Create a short, urgent "Survival Situation" where the user MUST use the word "${targetWord}" to solve it.
        Context: Daily Life / Travel / Work.
        Example if word is "Negotiate": "You are in a taxi in Bali and the driver asks for too much money."
        Output JSON: { "word": "${targetWord}", "situation": "..." }`;
    
    const schema = {
      word: { type: Type.STRING },
      situation: { type: Type.STRING }
    };

    const result = await apiClient.generateJson<SurvivalScenario>(prompt, schema, ["word", "situation"]);
    
    historyService.add("Survival Mode", `Misi kata: ${targetWord}`, "API", result.tokens);
    return result.data;
  },

  // 9. Survival Mode - Evaluate Response
  evaluateSurvivalResponse: async (situation: string, targetWord: string, userResponse: string): Promise<ChallengeFeedback> => {
    const prompt = `Role: Strict Language Examiner.
        Situation: ${situation}
        Required Word: "${targetWord}"
        User Response: "${userResponse}"
        
        Task: Evaluate if the user used the word "${targetWord}" correctly AND appropriately for the situation in ENGLISH.
        
        Output JSON: { score (1-10), feedback (Indonesian), improved_response (Better ENGLISH response) }`;
    
    const schema = {
      score: { type: Type.NUMBER },
      feedback: { type: Type.STRING },
      improved_response: { type: Type.STRING }
    };

    const result = await apiClient.generateJson<ChallengeFeedback>(prompt, schema, ["score", "feedback", "improved_response"]);
    
    historyService.add("Survival Mode", "Evaluasi Misi", "API", result.tokens);
    return result.data;
  }
};
