/**
 * AI Prompt Registry
 * 
 * Centralized registry for AI prompt configurations.
 * Separates prompt logic from feature schemas for better modularity.
 */

// ============================================
// INTERFACES
// ============================================

/**
 * Configuration for an AI prompt request
 */
export interface PromptConfig {
    /** System-level instructions defining AI role and rules */
    systemPrompt: string;
    /** Dynamic user input prompt */
    userPrompt: string;
    /** AI model identifier */
    model: string;
    /** Temperature for response randomness (0.0 - 1.0) */
    temperature?: number;
}

/**
 * Result from prompt builder including the full prompt string
 */
export interface PromptResult {
    prompt: string;
    config: PromptConfig;
}

// ============================================
// MODEL CONSTANTS
// ============================================

export const AI_MODELS = {
    GPT_OSS_120B: "openai/gpt-oss-120b",
    LLAMA_70B: "llama-3.3-70b-versatile",
} as const;

export type AIModelKey = keyof typeof AI_MODELS;
export type AIModelValue = typeof AI_MODELS[AIModelKey];

/** Default model for all features */
export const DEFAULT_MODEL: AIModelValue = AI_MODELS.GPT_OSS_120B;
export const DEFAULT_TEMPERATURE = 0.5;

// ============================================
// SYSTEM PROMPTS
// ============================================

const SYSTEM_PROMPTS = {
    translator: `You are a professional Indonesian-English translator. Provide accurate translations with context.`,

    dictionary: `Role: Smart Bilingual Dictionary (Indonesian <-> English).
You analyze words, detect typos, identify misconceptions, and provide comprehensive explanations.
Always respond in valid JSON format.`,

    grammarExpert: `You are an English grammar expert helping Indonesian learners.
Provide clear explanations with examples. Always respond in valid JSON format.`,

    storyTeller: `You are a creative writing assistant for language learning.
Create engaging, evocative content suitable for intermediate learners.
Always respond in valid JSON format.`,

    evaluator: `You are a language learning evaluator.
Provide constructive feedback with scores and improvement suggestions.
Always respond in valid JSON format.`,

    survivalCoach: `You are a practical language coach for real-world scenarios.
Create realistic situations that help learners practice vocabulary in context.
Always respond in valid JSON format.`,
} as const;

// ============================================
// PROMPT BUILDERS
// ============================================

/**
 * Build prompt for batch vocabulary definitions
 */
export function buildBatchVocabPrompt(words: string[]): PromptResult {
    const config: PromptConfig = {
        systemPrompt: SYSTEM_PROMPTS.translator,
        userPrompt: `Translate the following words to Indonesian: ${words.join(", ")}. Return JSON with format: { "definitions": [{ "word": "...", "meaning": "..." }] }`,
        model: DEFAULT_MODEL,
        temperature: 0.3,
    };

    return {
        prompt: `${config.systemPrompt}\n\n${config.userPrompt}`,
        config,
    };
}

/**
 * Build prompt for simple translation
 */
export function buildTranslatePrompt(text: string): PromptResult {
    const config: PromptConfig = {
        systemPrompt: SYSTEM_PROMPTS.translator,
        userPrompt: `Translate to Indonesian. Explain grammar/vocab if complex. Text: "${text}"`,
        model: DEFAULT_MODEL,
        temperature: 0.5,
    };

    return {
        prompt: `${config.systemPrompt}\n\n${config.userPrompt}`,
        config,
    };
}

/**
 * Build prompt for vocabulary explanation
 */
