import { GoogleGenAI, Schema, Type } from "@google/genai";
import { NextResponse } from "next/server";

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// --- INTERFACES ---
interface PromptParams {
  words?: string[]; // Parameter array untuk batching
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
  [key: string]: unknown;
}

// Interface untuk hasil parsing JSON yang dinamis namun type-safe
interface AIResponseData {
  id?: string;
  definitions?: Array<{word: string, meaning: string}>; // Struktur respon batch
  [key: string]: unknown;
}

// --- 1. PROMPT FACTORY ---
const createPrompt = (feature: string, params: PromptParams) => {
  switch (feature) {
    // 🟢 CASE BARU: BATCH VOCAB
    case 'batch_vocab_def':
      return `
        Task: Translate the following English words to Indonesian (short & clear meaning).
        Words: ${params.words?.join(", ")}
        
        OUTPUT RULES (JSON):
        Return an array of objects under "definitions" key.
        Example: { "definitions": [{"word": "Run", "meaning": "Berlari"}, {"word": "Eat", "meaning": "Makan"}] }
      `;

    case 'explain_vocab':
      return `
        Role: English Teacher for Indonesian Students.
        Target Word: "${params.word}"
        
        TASK:
        1. Check if "${params.word}" is a valid English word. If NOT, return word="INVALID_SCOPE".
        2. If VALID, provide explanation targeting Indonesian learners.
        
        OUTPUT RULES (JSON):
        - "word": The English word.
        - "meaning": Definisi dalam BAHASA INDONESIA.
        - "context_usage": English sentence + (Terjemahan Indonesia).
        - "nuance_comparison": Penjelasan nuansa/kegunaan dalam BAHASA INDONESIA.
        - "synonyms": Array string.
      `;

    case 'translate':
      return `
        Translate this text to Indonesian naturally: "${params.text}".
        Also provide a brief grammatical explanation in Indonesian.
      `;

    case 'grammar_question':
      return `
        Generate a multiple-choice English grammar question.
        Level: ${params.level} (beginner/intermediate).
        Target Audience: Indonesian students.
        
        OUTPUT RULES (JSON):
        - "question": The question sentence with a blank (___).
        - "options": Array of 4 possible answers.
        - "correctIndex": Index of the correct answer (0-3).
        - "explanation": Penjelasan kenapa jawaban itu benar dalam BAHASA INDONESIA.
      `;

    case 'evaluate_challenge':
      return `
        Role: English Tutor.
        Context: "${params.scenario}"
        Target Phrase to mimic: "${params.phrase}"
        User Answer: "${params.user}"
        
        TASK: Evaluate accuracy and similarity.
        OUTPUT RULES (JSON):
        - "score": 1-10 integer.
        - "feedback": Saran perbaikan ramah dalam BAHASA INDONESIA.
        - "improved_response": Contoh jawaban yang lebih natural dalam Bahasa Inggris.
      `;

    case 'generate_story':
      return `
        Generate a short, evocative English sentence for a language learner.
        Genre: Random (Romance/Horror/Sci-Fi/Slice of Life).
        
        OUTPUT RULES (JSON):
        - "sentence": The English sentence.
        - "translation": Terjemahan natural dalam BAHASA INDONESIA.
      `;

    case 'evaluate_story':
      return `
        Original English: "${params.orig}"
        User Translation: "${params.user}"
        
        TASK: Rate the translation accuracy.
        OUTPUT RULES (JSON):
        - "score": 1-10 integer.
        - "feedback": Koreksi detail (mana yang salah/kurang tepat) dalam BAHASA INDONESIA.
        - "improved_response": Terjemahan Bahasa Indonesia yang seharusnya (Kunci Jawaban).
      `;

    case 'survival_scenario':
      return `
        Create a high-stakes or urgent scenario where the user MUST use the word "${params.word}".
        
        OUTPUT RULES (JSON):
        - "word": "${params.word}"
        - "situation": Deskripsi situasi darurat/penting dalam BAHASA INGGRIS (misal: "You are lost in an airport and need to find...").
      `;

    case 'evaluate_survival':
      return `
        Scenario: "${params.sit}"
        Target Word: "${params.word}"
        User Response: "${params.res}"
        
        TASK: Did the user solve the problem using the word correctly?
        OUTPUT RULES (JSON):
        - "score": 1-10. (Give <5 if target word is missing/wrong context).
        - "feedback": Evaluasi keberhasilan misi dalam BAHASA INDONESIA.
        - "improved_response": Contoh kalimat solusi terbaik dalam Bahasa Inggris.
      `;

    case 'quick_def':
      return `
        Task: Translate "${params.word}" to Indonesian based on context: "${params.context}".
        Output ONLY the Indonesian word(s). No explanation.
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
  // 🟢 SCHEMA BARU: Batch Definition
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
};

// --- 3. ROUTE HANDLER ---
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { feature, params } = body;

    if (!feature) return NextResponse.json({ error: "Feature required" }, { status: 400 });

    const prompt = createPrompt(feature, params);
    const schema = SCHEMAS[feature];

    const response = await client.models.generateContent({
      // 🟢 MODEL UPDATE: Menggunakan model Flash Lite 2.5 sesuai permintaan
      model: 'gemini-2.5-flash-lite', 
      contents: prompt,
      config: {
        responseMimeType: schema ? "application/json" : "text/plain",
        responseSchema: schema,
      }
    });

    // Fix: Ambil text secara manual dari struktur candidates
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    
    let data: unknown = text; // Defaultnya string/raw text

    if (schema) {
      try {
        // Parsing JSON dengan aman
        const parsedData = JSON.parse(text) as AIResponseData;
        
        if (feature === 'grammar_question' && !parsedData.id) {
          parsedData.id = Date.now().toString();
        }
        
        data = parsedData;
      } catch (e: unknown) {
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
    
    const errorMessage = error instanceof Error ? error.message : "Unknown Server Error";
    
    // Handle 429 khusus untuk memberi info lebih jelas di frontend
    if (errorMessage.includes("429")) {
      return NextResponse.json({ error: "Quota Exceeded. Try again in a minute." }, { status: 429 });
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}