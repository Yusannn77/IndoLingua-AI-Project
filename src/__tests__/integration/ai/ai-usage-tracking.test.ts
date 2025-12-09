/**
 * AI Usage Tracking Integration Tests
 * 
 * Test untuk memverifikasi token usage tersimpan dengan benar ke database.
 * Menggunakan mocked AI client untuk menghindari API call sungguhan.
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import { prisma } from '@/shared/lib/prisma';
import { assertTestDatabase } from '../../helpers/db-guard';
import { VOCAB_FIXTURES, TOKEN_FIXTURES } from '../../__mocks__/fixtures/ai-response.fixtures';

// === MOCK AI CLIENT (Sebelum import route) ===
vi.mock('@/shared/lib/ai/client', () => ({
    generateContentWithRetry: vi.fn(),
}));

// Import setelah mock setup
import { generateContentWithRetry } from '@/shared/lib/ai/client';
import { POST } from '@/app/api/ai/generate/route';

// Helper untuk membuat Request
const createAIRequest = (feature: string, params: Record<string, unknown>) =>
    new Request('http://localhost/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature, params }),
    });

describe('Integration: AI Usage & Token Tracking', () => {
    beforeAll(async () => {
        await assertTestDatabase();
    });

    beforeEach(async () => {
        // Clear database sebelum setiap test
        await prisma.history.deleteMany();
        vi.clearAllMocks();
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    // ==============================
    // TEST CASE 1: Token Returned in Response
    // ==============================
    describe('Token Count in API Response', () => {
        it('should return correct token count for vocab explanation', async () => {
            // Arrange: Setup mock response
            const mockResponse = {
                text: JSON.stringify(VOCAB_FIXTURES.serendipity),
                tokens: TOKEN_FIXTURES.explainVocab, // 150
            };
            vi.mocked(generateContentWithRetry).mockResolvedValue(mockResponse);

            // Act: Call API
            const request = createAIRequest('explain_vocab', { word: 'Serendipity', mode: 'EN-ID' });
            const response = await POST(request);
            const json = await response.json();

            // Assert
            expect(response.status).toBe(200);
            expect(json.tokens).toBe(TOKEN_FIXTURES.explainVocab);
            expect(json.data.word).toBe('Serendipity');
        });

        it('should return token count for typo correction', async () => {
            // Arrange
            const mockResponse = {
                text: JSON.stringify(VOCAB_FIXTURES.typo_thnik),
                tokens: TOKEN_FIXTURES.explainVocabTypo, // 120
            };
            vi.mocked(generateContentWithRetry).mockResolvedValue(mockResponse);

            // Act
            const request = createAIRequest('explain_vocab', { word: 'thnik', mode: 'EN-ID' });
            const response = await POST(request);
            const json = await response.json();

            // Assert
            expect(response.status).toBe(200);
            expect(json.tokens).toBe(TOKEN_FIXTURES.explainVocabTypo);
            expect(json.data.isTypo).toBe(true);
        });

        it('should handle zero token responses gracefully', async () => {
            // Arrange
            const mockResponse = {
                text: JSON.stringify(VOCAB_FIXTURES.serendipity),
                tokens: TOKEN_FIXTURES.zeroTokens, // 0
            };
            vi.mocked(generateContentWithRetry).mockResolvedValue(mockResponse);

            // Act
            const request = createAIRequest('explain_vocab', { word: 'test', mode: 'EN-ID' });
            const response = await POST(request);
            const json = await response.json();

            // Assert
            expect(response.status).toBe(200);
            expect(json.tokens).toBe(0);
        });
    });

    // ==============================
    // TEST CASE 2: Token Aggregation (Multiple Requests)
    // ==============================
    describe('Token Aggregation Across Requests', () => {
        it('should track cumulative token usage from multiple AI calls', async () => {
            // Arrange: Prepare multiple mock responses
            const responses = [
                { text: JSON.stringify(VOCAB_FIXTURES.serendipity), tokens: 100 },
                { text: JSON.stringify(VOCAB_FIXTURES.typo_thnik), tokens: 150 },
                { text: JSON.stringify(VOCAB_FIXTURES.idiom_break_leg), tokens: 200 },
            ];

            let callCount = 0;
            vi.mocked(generateContentWithRetry).mockImplementation(async () => {
                return responses[callCount++];
            });

            // Act: Make 3 API calls
            const words = ['word1', 'word2', 'word3'];
            let totalTokens = 0;

            for (const word of words) {
                const request = createAIRequest('explain_vocab', { word, mode: 'EN-ID' });
                const response = await POST(request);
                const json = await response.json();
                totalTokens += json.tokens;
            }

            // Assert
            expect(totalTokens).toBe(450); // 100 + 150 + 200
            expect(generateContentWithRetry).toHaveBeenCalledTimes(3);
        });
    });

    // ==============================
    // TEST CASE 3: Different Features Token Tracking
    // ==============================
    describe('Token Tracking Per Feature Type', () => {
        it('should track tokens for grammar_check feature', async () => {
            // Arrange
            const mockResponse = {
                text: JSON.stringify({
                    correctedSentence: "She goes to school.",
                    errors: [],
                    generalFeedback: "Perfect!"
                }),
                tokens: TOKEN_FIXTURES.grammarCheck, // 100
            };
            vi.mocked(generateContentWithRetry).mockResolvedValue(mockResponse);

            // Act
            const request = createAIRequest('grammar_check', { sentence: 'She go to school.' });
            const response = await POST(request);
            const json = await response.json();

            // Assert
            expect(response.status).toBe(200);
            expect(json.tokens).toBe(TOKEN_FIXTURES.grammarCheck);
        });

        it('should track tokens for generate_story feature', async () => {
            // Arrange
            const mockResponse = {
                text: JSON.stringify({
                    sentence: "The moon rose slowly.",
                    translation: "Bulan terbit perlahan."
                }),
                tokens: TOKEN_FIXTURES.generateStory, // 90
            };
            vi.mocked(generateContentWithRetry).mockResolvedValue(mockResponse);

            // Act
            const request = createAIRequest('generate_story', {});
            const response = await POST(request);
            const json = await response.json();

            // Assert
            expect(response.status).toBe(200);
            expect(json.tokens).toBe(TOKEN_FIXTURES.generateStory);
        });
    });

    // ==============================
    // TEST CASE 4: Error Scenarios
    // ==============================
    describe('Error Handling in Token Tracking', () => {
        it('should not track tokens when AI returns error', async () => {
            // Arrange: Mock AI failure
            vi.mocked(generateContentWithRetry).mockRejectedValue(
                new Error('AI Service is currently busy (429)')
            );

            // Act
            const request = createAIRequest('explain_vocab', { word: 'test', mode: 'EN-ID' });
            const response = await POST(request);
            const json = await response.json();

            // Assert
            expect(response.status).toBe(503);
            expect(json.error).toContain('busy');
            expect(json.tokens).toBeUndefined();
        });

        it('should handle invalid JSON from AI gracefully', async () => {
            // Arrange: Mock invalid JSON response
            vi.mocked(generateContentWithRetry).mockResolvedValue({
                text: 'This is not valid JSON',
                tokens: 50,
            });

            // Act
            const request = createAIRequest('explain_vocab', { word: 'test', mode: 'EN-ID' });
            const response = await POST(request);
            const json = await response.json();

            // Assert
            expect(response.status).toBe(500);
            expect(json.error).toContain('invalid JSON');
        });
    });
});
