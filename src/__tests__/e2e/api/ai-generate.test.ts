/**
 * AI Generate API E2E Tests
 * 
 * Test untuk endpoint /api/ai/generate dengan mocked AI.
 * Coverage: validation, feature routing, error handling.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VOCAB_FIXTURES, GRAMMAR_FIXTURES, TOKEN_FIXTURES } from '../../__mocks__/fixtures/ai-response.fixtures';
import { testRequest, parseResponse } from '../../helpers/test-request';

// === MOCK AI CLIENT ===
vi.mock('@/shared/lib/ai/client', () => ({
    generateContentWithRetry: vi.fn(),
}));

import { generateContentWithRetry } from '@/shared/lib/ai/client';
import { POST } from '@/app/api/ai/generate/route';

describe('E2E: AI Generate API (/api/ai/generate)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ==============================
    // Positive Cases
    // ==============================
    describe('Positive Cases', () => {
        it('should return 200 with valid explain_vocab request', async () => {
            // Arrange
            vi.mocked(generateContentWithRetry).mockResolvedValue({
                text: JSON.stringify(VOCAB_FIXTURES.serendipity),
                tokens: TOKEN_FIXTURES.explainVocab,
            });

            // Act
            const request = testRequest.post('/api/ai/generate', {
                feature: 'explain_vocab',
                params: { word: 'Serendipity', mode: 'EN-ID' },
            });
            const response = await POST(request);
            const { status, data } = await parseResponse<{ data: { word: string }; tokens: number }>(response);

            // Assert
            expect(status).toBe(200);
            expect(data.data.word).toBe('Serendipity');
            expect(data.tokens).toBe(TOKEN_FIXTURES.explainVocab);
        });

        it('should return 200 for grammar_check feature', async () => {
            // Arrange
            vi.mocked(generateContentWithRetry).mockResolvedValue({
                text: JSON.stringify(GRAMMAR_FIXTURES.checkResult),
                tokens: TOKEN_FIXTURES.grammarCheck,
            });

            // Act
            const request = testRequest.post('/api/ai/generate', {
                feature: 'grammar_check',
                params: { sentence: 'She go to school.' },
            });
            const response = await POST(request);
            const { status, data } = await parseResponse<{ data: { correctedSentence: string } }>(response);

            // Assert
            expect(status).toBe(200);
            expect(data.data.correctedSentence).toBeDefined();
        });

        it('should return 200 for grammar_question feature', async () => {
            // Arrange
            vi.mocked(generateContentWithRetry).mockResolvedValue({
                text: JSON.stringify(GRAMMAR_FIXTURES.questionBeginner),
                tokens: TOKEN_FIXTURES.grammarQuestion,
            });

            // Act
            const request = testRequest.post('/api/ai/generate', {
                feature: 'grammar_question',
                params: { level: 'beginner' },
            });
            const response = await POST(request);
            const { status, data } = await parseResponse<{ data: { question: string; options: string[] } }>(response);

            // Assert
            expect(status).toBe(200);
            expect(data.data.question).toBeDefined();
            expect(data.data.options).toHaveLength(4);
        });

        it('should return correct token count in response', async () => {
            // Arrange
            const expectedTokens = 250;
            vi.mocked(generateContentWithRetry).mockResolvedValue({
                text: JSON.stringify(VOCAB_FIXTURES.serendipity),
                tokens: expectedTokens,
            });

            // Act
            const request = testRequest.post('/api/ai/generate', {
                feature: 'explain_vocab',
                params: { word: 'test', mode: 'EN-ID' },
            });
            const response = await POST(request);
            const { data } = await parseResponse<{ tokens: number }>(response);

            // Assert
            expect(data.tokens).toBe(expectedTokens);
        });
    });

    // ==============================
    // Negative Cases
    // ==============================
    describe('Negative Cases', () => {
        it('should return 400 for invalid feature type', async () => {
            const request = testRequest.post('/api/ai/generate', {
                feature: 'invalid_feature',
                params: {},
            });
            const response = await POST(request);
            const { status, data } = await parseResponse<{ error: string }>(response);

            expect(status).toBe(400);
            expect(data.error).toContain('Invalid');
        });

        it('should return 400 for missing required params', async () => {
            const request = testRequest.post('/api/ai/generate', {
                feature: 'explain_vocab',
                params: {}, // Missing 'word' param
            });
            const response = await POST(request);
            const { status } = await parseResponse(response);

            expect(status).toBe(400);
        });

        it('should return 400 for empty request body', async () => {
            const request = testRequest.post('/api/ai/generate', {});
            const response = await POST(request);
            const { status } = await parseResponse(response);

            expect(status).toBe(400);
        });

        it('should return 500 when AI returns invalid JSON', async () => {
            // Arrange
            vi.mocked(generateContentWithRetry).mockResolvedValue({
                text: 'This is not valid JSON at all',
                tokens: 50,
            });

            // Act
            const request = testRequest.post('/api/ai/generate', {
                feature: 'explain_vocab',
                params: { word: 'test', mode: 'EN-ID' },
            });
            const response = await POST(request);
            const { status, data } = await parseResponse<{ error: string }>(response);

            // Assert
            expect(status).toBe(500);
            expect(data.error).toContain('invalid JSON');
        });
    });

    // ==============================
    // Error Handling (Service Errors)
    // ==============================
    describe('Error Handling', () => {
        it('should return 503 when AI service is rate limited', async () => {
            // Arrange
            vi.mocked(generateContentWithRetry).mockRejectedValue(
                new Error('Rate limit exceeded (429)')
            );

            // Act
            const request = testRequest.post('/api/ai/generate', {
                feature: 'explain_vocab',
                params: { word: 'test', mode: 'EN-ID' },
            });
            const response = await POST(request);
            const { status, data } = await parseResponse<{ error: string }>(response);

            // Assert
            expect(status).toBe(503);
            expect(data.error).toContain('busy');
        });

        it('should return 503 when AI service is overloaded', async () => {
            // Arrange
            vi.mocked(generateContentWithRetry).mockRejectedValue(
                new Error('Service Overloaded (503)')
            );

            // Act
            const request = testRequest.post('/api/ai/generate', {
                feature: 'explain_vocab',
                params: { word: 'test', mode: 'EN-ID' },
            });
            const response = await POST(request);
            const { status } = await parseResponse(response);

            // Assert
            expect(status).toBe(503);
        });

        it('should return 500 for unknown errors', async () => {
            // Arrange
            vi.mocked(generateContentWithRetry).mockRejectedValue(
                new Error('Something unexpected happened')
            );

            // Act
            const request = testRequest.post('/api/ai/generate', {
                feature: 'explain_vocab',
                params: { word: 'test', mode: 'EN-ID' },
            });
            const response = await POST(request);
            const { status } = await parseResponse(response);

            // Assert
            expect(status).toBe(500);
        });
    });

    // ==============================
    // Edge Cases
    // ==============================
    describe('Edge Cases', () => {
        it('should handle typo detection correctly', async () => {
            // Arrange
            vi.mocked(generateContentWithRetry).mockResolvedValue({
                text: JSON.stringify(VOCAB_FIXTURES.typo_thnik),
                tokens: TOKEN_FIXTURES.explainVocabTypo,
            });

            // Act
            const request = testRequest.post('/api/ai/generate', {
                feature: 'explain_vocab',
                params: { word: 'thnik', mode: 'EN-ID' },
            });
            const response = await POST(request);
            const { data } = await parseResponse<{ data: { isTypo: boolean; word: string } }>(response);

            // Assert
            expect(data.data.isTypo).toBe(true);
            expect(data.data.word).toBe('think');
        });

        it('should handle idiom categorization', async () => {
            // Arrange
            vi.mocked(generateContentWithRetry).mockResolvedValue({
                text: JSON.stringify(VOCAB_FIXTURES.idiom_break_leg),
                tokens: 130,
            });

            // Act
            const request = testRequest.post('/api/ai/generate', {
                feature: 'explain_vocab',
                params: { word: 'Break a leg', mode: 'EN-ID' },
            });
            const response = await POST(request);
            const { data } = await parseResponse<{ data: { category: string } }>(response);

            // Assert
            expect(data.data.category).toBe('Idiom');
        });
    });
});
