import { GoogleGenAI, Type } from "@google/genai";
import { TranslationResult, VocabResult, GrammarQuestion, ChallengeScenario, ChallengeFeedback } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const MODEL_NAME = 'gemini-2.5-flash';

// --- Helper for System Instructions ---
const SYSTEM_INSTRUCTION_BASE = `
Anda adalah IndoLingua, tutor bahasa Inggris pribadi untuk orang Indonesia. 
Gaya bicara anda ramah, sabar, dan suportif. 
Gunakan Bahasa Indonesia untuk menjelaskan konsep grammar atau koreksi agar mudah dipahami.
Tujuan utama adalah membuat pengguna percaya diri, bukan takut salah grammar.
`;

export const GeminiService = {
  // 1. Chat Tutor
  createChat: () => {
    return ai.chats.create({
      model: MODEL_NAME,
      config: {
        systemInstruction: `${SYSTEM_INSTRUCTION_BASE} 
        Dalam mode Chat, ajak pengguna mengobrol santai. Jika mereka salah grammar, perbaiki dengan sopan di akhir respon (format: 'Koreksi kecil: ...').`,
      },
    });
  },

  // 2. Translate & Explain
  translateAndExplain: async (text: string): Promise<TranslationResult> => {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Translate this Indonesian sentence to English naturally, explain the grammar simply, and give variations: "${text}"`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_BASE,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translation: { type: Type.STRING },
            explanation: { type: Type.STRING, description: "Explain why this translation is used in Bahasa Indonesia" },
            variations: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["translation", "explanation", "variations"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  },

  // 3. Vocab Builder
  explainVocab: async (word: string): Promise<VocabResult> => {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Explain the English word "${word}" for an Indonesian learner. Include meaning, context usage in Indonesia, comparisons (nuances), and synonyms.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_BASE,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            meaning: { type: Type.STRING, description: "Meaning in Bahasa Indonesia" },
            context_usage: { type: Type.STRING, description: "Example sentence and context relevant to Indonesians" },
            nuance_comparison: { type: Type.STRING, description: "Compare with similar words (e.g., see vs look)" },
            synonyms: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["word", "meaning", "context_usage", "nuance_comparison", "synonyms"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  },

  // 4. Grammar Practice
  generateGrammarQuestion: async (level: 'beginner' | 'intermediate'): Promise<GrammarQuestion> => {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Generate a multiple choice grammar question for ${level} level learners. Focus on common mistakes Indonesians make (e.g., to be, tenses).`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_BASE,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctIndex: { type: Type.INTEGER },
            explanation: { type: Type.STRING, description: "Explanation in Bahasa Indonesia" }
          },
          required: ["question", "options", "correctIndex", "explanation"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  },

  // 5. Daily Challenge
  getDailyChallenge: async (): Promise<ChallengeScenario> => {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: "Generate a short daily conversational scenario (e.g. ordering food, asking directions, introducing self).",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_BASE,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scenario: { type: Type.STRING, description: "The situation description in Bahasa Indonesia" },
            goal: { type: Type.STRING, description: "The English sentence the user needs to learn/translate." }
          },
          required: ["scenario", "goal"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  },

  evaluateChallengeResponse: async (scenario: string, englishPhrase: string, userTranslation: string): Promise<ChallengeFeedback> => {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Context: ${scenario}. \nTask: Translate the English phrase "${englishPhrase}" into Bahasa Indonesia. \nUser's Translation: "${userTranslation}". \nEvaluate this translation based on accuracy and naturalness in Indonesian.`,
      config: {
        systemInstruction: "You are a supportive tutor. Give a score 1-10. Explain clearly in Indonesian. Provide the most natural Indonesian translation as improved_response.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            feedback: { type: Type.STRING },
            improved_response: { type: Type.STRING, description: "The ideal/natural Indonesian translation" }
          },
          required: ["score", "feedback", "improved_response"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  }
};
