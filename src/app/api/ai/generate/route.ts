import { GoogleGenAI, Schema, Type } from "@google/genai";
import { NextResponse } from "next/server";

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// --- 1. DEFINISI TIPE KETAT (NO ANY) ---

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
  correctAnswer?: string;
  userAnswer?: string;
}

interface PromptHandler {
  generate: (params: PromptParams) => string;
  schema?: Schema;
}

// --- 2. SCHEMA DEFINITIONS ---
const createSchema = (props: Record<string, Schema>, required: string[]): Schema => ({
  type: Type.OBJECT,
  properties: props,
  required: required,
});

const SCHEMA_DEFS = {
  batchVocab: createSchema({
    definitions: { 
      type: Type.ARRAY, 
      items: { 
        type: Type.OBJECT, 
        properties: { word: { type: Type.STRING }, meaning: { type: Type.STRING } }, 
        required: ["word", "meaning"] 
      } 
    }
  }, ["definitions"]),

  explainVocab: createSchema({
    word: { type: Type.STRING },
    meaning: { type: Type.STRING },
    context_usage: { type: Type.STRING },
    nuance_comparison: { type: Type.STRING },
    synonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
    isTypo: { type: Type.BOOLEAN },
    isMisconception: { type: Type.BOOLEAN },
    misconceptionRule: { type: Type.STRING },
  }, ["word", "meaning", "context_usage", "nuance_comparison", "synonyms"]),

  grammarCheck: createSchema({
    correctedSentence: { type: Type.STRING },
    generalFeedback: { type: Type.STRING },
    errors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          original: { type: Type.STRING },
          correction: { type: Type.STRING },
          type: { type: Type.STRING, enum: ["Spelling", "Grammar", "Tense", "Punctuation", "Word Order"] },
          explanation: { type: Type.STRING }
        },
        required: ["original", "correction", "type", "explanation"]
      }
    }
  }, ["correctedSentence", "errors", "generalFeedback"]),

  grammarQuestion: createSchema({
    id: { type: Type.STRING }, 
    question: { type: Type.STRING }, 
    options: { type: Type.ARRAY, items: { type: Type.STRING } }, 
    correctIndex: { type: Type.INTEGER }, 
    explanation: { type: Type.STRING }
  }, ["question", "options", "correctIndex", "explanation"]),

  evaluateResponse: createSchema({ 
    score: { type: Type.NUMBER }, 
    feedback: { type: Type.STRING }, 
    improved_response: { type: Type.STRING } 
  }, ["score", "feedback", "improved_response"]),

  story: createSchema({ 
    sentence: { type: Type.STRING }, 
    translation: { type: Type.STRING } 
  }, ["sentence", "translation"]),

  analyzeStory: createSchema({
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

  recall: createSchema({ 
    isCorrect: { type: Type.BOOLEAN }, 
    feedback: { type: Type.STRING } 
  }, ["isCorrect", "feedback"]),
  
  quickDef: createSchema({
    translation: { type: Type.STRING }
  }, ["translation"]),
};

// --- 3. PROMPT HANDLERS ---
const PROMPT_HANDLERS: Record<string, PromptHandler> = {
  batch_vocab_def: {
    schema: SCHEMA_DEFS.batchVocab,
    generate: (p) => `Translate to Indonesian: ${p.words?.join(", ") ?? ""}. JSON Output.`
  },

  // --- FITUR DICTIONARY (Kata/Frasa) ---
  explain_vocab: {
    schema: SCHEMA_DEFS.explainVocab,
    generate: (p) => `
      Role: Smart Dictionary & Grammar Guide.
      Input: "${p.word}"
      
      TASK: Analyze the input (Word/Phrase/Idiom).
      
      LOGIC FLOW:
      1. CHECK TYPO (e.g. "enopugh" -> "enough"): If spelling is wrong, Set "isTypo": true.
      2. CHECK MISCONCEPTION (e.g. "buyed"): If grammar form is wrong (e.g. irregular verb error), Set "isMisconception": true, "misconceptionRule": Explain why in Indonesian.
      3. CHECK INVALID: If Indonesian -> "INVALID_SCOPE".
      
      OUTPUT JSON:
      - "word": The Correct English Word.
      - "meaning": Meaning in INDONESIAN.
      - "context_usage": "English Example. (Terjemahan Indonesia)" <--- Format Wajib.
      - "nuance_comparison": Explanation in INDONESIAN.
      - "synonyms": English synonyms (Array).
      - "isTypo": boolean.
      - "isMisconception": boolean.
      - "misconceptionRule": string.
    `
  },

  // --- FITUR GRAMMAR CHECK (Kalimat) - DIPERBAIKI ---
  grammar_check: {
    schema: SCHEMA_DEFS.grammarCheck,
    generate: (p) => `
      Role: Expert English Grammar Teacher.
      Task: Analyze the sentence "${p.sentence}" and provide a FULL SENTENCE CORRECTION.
      
      REQUIREMENTS:
      1. Identify Subject-Verb Agreement, Tense, and Preposition errors.
      2. "correctedSentence": MUST be the complete, grammatically correct sentence (e.g. "I bought a laptop yesterday").
      3. "generalFeedback": Encouraging summary in Indonesian.
      4. "errors": Array of specific errors with Indonesian explanation.
      
      Output JSON.
    `
  },

  // --- FITUR STORY LAB (Rekomendasi) ---
  analyze_story_vocab: {
    schema: SCHEMA_DEFS.analyzeStory,
    generate: (p) => `
      Analyze Sentence: "${p.sentence}"
      Target: Indonesian Learner.
      Task: Extract 3-5 difficult words OR idioms.
      Output JSON: recommendations[{ text, type="word"|"phrase", translation (Indonesian) }].
    `
  },

  // --- FITUR FLASH CARD (Contextual) ---
  quick_def: {
    schema: SCHEMA_DEFS.quickDef,
    generate: (p) => `
      Role: Contextual Translator.
      Input: "${p.word}"
      Context: "${p.context}"
      TASK: Translate Input to INDONESIAN based on Context.
      RULE: If Input is a METAPHOR/IDIOM, translate the MEANING (Kiasan).
      Output JSON: { "translation": "..." } only.
    `
  },

  // --- FITUR STORY EVALUATION ---
  evaluate_story: {
    schema: SCHEMA_DEFS.evaluateResponse,
    generate: (p) => `
      Role: Literary Translator.
      Rate translation "${p.user}" vs Original "${p.orig}".
      Output JSON: score (0-10), feedback (Indo), improved_response (Natural Indo Translation).
    `
  },

  // --- FITUR LAINNYA (Tetap Sama) ---
  grammar_question: {
    schema: SCHEMA_DEFS.grammarQuestion,
    generate: (p) => `Create ${p.level} English grammar question. Output JSON.`
  },

  evaluate_survival: {
    schema: SCHEMA_DEFS.evaluateResponse,
    generate: (p) => `Did "${p.res}" solve "${p.sit}" using "${p.word}"? Output JSON.`
  },

  survival_scenario: {
    schema: createSchema({ word: { type: Type.STRING }, situation: { type: Type.STRING } }, ["word", "situation"]),
    generate: (p) => `Create scenario for "${p.word}". Output JSON: word, situation.`
  },

  evaluate_recall: {
    schema: SCHEMA_DEFS.recall,
    generate: (p) => `Check meaning match. Target: "${p.word}" (${p.correctAnswer}). User: "${p.userAnswer}". Rules: Accept synonyms/typos. Output JSON: isCorrect, feedback.`
  },

  evaluate_challenge: {
    schema: SCHEMA_DEFS.evaluateResponse,
    generate: (p) => `Rate "${p.user}" vs "${p.phrase}" in "${p.scenario}". Output JSON.`
  },

  generate_story: {
    schema: SCHEMA_DEFS.story,
    generate: () => `Write short evocative English sentence. Output JSON: sentence, translation.`
  }
};

// --- MAIN HANDLER ---
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { feature, params } = body;

    const handler = PROMPT_HANDLERS[feature];

    if (!handler) {
      return NextResponse.json({ error: `Feature '${feature}' not found` }, { status: 400 });
    }

    const prompt = handler.generate(params);
    const schema = handler.schema;

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
        const parsedData = JSON.parse(text);
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
    let msg = "Unknown Server Error";
    let status = 500;
    if (error instanceof Error) {
      msg = error.message;
      if (msg.includes("503") || msg.includes("429") || msg.includes("Overloaded")) {
        msg = "AI Busy. Try later.";
        status = 503;
      }
    }
    return NextResponse.json({ error: msg }, { status });
  }
}