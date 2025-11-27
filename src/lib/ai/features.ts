import { Schema, Type } from "@google/genai";
import { z } from "zod";

// --- HELPER: Schema Builder ---
const createSchema = (props: Record<string, Schema>, required: string[]): Schema => ({
  type: Type.OBJECT,
  properties: props,
  required: required,
});

// --- 1. OUTPUT SCHEMAS (Google GenAI) ---
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
    word: { type: Type.STRING, description: "The corrected English word (if typo/misconception) or original word." },
    meaning: { type: Type.STRING, description: "Indonesian definition of the CORRECTED word." },
    context_usage: { type: Type.STRING, description: "Example sentence using the CORRECTED word (EN) + translation (ID)." },
    nuance_comparison: { type: Type.STRING, description: "Explanation of nuance/detail in Indonesian." },
    synonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
    isTypo: { type: Type.BOOLEAN },
    isMisconception: { type: Type.BOOLEAN },
    errorAnalysis: { 
      type: Type.STRING, 
      description: "A concise explanation in INDONESIAN about WHY it is wrong (grammar concept or typo confirmation). Do NOT repeat meaning or examples here." 
    },
    originalInput: { type: Type.STRING },
    category: { type: Type.STRING, enum: ["Literal", "Idiom", "Metaphor", "Proverb", "Slang"] },
    literal_meaning: { type: Type.STRING, description: "Literal translation (Indo)." },
    figurative_meaning: { type: Type.STRING, description: "Figurative/Actual meaning (Indo)." },
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

// --- 2. INPUT VALIDATION SCHEMAS (Zod) ---
export const FeatureRequestSchema = z.discriminatedUnion("feature", [
  z.object({ feature: z.literal("batch_vocab_def"), params: z.object({ words: z.array(z.string()) }) }),
  z.object({ feature: z.literal("translate"), params: z.object({ text: z.string() }) }),
  z.object({ feature: z.literal("explain_vocab"), params: z.object({ word: z.string() }) }),
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

// --- 3. PROMPT REGISTRY ---
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
    prompt: `Role: Smart Dictionary & Grammar Guide. Input: "${p.word}".
             
             PHASE 1: VALIDATION
             - If not English/Latin, word="INVALID_SCOPE".

             PHASE 2: ERROR ANALYSIS (Priority)
             1. CHECK MISCONCEPTION (e.g. "buyed", "thinked"):
                - IF TRUE: 
                  set isMisconception=true.
                  word = [Correct Form].
                  errorAnalysis = "Explain ONLY the grammar concept violated in Indonesian. (e.g., 'Kata kerja ini termasuk irregular verb, sehingga bentuk lampaunya berubah menjadi [word], bukan ditambah akhiran -ed'). Keep it concise."

             2. CHECK TYPO (e.g. "thnik", "helo"):
                - IF TRUE (and NOT Misconception):
                  set isTypo=true.
                  word = [Corrected Word].
                  errorAnalysis = "Terdeteksi kesalahan penulisan, kata telah diperbaiki otomatis ke bentuk yang baku."

             PHASE 3: CONTENT GENERATION (Based on CORRECTED word)
             - meaning: Indonesian definition.
             - context_usage: English sentence + Indo translation.
             - nuance_comparison: Usage nuance explanation in Indonesian.
             - synonyms: List of synonyms.
             - category: Detect "Literal", "Idiom", "Metaphor", "Proverb", or "Slang".
             - If Idiom/Metaphor: fill literal_meaning & figurative_meaning.`,
    schema: AI_OUTPUT_SCHEMAS.explainVocab
  }),

  // 🔥 UPDATE 1: CONTEXTUAL DEFINITION (Balanced) 🔥
  quick_def: (p) => ({
    prompt: `Role: Contextual Translator.
             Task: Translate the term '${p.word}' into Indonesian based on this specific context: '${p.context}'.
             
             TRANSLATION RULES:
             1. **Idioms/Phrasal Verbs** (e.g. 'break a leg'): Give the NATURAL idiomatic meaning (e.g. 'semoga sukses').
             2. **Poetic Metaphors** (e.g. 'tasting like truth'): Translate the IMAGERY poetically (e.g. 'terasa bagaikan kebenaran').
             3. **Literal/Common Words** (e.g. 'table', 'run' in literal sense): Translate DIRECTLY and CONTEXTUALLY (e.g. 'meja', 'lari'). Do NOT over-explain or metaphorize if it's literal.
             
             Return ONLY the translation text in JSON.`,
    schema: AI_OUTPUT_SCHEMAS.simpleTranslation
  }),

  grammar_check: (p) => ({
    prompt: `Role: Expert Grammar Teacher. Fix: "${p.sentence}".
             1. "correctedSentence": MUST be corrected ENGLISH sentence.
             2. "generalFeedback": Feedback in INDONESIAN.
             3. "errors": Explanation in INDONESIAN.`,
    schema: AI_OUTPUT_SCHEMAS.grammarCheck
  }),
  grammar_question: (p) => ({
    prompt: `Create a ${p.level} English grammar question.`,
    schema: AI_OUTPUT_SCHEMAS.grammarQuestion
  }),
  evaluate_challenge: (p) => ({
    prompt: `Scenario: ${p.scenario}. Target: ${p.phrase}. User: "${p.user}". Rate & correct.`,
    schema: AI_OUTPUT_SCHEMAS.evaluation
  }),
  generate_story: () => ({
    prompt: `Write short, evocative English sentence.`,
    schema: AI_OUTPUT_SCHEMAS.story
  }),
  evaluate_story: (p) => ({
    prompt: `Original: "${p.orig}". User: "${p.user}". Rate 0-10 & feedback in Indo.`,
    schema: AI_OUTPUT_SCHEMAS.evaluation
  }),

  // 🔥 UPDATE 2: SMART BATCH ANALYSIS (Balanced) 🔥
  analyze_story_vocab: (p) => ({
    prompt: `Analyze Sentence: "${p.sentence}"
             Task: Identify 3-5 most important vocabulary items (difficult words OR idioms) for an Indonesian learner.
             
             TRANSLATION STRATEGY:
             - **For Idioms/Metaphors**: Use the FIGURATIVE/POETIC meaning as used in the context.
             - **For Single/Literal Words**: Use the PRECISE contextual meaning (e.g., "bank" of a river -> "tepian", not "bank uang").
             
             Output JSON: recommendations[{ text, type="word"|"phrase", translation }].`,
    schema: AI_OUTPUT_SCHEMAS.storyAnalysis
  }),

  evaluate_recall: (p) => ({
    prompt: `Target: ${p.word} (${p.correctAnswer}). User: "${p.userAnswer}". Correct? Feedback in Indo.`,
    schema: AI_OUTPUT_SCHEMAS.recall
  }),
  survival_scenario: (p) => ({
    prompt: `Create survival situation using "${p.word}".`,
    schema: AI_OUTPUT_SCHEMAS.survivalScenario
  }),
  evaluate_survival: (p) => ({
    prompt: `Sit: ${p.sit}. Word: ${p.word}. Action: "${p.res}". Succeed? Rate logic & grammar.`,
    schema: AI_OUTPUT_SCHEMAS.evaluation
  }),
};