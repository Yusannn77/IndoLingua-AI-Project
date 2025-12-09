/**
 * Dictionary Feature: AI Logic Integration Tests (Mocked)
 * 
 * Tests untuk memverifikasi logika AI termasuk:
 * - Vocabulary analysis
 * - Typo detection
 * - Grammar misconception handling
 * - Idiom recognition
 * 
 * Semua test menggunakan mocked AI client untuk menghindari API call sungguhan.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { FeatureRequest } from '@/shared/lib/ai/features';
import { VOCAB_FIXTURES, TOKEN_FIXTURES } from '../../__mocks__/fixtures/ai-response.fixtures';

// === MOCK AI CLIENT (Sebelum import route) ===
vi.mock('@/shared/lib/ai/client', () => ({
  generateContentWithRetry: vi.fn(),
}));

// Import setelah mock setup
import { generateContentWithRetry } from '@/shared/lib/ai/client';
import { POST } from '@/app/api/ai/generate/route';

// Helper Request dengan Strict Type
const createRequest = (body: FeatureRequest) => new Request('http://localhost/api/ai/generate', {
  method: 'POST',
  body: JSON.stringify(body),
});

describe('Dictionary Feature: AI Logic Integration & Token Audit (Mocked)', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test Case 1: Standard Vocabulary Analysis
  it('should correctly analyze complex words (e.g., "Serendipity")', async () => {
    // Arrange: Setup mock response
    vi.mocked(generateContentWithRetry).mockResolvedValue({
      text: JSON.stringify(VOCAB_FIXTURES.serendipity),
      tokens: TOKEN_FIXTURES.explainVocab,
    });

    const payload: FeatureRequest = {
      feature: 'explain_vocab',
      params: { word: 'Serendipity', mode: 'EN-ID' }
    };

    // Act
    const res = await POST(createRequest(payload));
    const json = await res.json();

    // Assert
    expect(res.status).toBe(200);
    expect(json.data.word).toBe('Serendipity');
    expect(json.data.meaning).toBeDefined();
    expect(json.tokens).toBe(TOKEN_FIXTURES.explainVocab);

    console.log(`[AI Metrics] "Serendipity" | Tokens Used: ${json.tokens} | Meaning: ${json.data.meaning}`);
  });

  // Test Case 2: Typo Detection
  it('should automatically detect and correct typos', async () => {
    // Arrange: Setup mock response for typo
    vi.mocked(generateContentWithRetry).mockResolvedValue({
      text: JSON.stringify(VOCAB_FIXTURES.typo_thnik),
      tokens: TOKEN_FIXTURES.explainVocabTypo,
    });

    const payload: FeatureRequest = {
      feature: 'explain_vocab',
      params: { word: 'thnik', mode: 'EN-ID' }
    };

    // Act
    const res = await POST(createRequest(payload));
    const json = await res.json();

    // Assert
    expect(res.status).toBe(200);
    expect(json.data.isTypo).toBe(true);
    expect(json.data.word.toLowerCase()).toBe('think');
    expect(json.tokens).toBe(TOKEN_FIXTURES.explainVocabTypo);

    console.log(`[AI Metrics] Typo Correction | Tokens Used: ${json.tokens} | Result: thnik -> ${json.data.word}`);
  });

  // Test Case 3: Grammar Misconception Analysis
  it('should identify grammar misconceptions (e.g., irregular verbs)', async () => {
    // Arrange: Setup mock response for misconception  
    const misconceptionResponse = {
      word: "bought",
      meaning: "Membeli (past tense dari 'buy')",
      context_usage: "I bought a new book yesterday.",
      nuance_comparison: "'Buyed' adalah bentuk salah. Kata 'buy' adalah irregular verb.",
      synonyms: ["purchased", "acquired"],
      isTypo: false,
      isMisconception: true,
      errorAnalysis: "'buyed' adalah kesalahan umum. Bentuk past tense yang benar adalah 'bought'.",
      category: "Verb",
    };

    vi.mocked(generateContentWithRetry).mockResolvedValue({
      text: JSON.stringify(misconceptionResponse),
      tokens: 130,
    });

    const payload: FeatureRequest = {
      feature: 'explain_vocab',
      params: { word: 'buyed', mode: 'EN-ID' }
    };

    // Act
    const res = await POST(createRequest(payload));
    const json = await res.json();

    // Assert
    expect(res.status).toBe(200);
    expect(json.data.isMisconception).toBe(true);
    expect(json.data.word.toLowerCase()).toBe('bought');
    expect(json.data.errorAnalysis).toContain('buyed');

    console.log(`[AI Metrics] Grammar Check | Tokens Used: ${json.tokens} | Correction: buyed -> ${json.data.word}`);
  });

  // Test Case 4: Figurative Language (Idioms)
  it('should correctly identify idioms and figurative meanings', async () => {
    // Arrange: Setup mock response for idiom
    vi.mocked(generateContentWithRetry).mockResolvedValue({
      text: JSON.stringify(VOCAB_FIXTURES.idiom_break_leg),
      tokens: 140,
    });

    const payload: FeatureRequest = {
      feature: 'explain_vocab',
      params: { word: 'Break a leg', mode: 'EN-ID' }
    };

    // Act
    const res = await POST(createRequest(payload));
    const json = await res.json();

    // Assert
    expect(res.status).toBe(200);

    // Validate Category
    expect(json.data.category).toBe('Idiom');

    // Validate Semantic Meaning
    const meaningCombined = (
      (json.data.meaning || "") + " " +
      (json.data.figurative_meaning || "") + " " +
      (json.data.nuance_comparison || "")
    ).toLowerCase();

    const validKeywords = [
      'sukses', 'beruntung', 'semangat', 'doa',
      'berhasil', 'lancar', 'tampil', 'good luck', 'harapan'
    ];

    const contextMatch = validKeywords.some(keyword => meaningCombined.includes(keyword));
    expect(contextMatch, `AI failed to interpret idiom context. Response: ${meaningCombined}`).toBe(true);

    console.log(`[AI Metrics] Idiom Analysis | Tokens Used: ${json.tokens} | Category: ${json.data.category}`);
  });

});