/**
 * Prompt Registry Tests
 * 
 * Unit tests untuk prompt-registry.ts
 * Memastikan semua prompt builders berfungsi dengan benar.
 */
import { describe, it, expect } from 'vitest';
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
    AI_MODELS,
    DEFAULT_MODEL,
    DEFAULT_TEMPERATURE,
    PROMPT_BUILDERS,
    type PromptConfig,
    type PromptResult,
} from '@/shared/lib/ai/prompt-registry';

describe('Prompt Registry', () => {

    describe('Constants', () => {
        it('should have correct default model', () => {
            expect(DEFAULT_MODEL).toBe('openai/gpt-oss-120b');
        });

        it('should have correct default temperature', () => {
            expect(DEFAULT_TEMPERATURE).toBe(0.5);
        });

        it('should expose all AI models', () => {
            expect(AI_MODELS.GPT_OSS_120B).toBe('openai/gpt-oss-120b');
            expect(AI_MODELS.LLAMA_70B).toBe('llama-3.3-70b-versatile');
        });

        it('should have all prompt builders in registry', () => {
            const expectedBuilders = [
                'batch_vocab_def',
                'translate',
                'explain_vocab',
                'quick_def',
                'grammar_check',
                'grammar_question',
                'evaluate_challenge',
                'generate_story',
                'evaluate_story',
                'analyze_story_vocab',
                'evaluate_recall',
                'survival_scenario',
                'evaluate_survival',
            ];
            expect(Object.keys(PROMPT_BUILDERS)).toEqual(expectedBuilders);
        });
    });

    describe('PromptResult Structure', () => {
        it('should return valid PromptResult with prompt and config', () => {
            const result = buildTranslatePrompt('Hello world');

            expect(result).toHaveProperty('prompt');
            expect(result).toHaveProperty('config');
            expect(typeof result.prompt).toBe('string');
            expect(result.config).toMatchObject({
                systemPrompt: expect.any(String),
                userPrompt: expect.any(String),
                model: expect.any(String),
            });
        });

        it('should include temperature in config', () => {
            const result = buildGrammarCheckPrompt('She go to school');
            expect(result.config.temperature).toBeDefined();
            expect(typeof result.config.temperature).toBe('number');
        });
    });

    describe('buildBatchVocabPrompt', () => {
        it('should create prompt with words list', () => {
            const words = ['apple', 'banana', 'cherry'];
            const result = buildBatchVocabPrompt(words);

            expect(result.prompt).toContain('apple');
            expect(result.prompt).toContain('banana');
            expect(result.prompt).toContain('cherry');
            expect(result.config.model).toBe(DEFAULT_MODEL);
        });

        it('should handle empty words array', () => {
            const result = buildBatchVocabPrompt([]);
            expect(result.prompt).toBeDefined();
            expect(result.config.model).toBe(DEFAULT_MODEL);
        });
    });

    describe('buildTranslatePrompt', () => {
        it('should include text in prompt', () => {
            const text = 'The quick brown fox';
            const result = buildTranslatePrompt(text);

            expect(result.prompt).toContain(text);
            expect(result.config.userPrompt).toContain(text);
        });
    });

    describe('buildExplainVocabPrompt', () => {
        it('should handle EN-ID mode correctly', () => {
            const result = buildExplainVocabPrompt('serendipity', 'EN-ID');

            expect(result.prompt).toContain('serendipity');
            expect(result.prompt).toContain('EN-ID');
            expect(result.prompt).toContain('RULE FOR EN-ID MODE');
            expect(result.config.model).toBe(DEFAULT_MODEL);
        });

        it('should handle ID-EN mode correctly', () => {
            const result = buildExplainVocabPrompt('keberuntungan', 'ID-EN');

            expect(result.prompt).toContain('keberuntungan');
            expect(result.prompt).toContain('ID-EN');
            expect(result.prompt).toContain('RULE FOR ID-EN MODE');
        });

        it('should default to EN-ID mode', () => {
            const result = buildExplainVocabPrompt('hello');
            expect(result.prompt).toContain('EN-ID');
        });

        it('should include language enforcement rules', () => {
            const result = buildExplainVocabPrompt('test', 'EN-ID');
            expect(result.prompt).toContain('STRICT LANGUAGE ENFORCEMENT');
            expect(result.prompt).toContain('INVALID_SCOPE');
        });
    });

    describe('buildQuickDefPrompt', () => {
        it('should include word and context', () => {
            const result = buildQuickDefPrompt('swift', 'The swift fox jumped');

            expect(result.prompt).toContain('swift');
            expect(result.prompt).toContain('The swift fox jumped');
        });
    });

    describe('buildGrammarCheckPrompt', () => {
        it('should include sentence for correction', () => {
            const sentence = 'She go to school yesterday';
            const result = buildGrammarCheckPrompt(sentence);

            expect(result.prompt).toContain(sentence);
            expect(result.prompt.toLowerCase()).toContain('grammar');
        });
    });

    describe('buildGrammarQuestionPrompt', () => {
        it('should include beginner level', () => {
            const result = buildGrammarQuestionPrompt('beginner');
            expect(result.prompt).toContain('beginner');
        });

        it('should include intermediate level', () => {
            const result = buildGrammarQuestionPrompt('intermediate');
            expect(result.prompt).toContain('intermediate');
        });

        it('should have higher temperature for creativity', () => {
            const result = buildGrammarQuestionPrompt('beginner');
            expect(result.config.temperature).toBeGreaterThan(0.5);
        });
    });

    describe('buildEvaluateChallengePrompt', () => {
        it('should include all challenge parameters', () => {
            const result = buildEvaluateChallengePrompt(
                'ordering food',
                'I would like to order',
                'I want food please'
            );

            expect(result.prompt).toContain('ordering food');
            expect(result.prompt).toContain('I would like to order');
            expect(result.prompt).toContain('I want food please');
        });
    });

    describe('buildGenerateStoryPrompt', () => {
        it('should return valid prompt without parameters', () => {
            const result = buildGenerateStoryPrompt();

            expect(result.prompt).toBeDefined();
            expect(result.prompt.toLowerCase()).toContain('sentence');
            expect(result.config.model).toBe(DEFAULT_MODEL);
        });

        it('should have higher temperature for creativity', () => {
            const result = buildGenerateStoryPrompt();
            expect(result.config.temperature).toBeGreaterThan(0.5);
        });
    });

    describe('buildEvaluateStoryPrompt', () => {
        it('should include original and user translation', () => {
            const original = 'The cat sat on the mat';
            const userTranslation = 'Kucing duduk di atas tikar';
            const result = buildEvaluateStoryPrompt(original, userTranslation);

            expect(result.prompt).toContain(original);
            expect(result.prompt).toContain(userTranslation);
        });
    });

    describe('buildAnalyzeStoryVocabPrompt', () => {
        it('should include sentence for analysis', () => {
            const sentence = 'The melancholy rain fell softly';
            const result = buildAnalyzeStoryVocabPrompt(sentence);

            expect(result.prompt).toContain(sentence);
            expect(result.prompt.toLowerCase()).toContain('analyze');
        });
    });

    describe('buildEvaluateRecallPrompt', () => {
        it('should include word, correct answer, and user answer', () => {
            const result = buildEvaluateRecallPrompt('apple', 'apel', 'apel');

            expect(result.prompt).toContain('apple');
            expect(result.prompt).toContain('apel');
        });
    });

    describe('buildSurvivalScenarioPrompt', () => {
        it('should include target word', () => {
            const result = buildSurvivalScenarioPrompt('emergency');

            expect(result.prompt).toContain('emergency');
            expect(result.prompt.toLowerCase()).toContain('survival');
        });
    });

    describe('buildEvaluateSurvivalPrompt', () => {
        it('should include situation, word, and response', () => {
            const result = buildEvaluateSurvivalPrompt(
                'lost in a foreign city',
                'directions',
                'Excuse me, where is the train station?'
            );

            expect(result.prompt).toContain('lost in a foreign city');
            expect(result.prompt).toContain('directions');
            expect(result.prompt).toContain('train station');
        });
    });

    describe('Model Configuration', () => {
        it('all builders should use default model', () => {
            const builders = [
                () => buildBatchVocabPrompt(['test']),
                () => buildTranslatePrompt('test'),
                () => buildExplainVocabPrompt('test'),
                () => buildQuickDefPrompt('test', 'context'),
                () => buildGrammarCheckPrompt('test'),
                () => buildGrammarQuestionPrompt('beginner'),
                () => buildEvaluateChallengePrompt('s', 'p', 'u'),
                () => buildGenerateStoryPrompt(),
                () => buildEvaluateStoryPrompt('o', 'u'),
                () => buildAnalyzeStoryVocabPrompt('test'),
                () => buildEvaluateRecallPrompt('w', 'c', 'u'),
                () => buildSurvivalScenarioPrompt('test'),
                () => buildEvaluateSurvivalPrompt('s', 'w', 'r'),
            ];

            for (const builder of builders) {
                const result = builder();
                expect(result.config.model).toBe(DEFAULT_MODEL);
            }
        });

        it('all builders should have temperature defined', () => {
            const results = [
                buildBatchVocabPrompt(['test']),
                buildTranslatePrompt('test'),
                buildExplainVocabPrompt('test'),
                buildGrammarQuestionPrompt('beginner'),
                buildGenerateStoryPrompt(),
            ];

            for (const result of results) {
                expect(result.config.temperature).toBeDefined();
                expect(result.config.temperature).toBeGreaterThanOrEqual(0);
                expect(result.config.temperature).toBeLessThanOrEqual(1);
            }
        });
    });

    // ===========================================
    // NEW: Edge Cases & Special Characters
    // ===========================================
    describe('Edge Cases - Special Characters', () => {
        it('buildBatchVocabPrompt should handle words with special characters', () => {
            const words = ["can't", "self-aware", "it's"];
            const result = buildBatchVocabPrompt(words);

            expect(result.prompt).toContain("can't");
            expect(result.prompt).toContain("self-aware");
        });

        it('buildTranslatePrompt should handle text with quotes', () => {
            const text = 'She said "hello" to me';
            const result = buildTranslatePrompt(text);

            expect(result.prompt).toContain('She said');
            expect(result.prompt).toContain('hello');
        });

        it('buildQuickDefPrompt should handle context with quotes', () => {
            const result = buildQuickDefPrompt('run', 'He said "run" quickly');

            expect(result.prompt).toContain('run');
            expect(result.prompt).toContain('quickly');
        });

        it('buildGrammarCheckPrompt should handle sentence with apostrophe', () => {
            const result = buildGrammarCheckPrompt("I don't know what she's talking about");

            expect(result.prompt).toContain("don't");
            expect(result.prompt).toContain("she's");
        });

        it('buildExplainVocabPrompt should handle hyphenated words', () => {
            const result = buildExplainVocabPrompt('well-known');

            expect(result.prompt).toContain('well-known');
        });
    });

    describe('Edge Cases - Empty and Minimal Inputs', () => {
        it('buildTranslatePrompt should handle single character', () => {
            const result = buildTranslatePrompt('a');

            expect(result.prompt).toBeDefined();
            expect(result.config.model).toBe(DEFAULT_MODEL);
        });

        it('buildGrammarCheckPrompt should handle single word', () => {
            const result = buildGrammarCheckPrompt('Hello');

            expect(result.prompt).toContain('Hello');
        });

        it('buildQuickDefPrompt should handle empty context', () => {
            const result = buildQuickDefPrompt('apple', '');

            expect(result.prompt).toContain('apple');
            expect(result.config.model).toBe(DEFAULT_MODEL);
        });

        it('buildTranslatePrompt should handle long text', () => {
            const longText = 'This is a very long sentence that contains many words and should be handled properly by the prompt builder without any issues.';
            const result = buildTranslatePrompt(longText);

            expect(result.prompt).toContain('This is a very long sentence');
        });
    });

    describe('Edge Cases - Unicode and International', () => {
        it('buildExplainVocabPrompt should handle word with numbers', () => {
            // Testing edge case even though typically words don't have numbers
            const result = buildExplainVocabPrompt('24/7');

            expect(result.prompt).toContain('24/7');
        });

        it('buildTranslatePrompt should handle text with newlines', () => {
            const text = 'Line one\nLine two';
            const result = buildTranslatePrompt(text);

            expect(result.prompt).toContain('Line one');
            expect(result.prompt).toContain('Line two');
        });
    });
});

