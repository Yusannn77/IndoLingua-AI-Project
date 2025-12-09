import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/ai/generate/route';
import type { FeatureRequest } from '@/shared/lib/ai/features';

// Helper Request dengan Strict Type
const createRequest = (body: FeatureRequest) => new Request('http://localhost/api/ai/generate', {
  method: 'POST',
  body: JSON.stringify(body),
});

describe('Dictionary Feature: AI Logic Integration & Token Audit', () => {
  
  // Test Case 1: Standard Vocabulary Analysis
  it('should correctly analyze complex words (e.g., "Serendipity")', async () => {
    const payload: FeatureRequest = {
      feature: 'explain_vocab',
      params: { word: 'Serendipity', mode: 'EN-ID' }
    };

    const res = await POST(createRequest(payload));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.word).toBe('Serendipity');
    expect(json.data.meaning).toBeDefined();
    
    expect(json.tokens).toBeGreaterThan(0);
    console.log(`[AI Metrics] "Serendipity" | Tokens Used: ${json.tokens} | Meaning: ${json.data.meaning}`);
  }, 20000);

  // Test Case 2: Typo Detection
  it('should automatically detect and correct typos', async () => {
    const payload: FeatureRequest = {
      feature: 'explain_vocab',
      params: { word: 'thnik', mode: 'EN-ID' }
    };

    const res = await POST(createRequest(payload));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.isTypo).toBe(true);
    expect(json.data.word.toLowerCase()).toBe('think');
    
    console.log(`[AI Metrics] Typo Correction | Tokens Used: ${json.tokens} | Result: thnik -> ${json.data.word}`);
  }, 20000);

  // Test Case 3: Grammar Misconception Analysis
  it('should identify grammar misconceptions (e.g., irregular verbs)', async () => {
    const payload: FeatureRequest = {
      feature: 'explain_vocab',
      params: { word: 'buyed', mode: 'EN-ID' }
    };

    const res = await POST(createRequest(payload));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.isMisconception).toBe(true);
    expect(json.data.word.toLowerCase()).toBe('bought');
    
    console.log(`[AI Metrics] Grammar Check | Tokens Used: ${json.tokens} | Analysis Length: ${json.data.errorAnalysis.length} chars`);
  }, 20000);

  // Test Case 4: Figurative Language (Idioms)
  it('should correctly identify idioms and figurative meanings', async () => {
    const payload: FeatureRequest = {
      feature: 'explain_vocab',
      params: { word: 'Break a leg', mode: 'EN-ID' }
    };

    const res = await POST(createRequest(payload));
    const json = await res.json();

    expect(res.status).toBe(200);
    
    // 1. Validate Category
    const isIdiomOrPhrase = ['Idiom', 'Phrase', 'Slang', 'Metaphor'].includes(json.data.category);
    expect(isIdiomOrPhrase).toBe(true);

    // 2. Validate Semantic Meaning
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
  }, 20000);

});