export function buildExplainVocabPrompt(word: string, mode: 'EN-ID' | 'ID-EN' = 'EN-ID'): PromptResult {
    const modeInstructions = mode === 'EN-ID'
        ? `**RULE FOR EN-ID MODE (English Input -> Indonesian Output)**
       1. CHECK LANGUAGE: Is "${word}" an English word? 
          - Note: Ignore minor typos (e.g., "thnik" is English).
          - CRITICAL: If the word is clearly INDONESIAN (e.g., "Rehat", "Makan", "Lari"), you MUST REJECT it.
       2. ACTION:
          - If INDONESIAN: Set word="INVALID_SCOPE". (User should switch to ID-EN mode).
          - If ENGLISH (or English typo): Proceed to explain it in Indonesian.
       
       TASK (English -> Indonesian):
       1. Check English typos.
       2. Explain in Indonesian.`
        : `**RULE FOR ID-EN MODE (Indonesian Input -> English Output)**
       1. CHECK LANGUAGE: Is "${word}" an Indonesian word?
          - Note: Ignore minor typos (e.g., "jatuhh" is Indonesian).
          - CRITICAL: If the word is clearly ENGLISH (e.g., "Eat", "Sleep", "Run"), you MUST REJECT it.
       2. ACTION:
          - If ENGLISH: Set word="INVALID_SCOPE". (User should switch to EN-ID mode).
          - If INDONESIAN (or Indonesian typo): Proceed to translate and explain.
       
       TASK (Indonesian -> English):
       1. Check for Typos (e.g. "jatuhh" -> "jatuh").
       2. Translate to best English word.
       3. JSON output.`;

    const config: PromptConfig = {
        systemPrompt: SYSTEM_PROMPTS.dictionary,
        userPrompt: `Current Mode: ${mode}. 
Input Word: "${word}".

⚠️ STRICT LANGUAGE ENFORCEMENT ⚠️

${modeInstructions}`,
        model: DEFAULT_MODEL,
        temperature: 0.4,
    };

    return {
        prompt: `${config.systemPrompt}\n\n${config.userPrompt}`,
        config,
    };
}

/**
 * Build prompt for quick definition in context
 */
export function buildQuickDefPrompt(word: string, context: string): PromptResult {
    const config: PromptConfig = {
        systemPrompt: SYSTEM_PROMPTS.translator,
        userPrompt: `Translate '${word}' to Indonesian in context: '${context}'. Return JSON { translation: "..." }.`,
        model: DEFAULT_MODEL,
        temperature: 0.3,
    };

    return {
        prompt: `${config.systemPrompt}\n\n${config.userPrompt}`,
        config,
    };
}

/**
 * Build prompt for grammar check
 */
export function buildGrammarCheckPrompt(sentence: string): PromptResult {
    const config: PromptConfig = {
        systemPrompt: SYSTEM_PROMPTS.grammarExpert,
        userPrompt: `Fix grammar: "${sentence}". Return JSON with correctedSentence, errors[], generalFeedback.`,
        model: DEFAULT_MODEL,
        temperature: 0.3,
    };

    return {
        prompt: `${config.systemPrompt}\n\n${config.userPrompt}`,
        config,
    };
}

/**
 * Build prompt for grammar question generation
 */
export function buildGrammarQuestionPrompt(level: 'beginner' | 'intermediate'): PromptResult {
    const config: PromptConfig = {
        systemPrompt: SYSTEM_PROMPTS.grammarExpert,
        userPrompt: `Create a ${level} English grammar question (multiple choice). Return JSON.`,
        model: DEFAULT_MODEL,
        temperature: 0.7,
    };

    return {
        prompt: `${config.systemPrompt}\n\n${config.userPrompt}`,
        config,
    };
}

/**
 * Build prompt for evaluating challenge responses
 */
export function buildEvaluateChallengePrompt(scenario: string, phrase: string, userResponse: string): PromptResult {
    const config: PromptConfig = {
        systemPrompt: SYSTEM_PROMPTS.evaluator,
        userPrompt: `Scenario: ${scenario}. Target: ${phrase}. User: "${userResponse}". Rate & correct. Return JSON.`,
        model: DEFAULT_MODEL,
        temperature: 0.5,
    };

    return {
        prompt: `${config.systemPrompt}\n\n${config.userPrompt}`,
        config,
    };
}

/**
 * Build prompt for story generation
 */
