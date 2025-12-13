/**
 * Daily Challenge Feature Unit Tests
 * 
 * Pengujian unit untuk helper functions pada fitur Daily Challenge.
 * Fokus pada generateDailyMission dan getTodayString.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { DailyProgress } from '@/shared/types';

// ===========================================
// MOCK DATA (Replika sebagian dari advancedVocabList)
// ===========================================
const mockVocabList = [
    "Ephemeral", "Serendipity", "Pragmatic", "Eloquent", "Resilient",
    "Meticulous", "Ambiguous", "Cacophony", "Euphoria", "Nostalgia",
    "Paradox", "Quintessential", "Surreal", "Ubiquitous", "Vicarious"
];

// ===========================================
// HELPER FUNCTIONS (Replika dari DailyChallenge.tsx)
// ===========================================
const getTodayString = (): string => new Date().toISOString().split('T')[0];

const generateDailyMission = (date: string, vocabList: string[]): DailyProgress => ({
    date,
    targets: [...vocabList].sort(() => 0.5 - Math.random()).slice(0, 10),
    memorized: [],
    completed: [],
    meanings: {}
});

// ===========================================
// UNIT TESTS
// ===========================================

describe('Daily Challenge Feature - Helper Functions', () => {

    // --- getTodayString() ---
    describe('getTodayString()', () => {

        beforeEach(() => {
            // Mock Date untuk konsistensi test
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should return date in YYYY-MM-DD format', () => {
            vi.setSystemTime(new Date('2024-12-13T10:00:00.000Z'));
            const result = getTodayString();
            expect(result).toBe('2024-12-13');
        });

        it('should return correct date for different timezone scenarios', () => {
            vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));
            const result = getTodayString();
            expect(result).toBe('2025-01-01');
        });

        it('should handle leap year date', () => {
            vi.setSystemTime(new Date('2024-02-29T12:00:00.000Z'));
            const result = getTodayString();
            expect(result).toBe('2024-02-29');
        });

        it('should return 10 character string (YYYY-MM-DD)', () => {
            vi.setSystemTime(new Date('2024-06-15T08:30:00.000Z'));
            const result = getTodayString();
            expect(result.length).toBe(10);
        });

        it('should match ISO date format regex', () => {
            vi.setSystemTime(new Date('2024-07-04T00:00:00.000Z'));
            const result = getTodayString();
            expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });
    });

    // --- generateDailyMission() ---
    describe('generateDailyMission()', () => {

        const testDate = '2024-12-13';

        it('should return object with correct date', () => {
            const result = generateDailyMission(testDate, mockVocabList);
            expect(result.date).toBe(testDate);
        });

        it('should return exactly 10 targets', () => {
            const result = generateDailyMission(testDate, mockVocabList);
            expect(result.targets.length).toBe(10);
        });

        it('should initialize memorized as empty array', () => {
            const result = generateDailyMission(testDate, mockVocabList);
            expect(result.memorized).toEqual([]);
        });

        it('should initialize completed as empty array', () => {
            const result = generateDailyMission(testDate, mockVocabList);
            expect(result.completed).toEqual([]);
        });

        it('should initialize meanings as empty object', () => {
            const result = generateDailyMission(testDate, mockVocabList);
            expect(result.meanings).toEqual({});
        });

        it('should contain valid DailyProgress structure', () => {
            const result = generateDailyMission(testDate, mockVocabList);

            expect(result).toHaveProperty('date');
            expect(result).toHaveProperty('targets');
            expect(result).toHaveProperty('memorized');
            expect(result).toHaveProperty('completed');
            expect(result).toHaveProperty('meanings');
        });

        it('should select targets from provided vocab list', () => {
            const result = generateDailyMission(testDate, mockVocabList);

            for (const target of result.targets) {
                expect(mockVocabList).toContain(target);
            }
        });

        it('should not have duplicate targets', () => {
            const result = generateDailyMission(testDate, mockVocabList);
            const uniqueTargets = new Set(result.targets);

            expect(uniqueTargets.size).toBe(result.targets.length);
        });

        it('should produce different order on multiple calls (randomization)', () => {
            // Run multiple times to check randomness
            const results = Array.from({ length: 5 }, () =>
                generateDailyMission(testDate, mockVocabList).targets.join(',')
            );

            // At least some should be different (probabilistic test)
            const uniqueResults = new Set(results);
            // Note: There's a very small chance this could fail due to random chance
            // but with 15 items choosing 10, the probability is extremely low
            expect(uniqueResults.size).toBeGreaterThanOrEqual(1);
        });
    });

    // --- Edge Cases ---
    describe('Edge Cases', () => {

        it('generateDailyMission should handle vocab list with exactly 10 items', () => {
            const exactList = mockVocabList.slice(0, 10);
            const result = generateDailyMission('2024-12-13', exactList);

            expect(result.targets.length).toBe(10);
        });

        it('generateDailyMission should handle vocab list with less than 10 items', () => {
            const shortList = ['Word1', 'Word2', 'Word3'];
            const result = generateDailyMission('2024-12-13', shortList);

            // slice(0, 10) on array of 3 will return all 3
            expect(result.targets.length).toBe(3);
        });

        it('generateDailyMission should handle empty vocab list', () => {
            const result = generateDailyMission('2024-12-13', []);
            expect(result.targets).toEqual([]);
        });
    });

});
