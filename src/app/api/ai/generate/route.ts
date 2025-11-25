import { GoogleGenAI, Schema, Type } from "@google/genai";
import { NextResponse } from "next/server";

// Pastikan API Key ada di .env
const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// --- INTERFACE PARAMS ---
interface PromptParams {
  words?: string[];
  word?: string;
  text?: string;
  level?: string;
  scenario?: string;
  phrase?: string;
  user?: string;
  orig?: string;
  sit?: string;
  res?: string;
  context?: string;
  sentence?: string;
  correctAnswer?: string; // Parameter baru untuk recall
  userAnswer?: string;    // Parameter baru untuk recall
  [key: string]: unknown;
}

// --- INTERFACE RESPONSE ---
interface AIResponseData {
  recommendations?: Array<{ text: string, type: 'word' | 'phrase', translation: string }>;
  isCorrect?: boolean;
  feedback?: string;
  id?: string;
  [key: string]: unknown;
}

// --- 1. PROMPT FACTORY ---
const createPrompt = (feature: string, params: PromptParams): string => {
  switch (feature) {
    case 'batch_vocab_def':
      return `Translate these words to Indonesian: ${params.words?.join(", ")}. JSON Output: { "definitions": [{"word": "...", "meaning": "..."}] }`;

    case 'explain_vocab':
      return `Role: Teacher. Explain "${params.word}" for Indonesian students. JSON Output keys: word, meaning, context_usage, nuance_comparison, synonyms.`;

    case 'translate':
      return `Translate to Indonesian: "${params.text}" and explain grammar briefly.`;

    case 'grammar_question':
      return `Create 1 ${params.level} English grammar question. JSON Output keys: question, options (array), correctIndex, explanation.`;

    case 'evaluate_challenge':
      return `Rate user answer "${params.user}" for phrase "${params.phrase}" in context "${params.scenario}". JSON Output: score (1-10), feedback, improved_response.`;

    case 'generate_story':
      return `Write a short evocative English sentence (Romance/Horror/Life). JSON Output: sentence, translation.`;

    case 'evaluate_story':
      return `Compare user translation "${params.user}" with original "${params.orig}". JSON Output: score, feedback, improved_response.`;

    case 'survival_scenario':
      return `Create urgent scenario using word "${params.word}". JSON Output: word, situation.`;

    case 'evaluate_survival':
      return `Did user "${params.res}" solve scenario "${params.sit}" with word "${params.word}"? JSON Output: score, feedback, improved_response.`;

    case 'quick_def':
      return `Translate "${params.word}" to Indonesian (Context: "${params.context}"). Output ONLY the word.`;

    // Fitur: Analisis Story (Batch)
    case 'analyze_story_vocab':
      return `
        Analyze sentence: "${params.sentence}"
        Task: Extract useful vocab/phrases for an Indonesian Learner.
        Filter: Ignore basic words (I, the, a, is). Keep idioms/phrases together.
        Output JSON: { "recommendations": [{ "text": "...", "type": "word"|"phrase", "translation": "..." }] }
      `;

    // Fitur Baru: Evaluasi Jawaban Recall (Cerdas)
    case 'evaluate_recall':
      return `
        Role: Indonesian Language Teacher.
        Task: Check if student's answer implies the same meaning as the correct answer.
        
        Target Word: "${params.word}"
        Correct Meaning: "${params.correctAnswer}"
        Student Answer: "${params.userAnswer}"
        
        Rules:
        1. Accept synonyms (e.g. "melihat" = "memandang").
        2. Accept standard/non-standard spelling (e.g. "bernafas" = "bernapas").
        3. Accept minor typos if meaning is clear.
        4. Reject if meaning is different.
        
        Output JSON: 
        { 
          "isCorrect": boolean, 
          "feedback": "Short explanation in Indonesian (max 10 words)." 
        }
      `;

    default:
      throw new Error(`Unknown feature: ${feature}`);
  }
};