export function buildGenerateStoryPrompt(): PromptResult {
    const config: PromptConfig = {
        systemPrompt: SYSTEM_PROMPTS.storyTeller,
        userPrompt: `Write short, evocative English sentence. Return JSON { sentence: "...", translation: "..." }.`,
        model: DEFAULT_MODEL,
        temperature: 0.8,
    };

    return {
        prompt: `${config.systemPrompt}\n\n${config.userPrompt}`,
        config,
    };
}

/**
 * Build prompt for evaluating story translations
 */
export function buildEvaluateStoryPrompt(original: string, userTranslation: string): PromptResult {
    const config: PromptConfig = {
        systemPrompt: SYSTEM_PROMPTS.evaluator,
        userPrompt: `Original: "${original}". User: "${userTranslation}". Rate 0-10. Return JSON.`,
        model: DEFAULT_MODEL,
        temperature: 0.5,
    };

    return {
        prompt: `${config.systemPrompt}\n\n${config.userPrompt}`,
        config,
    };
}

/**
 * Build prompt for analyzing story vocabulary
 */
export function buildAnalyzeStoryVocabPrompt(sentence: string): PromptResult {
    const config: PromptConfig = {
        systemPrompt: SYSTEM_PROMPTS.dictionary,
        userPrompt: `Analyze Sentence: "${sentence}". Identify 3-5 difficult words/idioms. Return JSON.`,
        model: DEFAULT_MODEL,
        temperature: 0.4,
    };

    return {
        prompt: `${config.systemPrompt}\n\n${config.userPrompt}`,
        config,
    };
}

/**
 * Build prompt for evaluating recall answers
 */
export function buildEvaluateRecallPrompt(word: string, correctAnswer: string, userAnswer: string): PromptResult {
    const config: PromptConfig = {
        systemPrompt: SYSTEM_PROMPTS.evaluator,
        userPrompt: `Target: ${word} (${correctAnswer}). User: "${userAnswer}". Correct? Return JSON.`,
        model: DEFAULT_MODEL,
        temperature: 0.3,
    };

    return {
        prompt: `${config.systemPrompt}\n\n${config.userPrompt}`,
        config,
    };
}

/**
 * Build prompt for survival scenario generation
 */
export function buildSurvivalScenarioPrompt(word: string): PromptResult {
    const config: PromptConfig = {
        systemPrompt: SYSTEM_PROMPTS.survivalCoach,
        userPrompt: `Create survival situation using "${word}". Return JSON.`,
        model: DEFAULT_MODEL,
        temperature: 0.7,
    };

    return {
        prompt: `${config.systemPrompt}\n\n${config.userPrompt}`,
        config,
    };
}

/**
 * Build prompt for evaluating survival responses
 */
export function buildEvaluateSurvivalPrompt(situation: string, word: string, response: string): PromptResult {
    const config: PromptConfig = {
        systemPrompt: SYSTEM_PROMPTS.evaluator,
        userPrompt: `Sit: ${situation}. Word: ${word}. Action: "${response}". Succeed? Return JSON.`,
        model: DEFAULT_MODEL,
        temperature: 0.5,
    };

    return {
        prompt: `${config.systemPrompt}\n\n${config.userPrompt}`,
        config,
    };
}

// ============================================
// FEATURE PROMPT MAP (for type-safe access)
// ============================================

/**
 * Map of feature names to their prompt builders
 * Used for dynamic prompt generation
 */
export const PROMPT_BUILDERS = {
    batch_vocab_def: buildBatchVocabPrompt,
    translate: buildTranslatePrompt,
    explain_vocab: buildExplainVocabPrompt,
    quick_def: buildQuickDefPrompt,
    grammar_check: buildGrammarCheckPrompt,
    grammar_question: buildGrammarQuestionPrompt,
    evaluate_challenge: buildEvaluateChallengePrompt,
    generate_story: buildGenerateStoryPrompt,
    evaluate_story: buildEvaluateStoryPrompt,
    analyze_story_vocab: buildAnalyzeStoryVocabPrompt,
    evaluate_recall: buildEvaluateRecallPrompt,
    survival_scenario: buildSurvivalScenarioPrompt,
    evaluate_survival: buildEvaluateSurvivalPrompt,
} as const;
