/**
 * Dictionary Feature Unit Tests
 * 
 * Pengujian unit untuk helper functions pada fitur Dictionary.
 * Fokus pada validasi input dan logika pure function.
 * 
 * REFACTORED: Using Unicode Property Escapes for Extended Latin support.
 */
import { describe, it, expect } from 'vitest';

// ===========================================
// CONSTANTS (Mirror dari Dictionary.tsx)
// ===========================================
const MAX_CHARS_DICT = 35;

/**
 * isLatinScript - Production-Grade Latin Script Validator
 * 
 * Uses Unicode Property Escapes (\p{L}) to support:
 * - Extended Latin characters (diacritics: café, über, naïve)
 * - Indonesian morphology (reduplication: kupu-kupu, lauk-pauk)
 * - Smart quotes from mobile devices (' and ')
 * - Standard punctuation (., !, ?, -, ')
 * 
 * REJECTS:
 * - Non-Latin scripts (Kanji, Cyrillic, Arabic, Thai, etc.)
 * - Emoji and special symbols (@, #, $, %)
 * - Numbers (0-9)
 */
const isLatinScript = (text: string): boolean => {
    // Pattern: Latin letters (with diacritics), whitespace, hyphens, quotes, punctuation
    // \p{Script=Latin} - Only Latin script letters (includes á, ü, ñ, etc.)
    // \s - Whitespace
    // \- - Hyphen (for Indonesian reduplication like kupu-kupu)
    // '' - Smart quotes (curly apostrophes from mobile keyboards)
    // ' - Standard straight apostrophe
    // .,!? - Basic punctuation
    return /^[\p{Script=Latin}\s\-''.,!?]+$/u.test(text);
};

// ===========================================
// UNIT TESTS
// ===========================================

