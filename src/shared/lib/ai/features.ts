import { z } from "zod";
import {
  buildBatchVocabPrompt,
  buildTranslatePrompt,
  buildExplainVocabPrompt,
  buildQuickDefPrompt,
  buildGrammarCheckPrompt,
  buildGrammarQuestionPrompt,
  buildEvaluateChallengePrompt,
  buildGenerateStoryPrompt,
  buildEvaluateStoryPrompt,
  buildAnalyzeStoryVocabPrompt,
  buildEvaluateRecallPrompt,
  buildSurvivalScenarioPrompt,
  buildEvaluateSurvivalPrompt,
  type PromptConfig,
  type PromptResult,
} from "./prompt-registry";

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
) => { prompt: string; schema?: Schema; config?: PromptConfig };

export const FEATURE_PROMPTS: { [K in FeatureRequest['feature']]: PromptHandler<K> } = {
  batch_vocab_def: (p) => {
    const result = buildBatchVocabPrompt(p.words);
    return { prompt: result.prompt, schema: AI_OUTPUT_SCHEMAS.batchVocab, config: result.config };
  },
  translate: (p) => {
    const result = buildTranslatePrompt(p.text);
    return { prompt: result.prompt, schema: undefined, config: result.config };
  },
  explain_vocab: (p) => {
    const result = buildExplainVocabPrompt(p.word, p.mode);
    return { prompt: result.prompt, schema: AI_OUTPUT_SCHEMAS.explainVocab, config: result.config };
  },
  quick_def: (p) => {
    const result = buildQuickDefPrompt(p.word, p.context);
    return { prompt: result.prompt, schema: AI_OUTPUT_SCHEMAS.simpleTranslation, config: result.config };
  },
  grammar_check: (p) => {
    const result = buildGrammarCheckPrompt(p.sentence);
    return { prompt: result.prompt, schema: AI_OUTPUT_SCHEMAS.grammarCheck, config: result.config };
  },
  grammar_question: (p) => {
    const result = buildGrammarQuestionPrompt(p.level);
    return { prompt: result.prompt, schema: AI_OUTPUT_SCHEMAS.grammarQuestion, config: result.config };
  },
  evaluate_challenge: (p) => {
    const result = buildEvaluateChallengePrompt(p.scenario, p.phrase, p.user);
    return { prompt: result.prompt, schema: AI_OUTPUT_SCHEMAS.evaluation, config: result.config };
  },
  generate_story: () => {
    const result = buildGenerateStoryPrompt();
    return { prompt: result.prompt, schema: AI_OUTPUT_SCHEMAS.story, config: result.config };
  },
  evaluate_story: (p) => {
    const result = buildEvaluateStoryPrompt(p.orig, p.user);
    return { prompt: result.prompt, schema: AI_OUTPUT_SCHEMAS.evaluation, config: result.config };
  },
  analyze_story_vocab: (p) => {
    const result = buildAnalyzeStoryVocabPrompt(p.sentence);
    return { prompt: result.prompt, schema: AI_OUTPUT_SCHEMAS.storyAnalysis, config: result.config };
  },
  evaluate_recall: (p) => {
    const result = buildEvaluateRecallPrompt(p.word, p.correctAnswer, p.userAnswer);
    return { prompt: result.prompt, schema: AI_OUTPUT_SCHEMAS.recall, config: result.config };
  },
  survival_scenario: (p) => {
    const result = buildSurvivalScenarioPrompt(p.word);
    return { prompt: result.prompt, schema: AI_OUTPUT_SCHEMAS.survivalScenario, config: result.config };
  },
  evaluate_survival: (p) => {
    const result = buildEvaluateSurvivalPrompt(p.sit, p.word, p.res);
    return { prompt: result.prompt, schema: AI_OUTPUT_SCHEMAS.evaluation, config: result.config };
  },
};

// Re-export prompt registry types and utilities for external use
export type { PromptConfig, PromptResult };
export {
  AI_MODELS,
  DEFAULT_MODEL,
  DEFAULT_TEMPERATURE,
  PROMPT_BUILDERS,
} from "./prompt-registry";