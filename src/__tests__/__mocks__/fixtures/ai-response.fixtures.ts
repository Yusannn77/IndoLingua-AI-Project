/**
 * AI Response Fixtures
 * 
 * Pre-defined responses untuk berbagai skenario testing.
 * Digunakan bersama dengan ai-client.mock.ts
 */

// === DICTIONARY / VOCAB FIXTURES ===

export const VOCAB_FIXTURES = {
    // Normal word explanation
    serendipity: {
        word: "Serendipity",
        meaning: "Keberuntungan yang tidak disengaja; menemukan sesuatu yang berharga tanpa mencarinya",
        context_usage: "It was pure serendipity that we met at the coffee shop.",
        nuance_comparison: "Berbeda dengan 'luck' yang lebih umum, serendipity mengandung unsur penemuan yang menyenangkan.",
        synonyms: ["fortune", "chance", "happenstance"],
        isTypo: false,
        isMisconception: false,
        errorAnalysis: "",
        category: "Literal",
        literal_meaning: null,
        figurative_meaning: null,
    },

    // Typo case
    typo_thnik: {
        word: "think",
        meaning: "Berpikir; menggunakan pikiran untuk mempertimbangkan sesuatu",
        context_usage: "I think, therefore I am.",
        nuance_comparison: "Kata dasar untuk aktivitas mental dan kognitif.",
        synonyms: ["consider", "ponder", "reflect", "contemplate"],
        isTypo: true,
        isMisconception: false,
        errorAnalysis: "User mengetik 'thnik' - kemungkinan typo dari 'think'",
        originalInput: "thnik",
        category: "Literal",
    },

    // Grammar misconception
    misconception_buyed: {
        word: "bought",
        meaning: "Membeli (past tense)",
        context_usage: "I bought a new book yesterday.",
        nuance_comparison: "Irregular verb - past tense dari 'buy' adalah 'bought', bukan 'buyed'.",
        synonyms: ["purchased", "acquired"],
        isTypo: false,
        isMisconception: true,
        errorAnalysis: "'Buyed' adalah kesalahan umum. 'Buy' adalah irregular verb dengan bentuk: buy -> bought -> bought",
        originalInput: "buyed",
        category: "Literal",
    },

    // Idiom case
    idiom_break_leg: {
        word: "Break a leg",
        meaning: "Semoga sukses; ungkapan untuk mendoakan keberhasilan",
        context_usage: "Break a leg on your performance tonight!",
        nuance_comparison: "Idiom teater yang berarti mendoakan kesuksesan, kebalikan dari maknanya secara literal.",
        synonyms: ["good luck", "best wishes"],
        isTypo: false,
        isMisconception: false,
        errorAnalysis: "",
        category: "Idiom",
        literal_meaning: "Patahkan kakimu",
        figurative_meaning: "Semoga sukses/beruntung",
    },

    // Invalid scope (wrong language mode)
    invalid_scope: {
        word: "INVALID_SCOPE",
        meaning: "",
        context_usage: "",
        nuance_comparison: "",
        synonyms: [],
        isTypo: false,
        isMisconception: false,
        errorAnalysis: "Kata yang dimasukkan tidak sesuai dengan mode yang dipilih.",
        category: "Literal",
    },
};

// === GRAMMAR FIXTURES ===

export const GRAMMAR_FIXTURES = {
    checkResult: {
        correctedSentence: "She goes to school every day.",
        errors: [
            {
                original: "go",
                correction: "goes",
                type: "Grammar",
                explanation: "Subject 'She' memerlukan verb dengan akhiran 's' (third person singular)."
            }
        ],
        generalFeedback: "Perhatikan subject-verb agreement untuk third person singular.",
    },

    questionBeginner: {
        id: "grammar-q-001",
        question: "Choose the correct form: She ___ to school yesterday.",
        options: ["go", "goes", "went", "gone"],
        correctIndex: 2,
        explanation: "Past tense dari 'go' adalah 'went' (irregular verb).",
    },

    questionIntermediate: {
        id: "grammar-q-002",
        question: "If I ___ rich, I would travel the world.",
        options: ["am", "was", "were", "be"],
        correctIndex: 2,
        explanation: "Dalam conditional type 2, gunakan 'were' untuk semua subject (subjunctive mood).",
    },
};

// === STORY FIXTURES ===

export const STORY_FIXTURES = {
    generated: {
        sentence: "The old lighthouse keeper watched the storm approach with a mixture of fear and fascination.",
        translation: "Penjaga mercusuar tua itu mengawasi badai mendekat dengan campuran rasa takut dan terpesona.",
    },

    evaluation: {
        score: 85,
        feedback: "Terjemahan Anda sudah bagus! Hanya perlu sedikit penyesuaian pada nuansa kata.",
        improved_response: "Penjaga mercusuar yang sudah tua itu menyaksikan badai mendekat dengan perasaan campur aduk antara takut dan kagum.",
    },

    vocabAnalysis: {
        recommendations: [
            { text: "lighthouse", type: "word", translation: "mercusuar" },
            { text: "mixture of", type: "phrase", translation: "campuran dari" },
            { text: "fascination", type: "word", translation: "kekaguman/terpesona" },
        ],
    },
};

// === TOKEN COUNTS (for testing token tracking) ===

export const TOKEN_FIXTURES = {
    explainVocab: 150,
    explainVocabTypo: 120,
    grammarCheck: 100,
    grammarQuestion: 80,
    generateStory: 90,
    evaluateStory: 110,
    analyzeVocab: 95,
    zeroTokens: 0,
    highUsage: 500,
};