describe('Dictionary Feature - Helper Functions', () => {

    // --- KONSTANTA ---
    describe('MAX_CHARS_DICT', () => {
        it('should be 35 characters', () => {
            expect(MAX_CHARS_DICT).toBe(35);
        });
    });

    // --- isLatinScript() ---
    describe('isLatinScript()', () => {

        // =========================================
        // VALID INPUTS - Basic Latin
        // =========================================
        describe('Valid Latin Inputs - Basic', () => {
            it('should return true for simple English word', () => {
                expect(isLatinScript('hello')).toBe(true);
            });

            it('should return true for English sentence', () => {
                expect(isLatinScript('The quick brown fox')).toBe(true);
            });

            it('should return true for word with straight apostrophe', () => {
                expect(isLatinScript("don't")).toBe(true);
            });

            it('should return true for word with hyphen', () => {
                expect(isLatinScript('self-aware')).toBe(true);
            });

            it('should return true for sentence with punctuation', () => {
                expect(isLatinScript('Hello, world!')).toBe(true);
            });

            it('should return true for question', () => {
                expect(isLatinScript('How are you?')).toBe(true);
            });

            it('should return true for uppercase letters', () => {
                expect(isLatinScript('HELLO WORLD')).toBe(true);
            });

            it('should return true for mixed case', () => {
                expect(isLatinScript('HeLLo WoRLd')).toBe(true);
            });
        });

        // =========================================
        // VALID INPUTS - Extended Latin (Diacritics)
        // =========================================
        describe('Valid Latin Inputs - Extended Latin (Diacritics)', () => {
            it('should return true for café (French loanword)', () => {
                expect(isLatinScript('café')).toBe(true);
            });

            it('should return true for über (German loanword)', () => {
                expect(isLatinScript('über')).toBe(true);
            });

            it('should return true for español (Spanish)', () => {
                expect(isLatinScript('español')).toBe(true);
            });

            it('should return true for naïve (diaeresis)', () => {
                expect(isLatinScript('naïve')).toBe(true);
            });

            it('should return true for façade (cedilla)', () => {
                expect(isLatinScript('façade')).toBe(true);
            });

            it('should return true for Zoë (diaeresis on vowel)', () => {
                expect(isLatinScript('Zoë')).toBe(true);
            });

            it('should return true for Déjà vu (mixed diacritics)', () => {
                expect(isLatinScript('Déjà vu')).toBe(true);
            });

            it('should return true for résumé (acute accents)', () => {
                expect(isLatinScript('résumé')).toBe(true);
            });
        });

        // =========================================
        // VALID INPUTS - Indonesian Morphology
        // =========================================
        describe('Valid Latin Inputs - Indonesian Morphology', () => {
            it('should return true for kupu-kupu (reduplication)', () => {
                expect(isLatinScript('kupu-kupu')).toBe(true);
            });

            it('should return true for sayur-mayur (reduplication)', () => {
                expect(isLatinScript('sayur-mayur')).toBe(true);
            });

            it('should return true for lauk-pauk (reduplication)', () => {
                expect(isLatinScript('lauk-pauk')).toBe(true);
            });

            it('should return true for ramah-tamah (reduplication)', () => {
                expect(isLatinScript('ramah-tamah')).toBe(true);
            });
        });

        // =========================================
        // VALID INPUTS - Smart Quotes (Mobile Input)
        // =========================================
        describe('Valid Latin Inputs - Smart Quotes', () => {
            it("should return true for smart quote apostrophe (It's)", () => {
                // Using curly right single quote: '
                expect(isLatinScript("It's me")).toBe(true);
            });

            it("should return true for smart quote contraction (don't)", () => {
                // Using curly right single quote: '
                expect(isLatinScript("don't")).toBe(true);
            });

            it("should return true for smart quote possessive (John's)", () => {
                // Using curly right single quote: '
                expect(isLatinScript("John's book")).toBe(true);
            });
        });

        // =========================================
        // INVALID INPUTS - Non-Latin Scripts
        // =========================================
        describe('Invalid Non-Latin Scripts', () => {
            it('should return false for Japanese characters', () => {
                expect(isLatinScript('こんにちは')).toBe(false);
            });

            it('should return false for Chinese characters', () => {
                expect(isLatinScript('你好')).toBe(false);
            });

            it('should return false for Korean characters', () => {
                expect(isLatinScript('안녕하세요')).toBe(false);
            });

            it('should return false for Arabic characters', () => {
                expect(isLatinScript('مرحبا')).toBe(false);
            });

            it('should return false for Cyrillic characters', () => {
                expect(isLatinScript('Привет')).toBe(false);
            });

            it('should return false for Thai characters', () => {
                expect(isLatinScript('สวัสดี')).toBe(false);
            });

            it('should return false for Greek characters', () => {
                expect(isLatinScript('Γεια σου')).toBe(false);
            });

            it('should return false for mixed Latin and non-Latin', () => {
                expect(isLatinScript('hello こんにちは')).toBe(false);
            });
        });

        // =========================================
        // INVALID INPUTS - Symbols and Numbers
        // =========================================
        describe('Invalid Inputs - Symbols and Numbers', () => {
            it('should return false for emoji', () => {
                expect(isLatinScript('hello 👋')).toBe(false);
            });

            it('should return false for numbers', () => {
                expect(isLatinScript('hello123')).toBe(false);
            });

            it('should return false for @ symbol', () => {
                expect(isLatinScript('email@test')).toBe(false);
            });

            it('should return false for hashtag', () => {
                expect(isLatinScript('#hashtag')).toBe(false);
            });

            it('should return false for dollar sign', () => {
                expect(isLatinScript('$100')).toBe(false);
            });

            it('should return false for percent symbol', () => {
                expect(isLatinScript('50%')).toBe(false);
            });

            it('should return false for asterisk', () => {
                expect(isLatinScript('hello*world')).toBe(false);
            });

            it('should return false for parentheses', () => {
                expect(isLatinScript('hello (world)')).toBe(false);
            });
        });

        // =========================================
        // EDGE CASES - Empty and Whitespace
        // =========================================
        describe('Edge Cases - Empty and Whitespace', () => {
            it('should return false for empty string', () => {
                expect(isLatinScript('')).toBe(false);
            });

            it('should return true for single space', () => {
                expect(isLatinScript(' ')).toBe(true);
            });

            it('should return true for multiple spaces', () => {
                expect(isLatinScript('   ')).toBe(true);
            });
        });

    });

    // --- Input Length Validation Logic ---
    describe('Input Length Validation', () => {

        it('should accept input at exactly MAX_CHARS_DICT length', () => {
            const input = 'a'.repeat(MAX_CHARS_DICT);
            expect(input.length).toBe(35);
            expect(input.length <= MAX_CHARS_DICT).toBe(true);
        });

        it('should reject input exceeding MAX_CHARS_DICT', () => {
            const input = 'a'.repeat(MAX_CHARS_DICT + 1);
            expect(input.length).toBe(36);
            expect(input.length <= MAX_CHARS_DICT).toBe(false);
        });

        it('should accept short input', () => {
            const input = 'hi';
            expect(input.length <= MAX_CHARS_DICT).toBe(true);
        });
    });

});
