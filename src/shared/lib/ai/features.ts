import { z } from "zod";

export enum Type {
  OBJECT = "object",
  STRING = "string",
  ARRAY = "array",
  NUMBER = "number",
  INTEGER = "integer",
  BOOLEAN = "boolean"
}

export interface Schema {
  type: Type;
  properties?: Record<string, Schema>;
  required?: string[];
  items?: Schema;
  enum?: string[];
  description?: string;
}

// --- HELPER: Schema Builder ---
const createSchema = (props: Record<string, Schema>, required: string[]): Schema => ({
  type: Type.OBJECT,
  properties: props,
  required: required,
});

// --- 2. OUTPUT SCHEMAS ---
// Struktur ini sama persis dengan sebelumnya, hanya menggunakan tipe lokal di atas.
export const AI_OUTPUT_SCHEMAS = {
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
    word: { type: Type.STRING, description: "The English Target Word." },
    correctedSource: { type: Type.STRING, description: "The corrected source word." }, 
    meaning: { type: Type.STRING, description: "Indonesian definition." },
    context_usage: { type: Type.STRING, description: "Example sentence." },
    nuance_comparison: { type: Type.STRING, description: "Explanation of nuance." },
    synonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
    isTypo: { type: Type.BOOLEAN },
    isMisconception: { type: Type.BOOLEAN },
    errorAnalysis: { type: Type.STRING },
    originalInput: { type: Type.STRING },
    category: { type: Type.STRING, enum: ["Literal", "Idiom", "Metaphor", "Proverb", "Slang"] },
    literal_meaning: { type: Type.STRING },
    figurative_meaning: { type: Type.STRING },
  }, ["word", "meaning", "context_usage", "category", "nuance_comparison", "synonyms", "isTypo", "isMisconception", "errorAnalysis"]),

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

  evaluation: createSchema({ 
    score: { type: Type.NUMBER }, 
    feedback: { type: Type.STRING }, 
    improved_response: { type: Type.STRING } 
  }, ["score", "feedback", "improved_response"]),

  story: createSchema({ 
    sentence: { type: Type.STRING }, 
    translation: { type: Type.STRING } 
  }, ["sentence", "translation"]),

  storyAnalysis: createSchema({
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
  
  simpleTranslation: createSchema({
    translation: { type: Type.STRING }
  }, ["translation"]),

  survivalScenario: createSchema({ 
    word: { type: Type.STRING }, 
    situation: { type: Type.STRING } 
  }, ["word", "situation"]),
};

// --- 3. INPUT VALIDATION SCHEMAS (Zod) ---
// Bagian ini tidak berubah dari kode original
export const FeatureRequestSchema = z.discriminatedUnion("feature", [
  z.object({ feature: z.literal("batch_vocab_def"), params: z.object({ words: z.array(z.string()) }) }),
  z.object({ feature: z.literal("translate"), params: z.object({ text: z.string() }) }),
  z.object({ feature: z.literal("explain_vocab"), params: z.object({ word: z.string(), mode: z.enum(['EN-ID', 'ID-EN']).optional().default('EN-ID') }) }),
  z.object({ feature: z.literal("quick_def"), params: z.object({ word: z.string(), context: z.string() }) }),
  z.object({ feature: z.literal("grammar_check"), params: z.object({ sentence: z.string() }) }),
  z.object({ feature: z.literal("grammar_question"), params: z.object({ level: z.enum(["beginner", "intermediate"]) }) }),
  z.object({ feature: z.literal("evaluate_challenge"), params: z.object({ scenario: z.string(), phrase: z.string(), user: z.string() }) }),
  z.object({ feature: z.literal("generate_story"), params: z.object({}) }),
  z.object({ feature: z.literal("evaluate_story"), params: z.object({ orig: z.string(), user: z.string() }) }),
  z.object({ feature: z.literal("analyze_story_vocab"), params: z.object({ sentence: z.string() }) }),
  z.object({ feature: z.literal("evaluate_recall"), params: z.object({ word: z.string(), correctAnswer: z.string(), userAnswer: z.string() }) }),
  z.object({ feature: z.literal("survival_scenario"), params: z.object({ word: z.string() }) }),
  z.object({ feature: z.literal("evaluate_survival"), params: z.object({ sit: z.string(), word: z.string(), res: z.string() }) }),
]);

export type FeatureRequest = z.infer<typeof FeatureRequestSchema>;

// --- 4. PROMPT REGISTRY ---
type PromptHandler<T extends FeatureRequest['feature']> = (
  params: Extract<FeatureRequest, { feature: T }>['params']
) => { prompt: string; schema?: Schema };

export const FEATURE_PROMPTS: { [K in FeatureRequest['feature']]: PromptHandler<K> } = {
  batch_vocab_def: (p) => ({
    prompt: `Translate to Indonesian: ${p.words.join(", ")}. Return JSON.`,
    schema: AI_OUTPUT_SCHEMAS.batchVocab
  }),
  translate: (p) => ({
    prompt: `Translate to Indonesian. Explain grammar/vocab if complex. Text: "${p.text}"`,
    schema: undefined
  }),
  explain_vocab: (p) => ({
    prompt: `Role: Smart Bilingual Dictionary (Indonesian <-> English).
             Current Mode: ${p.mode}. 
             Input Word: "${p.word}".

             ⚠️ STRICT LANGUAGE ENFORCEMENT ⚠️
             
             ${p.mode === 'EN-ID' 
               ? `
                  **RULE FOR EN-ID MODE (English Input -> Indonesian Output)**
                  1. CHECK LANGUAGE: Is "${p.word}" an English word? 
                     - Note: Ignore minor typos (e.g., "thnik" is English).
                     - CRITICAL: If the word is clearly INDONESIAN (e.g., "Rehat", "Makan", "Lari"), you MUST REJECT it.
                  2. ACTION:
                     - If INDONESIAN: Set word="INVALID_SCOPE". (User should switch to ID-EN mode).
                     - If ENGLISH (or English typo): Proceed to explain it in Indonesian.
               `
               : `
                  **RULE FOR ID-EN MODE (Indonesian Input -> English Output)**
                  1. CHECK LANGUAGE: Is "${p.word}" an Indonesian word?
                     - Note: Ignore minor typos (e.g., "jatuhh" is Indonesian).
                     - CRITICAL: If the word is clearly ENGLISH (e.g., "Eat", "Sleep", "Run"), you MUST REJECT it.
                  2. ACTION:
                     - If ENGLISH: Set word="INVALID_SCOPE". (User should switch to EN-ID mode).
                     - If INDONESIAN (or Indonesian typo): Proceed to translate and explain.
               `
             }

             --- IF PASSED LANGUAGE CHECK, PROCEED BELOW ---
             ${p.mode === 'ID-EN' 
               ? `TASK (Indonesian -> English):
                  1. Check for Typos (e.g. "jatuhh" -> "jatuh").
                  2. Translate to best English word.
                  3. JSON output.`
               : `TASK (English -> Indonesian):
                  1. Check English typos.
                  2. Explain in Indonesian.`
             }
             `,
    schema: AI_OUTPUT_SCHEMAS.explainVocab
  }),
  quick_def: (p) => ({
    prompt: `Translate '${p.word}' to Indonesian in context: '${p.context}'. Return JSON { translation: "..." }.`,
    schema: AI_OUTPUT_SCHEMAS.simpleTranslation
  }),
  grammar_check: (p) => ({
    prompt: `Fix grammar: "${p.sentence}". Return JSON with correctedSentence, errors[], generalFeedback.`,
    schema: AI_OUTPUT_SCHEMAS.grammarCheck
  }),
  grammar_question: (p) => ({
    prompt: `Create a ${p.level} English grammar question (multiple choice). Return JSON.`,
    schema: AI_OUTPUT_SCHEMAS.grammarQuestion
  }),
  evaluate_challenge: (p) => ({
    prompt: `Scenario: ${p.scenario}. Target: ${p.phrase}. User: "${p.user}". Rate & correct. Return JSON.`,
    schema: AI_OUTPUT_SCHEMAS.evaluation
  }),
  generate_story: () => ({
    prompt: `Write short, evocative English sentence. Return JSON { sentence: "...", translation: "..." }.`,
    schema: AI_OUTPUT_SCHEMAS.story
  }),
  evaluate_story: (p) => ({
    prompt: `Original: "${p.orig}". User: "${p.user}". Rate 0-10. Return JSON.`,
    schema: AI_OUTPUT_SCHEMAS.evaluation
  }),
  analyze_story_vocab: (p) => ({
    prompt: `Analyze Sentence: "${p.sentence}". Identify 3-5 difficult words/idioms. Return JSON.`,
    schema: AI_OUTPUT_SCHEMAS.storyAnalysis
  }),
  evaluate_recall: (p) => ({
    prompt: `Target: ${p.word} (${p.correctAnswer}). User: "${p.userAnswer}". Correct? Return JSON.`,
    schema: AI_OUTPUT_SCHEMAS.recall
  }),
  survival_scenario: (p) => ({
    prompt: `Create survival situation using "${p.word}". Return JSON.`,
    schema: AI_OUTPUT_SCHEMAS.survivalScenario
  }),
  evaluate_survival: (p) => ({
    prompt: `Sit: ${p.sit}. Word: ${p.word}. Action: "${p.res}". Succeed? Return JSON.`,
    schema: AI_OUTPUT_SCHEMAS.evaluation
  }),
};