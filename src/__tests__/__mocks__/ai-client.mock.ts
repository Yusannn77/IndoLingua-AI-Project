/**
 * AI Client Mock
 * 
 * Mock untuk generateContentWithRetry yang menghindari API call sungguhan.
 * Digunakan di semua test yang melibatkan AI.
 */
import { vi } from 'vitest';

// Default mock responses per feature
const defaultResponses: Record<string, { text: string; tokens: number }> = {
    explain_vocab: {
        text: JSON.stringify({
            word: "Serendipity",
            meaning: "Keberuntungan yang tidak disengaja",
            context_usage: "It was pure serendipity that we met.",
            nuance_comparison: "Berbeda dengan 'luck' yang lebih umum",
            synonyms: ["fortune", "chance", "luck"],
            isTypo: false,
            isMisconception: false,
            errorAnalysis: "",
            category: "Literal",
        }),
        tokens: 150,
    },
    explain_vocab_typo: {
        text: JSON.stringify({
            word: "think",
            meaning: "Berpikir",
            context_usage: "I think, therefore I am.",
            nuance_comparison: "Kata dasar untuk aktivitas mental",
            synonyms: ["consider", "ponder", "reflect"],
            isTypo: true,
            isMisconception: false,
            errorAnalysis: "User typed 'thnik' instead of 'think'",
            originalInput: "thnik",
            category: "Literal",
        }),
        tokens: 120,
    },
    grammar_check: {
        text: JSON.stringify({
            correctedSentence: "She goes to school every day.",
            errors: [
                {
                    original: "go",
                    correction: "goes",
                    type: "Grammar",
                    explanation: "Third person singular requires 's' suffix"
                }
            ],
            generalFeedback: "Good attempt! Watch subject-verb agreement."
        }),
        tokens: 100,
    },
    grammar_question: {
        text: JSON.stringify({
            id: "test-id-123",
            question: "Choose the correct form: She ___ to school yesterday.",
            options: ["go", "goes", "went", "gone"],
            correctIndex: 2,
            explanation: "Past tense of 'go' is 'went'."
        }),
        tokens: 80,
    },
    generate_story: {
        text: JSON.stringify({
            sentence: "The old lighthouse keeper watched the storm approach.",
            translation: "Penjaga mercusuar tua itu mengawasi badai mendekat."
        }),
        tokens: 90,
    },
};

// Store for custom mock responses
let customResponses: Map<string, { text: string; tokens: number }> = new Map();

/**
 * Mock implementation of generateContentWithRetry
 */
export const mockGenerateContentWithRetry = vi.fn(async (config: { prompt: string }) => {
    // Try to determine feature from prompt content
    const prompt = config.prompt.toLowerCase();

    // Check custom responses first
    for (const [key, response] of customResponses) {
        if (prompt.includes(key.toLowerCase())) {
            return response;
        }
    }

    // Fallback to default responses based on prompt keywords
    if (prompt.includes('typo') || prompt.includes('thnik')) {
        return defaultResponses.explain_vocab_typo;
    }
    if (prompt.includes('explain') || prompt.includes('vocab') || prompt.includes('word')) {
        return defaultResponses.explain_vocab;
    }
    if (prompt.includes('grammar') && prompt.includes('question')) {
        return defaultResponses.grammar_question;
    }
    if (prompt.includes('grammar') || prompt.includes('fix')) {
        return defaultResponses.grammar_check;
    }
    if (prompt.includes('story')) {
        return defaultResponses.generate_story;
    }

    // Default fallback
    return defaultResponses.explain_vocab;
});

/**
 * Helper to set custom mock response for a specific feature/keyword
 */
export function setMockAIResponse(keyword: string, response: object, tokens: number) {
    customResponses.set(keyword, {
        text: JSON.stringify(response),
        tokens,
    });
}

/**
 * Helper to clear all custom responses
 */
export function clearMockAIResponses() {
    customResponses.clear();
    mockGenerateContentWithRetry.mockClear();
}

/**
 * Pre-configured mock for vi.mock()
 */
export const aiClientMock = {
    generateContentWithRetry: mockGenerateContentWithRetry,
};

// Export default responses for direct use in tests
export { defaultResponses as AI_MOCK_RESPONSES };
