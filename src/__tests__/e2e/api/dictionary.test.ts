/**
 * Dictionary API E2E Tests
 * 
 * Test untuk endpoint /api/dictionary dengan coverage:
 * - Positive cases (success scenarios)
 * - Negative cases (validation errors, duplicates)
 * - Boundary cases (edge inputs)
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { prisma } from '@/shared/lib/prisma';
import { assertTestDatabase } from '../../helpers/db-guard';
import { DictionaryEntryFactory } from '../../helpers/factories';
import { testRequest, parseResponse } from '../../helpers/test-request';
import { GET, POST, DELETE, PATCH } from '@/app/api/dictionary/route';

describe('E2E: Dictionary API (/api/dictionary)', () => {
    beforeAll(async () => {
        await assertTestDatabase();
    });

    beforeEach(async () => {
        // Clean slate sebelum setiap test
        await prisma.flashcard.deleteMany();
        await prisma.dictionaryEntry.deleteMany();
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    // ==============================
    // GET /api/dictionary
    // ==============================
    describe('GET /api/dictionary', () => {
        it('should return empty array when no entries exist', async () => {
            const request = testRequest.get('/api/dictionary');
            const response = await GET();
            const { status, data } = await parseResponse<unknown[]>(response);

            expect(status).toBe(200);
            expect(data).toEqual([]);
        });

        it('should return all dictionary entries', async () => {
            // Arrange: Create entries
            await prisma.dictionaryEntry.create({
                data: DictionaryEntryFactory.build({ word: 'Apple' }),
            });
            await prisma.dictionaryEntry.create({
                data: DictionaryEntryFactory.build({ word: 'Banana' }),
            });

            // Act
            const response = await GET();
            const { status, data } = await parseResponse<unknown[]>(response);

            // Assert
            expect(status).toBe(200);
            expect(data).toHaveLength(2);
        });
    });

    // ==============================
    // POST /api/dictionary
    // ==============================
    describe('POST /api/dictionary', () => {
        // --- Positive Cases ---
        it('should create new entry with valid payload (201)', async () => {
            const payload = DictionaryEntryFactory.build({ word: 'Serendipity' });
            const request = testRequest.post('/api/dictionary', payload);
            const response = await POST(request);
            const { status, data } = await parseResponse<{ id: string; word: string }>(response);

            expect(status).toBe(201);
            expect(data.word).toBe('Serendipity');
            expect(data.id).toBeDefined();
        });

        it('should create entry with minimal required fields', async () => {
            const payload = DictionaryEntryFactory.buildMinimal();
            const request = testRequest.post('/api/dictionary', payload);
            const response = await POST(request);
            const { status } = await parseResponse(response);

            expect(status).toBe(201);
        });

        // --- Negative Cases ---
        it('should return 400 for missing required fields', async () => {
            const invalidPayload = { word: 'OnlyWord' }; // Missing meaning, etc.
            const request = testRequest.post('/api/dictionary', invalidPayload);
            const response = await POST(request);
            const { status, data } = await parseResponse<{ message: string }>(response);

            expect(status).toBe(400);
            expect(data.message).toContain('Validation');
        });

        it('should return 409 for duplicate word', async () => {
            // Arrange: Create existing entry
            const existing = DictionaryEntryFactory.build({ word: 'Duplicate' });
            await prisma.dictionaryEntry.create({ data: existing });

            // Act: Try to create duplicate
            const request = testRequest.post('/api/dictionary', existing);
            const response = await POST(request);
            const { status } = await parseResponse(response);

            // Assert
            expect(status).toBe(409);
        });

        // --- Boundary Cases ---
        it('should handle very long word gracefully', async () => {
            const longWord = 'A'.repeat(500);
            const payload = DictionaryEntryFactory.build({ word: longWord });
            const request = testRequest.post('/api/dictionary', payload);
            const response = await POST(request);

            // Should either succeed or return validation error, not crash
            expect([201, 400]).toContain(response.status);
        });

        it('should handle special characters in word', async () => {
            const specialWord = "it's-a-word! (test)";
            const payload = DictionaryEntryFactory.build({ word: specialWord });
            const request = testRequest.post('/api/dictionary', payload);
            const response = await POST(request);
            const { status, data } = await parseResponse<{ word: string }>(response);

            expect(status).toBe(201);
            expect(data.word).toBe(specialWord);
        });

        it('should handle empty synonyms array', async () => {
            const payload = DictionaryEntryFactory.build({
                word: 'NoSynonyms',
                synonyms: []
            });
            const request = testRequest.post('/api/dictionary', payload);
            const response = await POST(request);
            const { status } = await parseResponse(response);

            expect(status).toBe(201);
        });
    });

    // ==============================
    // DELETE /api/dictionary
    // ==============================
    describe('DELETE /api/dictionary', () => {
        it('should delete entry by id', async () => {
            // Arrange
            const entry = await prisma.dictionaryEntry.create({
                data: DictionaryEntryFactory.build({ word: 'ToDelete' }),
            });

            // Act
            const request = testRequest.delete('/api/dictionary', { id: entry.id });
            const response = await DELETE(request);
            const { status } = await parseResponse(response);

            // Assert
            expect(status).toBe(200);
            const deleted = await prisma.dictionaryEntry.findUnique({
                where: { id: entry.id }
            });
            expect(deleted).toBeNull();
        });

        it('should return 400 when id is missing', async () => {
            const request = testRequest.delete('/api/dictionary', {});
            const response = await DELETE(request);
            const { status, data } = await parseResponse<{ error: string }>(response);

            expect(status).toBe(400);
            expect(data.error).toContain('ID');
        });
    });

    // ==============================
    // PATCH /api/dictionary
    // ==============================
    describe('PATCH /api/dictionary', () => {
        it('should update entry fields', async () => {
            // Arrange
            const entry = await prisma.dictionaryEntry.create({
                data: DictionaryEntryFactory.build({ word: 'Original', meaning: 'Old meaning' }),
            });

            // Act
            const request = testRequest.patch(
                '/api/dictionary',
                { meaning: 'Updated meaning' },
                { id: entry.id }
            );
            const response = await PATCH(request);
            const { status, data } = await parseResponse<{ meaning: string }>(response);

            // Assert
            expect(status).toBe(200);
            expect(data.meaning).toBe('Updated meaning');
        });

        it('should return 400 when id is missing', async () => {
            const request = testRequest.patch('/api/dictionary', { meaning: 'New' }, {});
            const response = await PATCH(request);
            const { status } = await parseResponse(response);

            expect(status).toBe(400);
        });
    });
});