// --- 2. SCHEMA DEFINITIONS ---
const createSchema = (props: Record<string, Schema>, required: string[]): Schema => ({
  type: Type.OBJECT,
  properties: props,
  required: required,
});

const SCHEMAS: Record<string, Schema> = {
  batch_vocab_def: createSchema({
    definitions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          meaning: { type: Type.STRING }
        },
        required: ["word", "meaning"]
      }
    }
  }, ["definitions"]),

  explain_vocab: createSchema({
    word: { type: Type.STRING },
    meaning: { type: Type.STRING },
    context_usage: { type: Type.STRING },
    nuance_comparison: { type: Type.STRING },
    synonyms: { type: Type.ARRAY, items: { type: Type.STRING } }
  }, ["word", "meaning", "context_usage", "nuance_comparison", "synonyms"]),

  grammar_question: createSchema({
    id: { type: Type.STRING },
    question: { type: Type.STRING },
    options: { type: Type.ARRAY, items: { type: Type.STRING } },
    correctIndex: { type: Type.INTEGER },
    explanation: { type: Type.STRING }
  }, ["question", "options", "correctIndex", "explanation"]),

  evaluate_challenge: createSchema({
    score: { type: Type.NUMBER },
    feedback: { type: Type.STRING },
    improved_response: { type: Type.STRING }
  }, ["score", "feedback", "improved_response"]),

  generate_story: createSchema({
    sentence: { type: Type.STRING },
    translation: { type: Type.STRING }
  }, ["sentence", "translation"]),

  evaluate_story: createSchema({
    score: { type: Type.NUMBER },
    feedback: { type: Type.STRING },
    improved_response: { type: Type.STRING }
  }, ["score", "feedback", "improved_response"]),

  survival_scenario: createSchema({
    word: { type: Type.STRING },
    situation: { type: Type.STRING }
  }, ["word", "situation"]),

  evaluate_survival: createSchema({
    score: { type: Type.INTEGER },
    feedback: { type: Type.STRING },
    improved_response: { type: Type.STRING }
  }, ["score", "feedback", "improved_response"]),

  analyze_story_vocab: createSchema({
    recommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          type: { type: Type.STRING, enum: ["word", "phrase"] },
          translation: { type: Type.STRING }
        },
        required: ["text", "type", "translation"]
      }
    }
  }, ["recommendations"]),

  // Schema Baru untuk Recall
  evaluate_recall: createSchema({
    isCorrect: { type: Type.BOOLEAN },
    feedback: { type: Type.STRING }
  }, ["isCorrect", "feedback"]),
};

// --- 3. ROUTE HANDLER ---
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { feature, params } = body;

    if (!feature) return NextResponse.json({ error: "Feature required" }, { status: 400 });

    const prompt = createPrompt(feature, params);
    const schema = SCHEMAS[feature];

    // Menggunakan Model Stabil: gemini-1.5-flash
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash-lite', 
      contents: prompt,
      config: {
        responseMimeType: schema ? "application/json" : "text/plain",
        responseSchema: schema,
        temperature: 0.3,
      }
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    let data: unknown = text;

    if (schema) {
      try {
        const parsedData = JSON.parse(text) as AIResponseData;
        if (feature === 'grammar_question' && !parsedData.id) {
          parsedData.id = Date.now().toString();
        }
        data = parsedData;
      } catch (e) {
        console.error("JSON Parse Error:", text);
        return NextResponse.json({ error: "Invalid AI JSON output" }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      data,
      tokens: response.usageMetadata?.totalTokenCount || 0
    });

  } catch (error: unknown) {
    console.error("AI Controller Error:", error);
    
    let msg = "Unknown Error";
    let status = 500;

    if (error instanceof Error) {
      msg = error.message;
      if (msg.includes("503") || msg.includes("429") || msg.includes("Overloaded")) {
        msg = "AI sedang sibuk (Overloaded). Silakan coba lagi nanti.";
        status = 503;
      }
    }
    
    return NextResponse.json({ error: msg }, { status });
  }
}