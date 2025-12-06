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
    word: { type: Type.STRING, description: "The English Target Word." },
    correctedSource: { type: Type.STRING, description: "The corrected source word (Indonesian) if typo/misconception detected in ID-EN mode. Example: 'Jatuh' if input was 'Jatuhh'." }, 
    meaning: { type: Type.STRING, description: "Indonesian definition of the English word." },
    context_usage: { type: Type.STRING, description: "Example sentence using the English word + translation (ID)." },
    nuance_comparison: { type: Type.STRING, description: "Explanation of nuance/detail in Indonesian." },
    synonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
    isTypo: { type: Type.BOOLEAN },
    isMisconception: { type: Type.BOOLEAN },
    errorAnalysis: { 
      type: Type.STRING, 
      description: "A concise explanation in INDONESIAN about WHY it is wrong. If ID-EN mode, explain the Indonesian misconception/typo (e.g. 'jatuhh' -> 'jatuh'). If EN-ID mode, explain the English grammar mistake." 
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
  
  // UPDATED: Added 'mode' parameter for bidirectional dictionary
  z.object({ 
    feature: z.literal("explain_vocab"), 
    params: z.object({ 
      word: z.string(),
      mode: z.enum(['EN-ID', 'ID-EN']).optional().default('EN-ID') 
    }) 
  }),

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
  
  // 🔥 UPDATED LOGIC: STRICT LANGUAGE VALIDATION 🔥
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
                  1. ANALYZE INPUT (Indonesian):
                     - Check for TYPOS (e.g. "jatuhh" -> meant "jatuh").
                     - Check for MISCONCEPTIONS.
                     
                     - IF TYPO DETECTED: 
                       - Set isTypo = true.
                       - Set correctedSource = [The Correct INDONESIAN Word] (e.g. "jatuh").
                       - Set errorAnalysis = "Terdeteksi kesalahan penulisan (typo) dari kata bahasa Indonesia '${p.word}'. Kata dikoreksi menjadi '[Corrected]'."
                  
                  2. TRANSLATE: 
                     - Translate the *corrected* Indonesian word to the BEST English Target Word.
                     - e.g. "jatuh" -> "Fall".
                  
                  3. GENERATE JSON:
                     - Set word = English Target Word ("Fall").`
               
               : `TASK (English -> Indonesian):
                  1. Check English typos/grammar (e.g. "buyed" -> "bought").
                  2. Set word = Corrected English Word.
                  3. Explain in Indonesian.`
             }

             OUTPUT JSON RULES:
             - **word**: The English Target Word (e.g. "Fall").
             - **correctedSource**: The corrected INDONESIAN word (e.g. "Kenyang"). ONLY used if isTypo/isMisconception is true in ID-EN mode.
             - **originalInput**: Return "${p.word}".
             - **meaning**: Indonesian definition of the English word ("Penyelamat", "Kenyang", etc).
             - **context_usage**: English sentence + Indo translation.
             - **nuance_comparison**: Explanation in Indonesian.
             - **synonyms**: English synonyms.
             - **category**: "Literal", "Idiom", etc.
             `,
    schema: AI_OUTPUT_SCHEMAS.explainVocab
  }),

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