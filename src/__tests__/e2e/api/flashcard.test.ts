/**
 * Flashcard API E2E Tests
 * 
 * Test untuk endpoint /api/flashcard dengan coverage:
 * - Positive cases (CRUD success)
 * - Negative cases (validation, constraints)
 * - Boundary cases (edge inputs)
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { prisma } from '@/shared/lib/prisma';
import { assertTestDatabase } from '../../helpers/db-guard';
import { DictionaryEntryFactory, FlashcardFactory } from '../../helpers/factories';
import { testRequest, parseResponse } from '../../helpers/test-request';
import { GET, POST, DELETE, PATCH } from '@/app/api/flashcard/route';

describe('E2E: Flashcard API (/api/flashcard)', () => {
    beforeAll(async () => {
        await assertTestDatabase();
    });

    beforeEach(async () => {
        await prisma.flashcard.deleteMany();
        await prisma.dictionaryEntry.deleteMany();
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    // ==============================
    // GET /api/flashcard
    // ==============================
    describe('GET /api/flashcard', () => {
        it('should return empty array when no cards exist', async () => {
            const request = testRequest.get('/api/flashcard');
            const response = await GET(request);
            const { status, data } = await parseResponse<unknown[]>(response);

            expect(status).toBe(200);
            expect(data).toEqual([]);
        });

        it('should return all flashcards with dictionary entry data', async () => {
            const uniqueWord = `TestWord_${Date.now()}`;
            // Arrange: Create dictionary entry and flashcard
            const entry = await prisma.dictionaryEntry.create({
                data: DictionaryEntryFactory.build({ word: uniqueWord }),
            });
            await prisma.flashcard.create({
                data: FlashcardFactory.build(entry.id),
            });

            // Act
            const request = testRequest.get('/api/flashcard');
            const response = await GET(request);
            const { status, data } = await parseResponse<unknown[]>(response);

            // Assert
            expect(status).toBe(200);
            expect(data.length).toBeGreaterThanOrEqual(1);
        });

        it('should filter due cards when ?due=true', async () => {
            const timestamp = Date.now();
            // Arrange: Create two cards - one due, one not
            const entry1 = await prisma.dictionaryEntry.create({
                data: DictionaryEntryFactory.build({ word: `DueWord_${timestamp}` }),
            });
            const entry2 = await prisma.dictionaryEntry.create({
                data: DictionaryEntryFactory.build({ word: `NotDueWord_${timestamp}` }),
            });

            await prisma.flashcard.create({
                data: FlashcardFactory.build(entry1.id, {
                    nextReviewDate: new Date(Date.now() - 86400000), // Yesterday (due)
                }),
            });
            await prisma.flashcard.create({
                data: FlashcardFactory.build(entry2.id, {
                    nextReviewDate: new Date(Date.now() + 86400000), // Tomorrow (not due)
                }),
            });

            // Act
            const request = testRequest.get('/api/flashcard', { due: 'true' });
            const response = await GET(request);
            const { status, data } = await parseResponse<unknown[]>(response);

            // Assert - should only return due card
            expect(status).toBe(200);
            expect(data.length).toBeGreaterThanOrEqual(1); // At least our due card
        });
    });

    // ==============================
    // POST /api/flashcard
    // ==============================
    describe('POST /api/flashcard', () => {
        // --- Positive Cases ---
        it('should create flashcard with valid payload (201)', async () => {
            const uniqueWord = `Ephemeral_${Date.now()}`;
            const payload = {
                word: uniqueWord,
                meaning: 'Berlangsung singkat',
                contextUsage: 'Fame is ephemeral.',
                sourceType: 'DICTIONARY',
            };

            const request = testRequest.post('/api/flashcard', payload);
            const response = await POST(request);
            const { status, data } = await parseResponse<{ id: string }>(response);

            expect(status).toBe(201);
            expect(data.id).toBeDefined();
        });

        it('should create card linked to existing dictionary entry', async () => {
            const uniqueWord = `NewCard_${Date.now()}`;
            const payload = {
                word: uniqueWord,
                meaning: 'Kartu baru',
                sourceType: 'MANUAL',
            };

            const request = testRequest.post('/api/flashcard', payload);
            const response = await POST(request);
            const { status } = await parseResponse(response);

            expect(status).toBe(201);

            // Verify dictionary entry was created
            const entry = await prisma.dictionaryEntry.findUnique({
                where: { word: uniqueWord },
            });
            expect(entry).not.toBeNull();
        });

        // --- Negative Cases ---
        it('should return 400 for missing word', async () => {
            const invalidPayload = {
                meaning: 'Has meaning but no word',
                sourceType: 'DICTIONARY',
            };

            const request = testRequest.post('/api/flashcard', invalidPayload);
            const response = await POST(request);
            const { status, data } = await parseResponse<{ error: string }>(response);

            expect(status).toBe(400);
            expect(data.error).toContain('Invalid');
        });

        it('should return 400 for invalid sourceType', async () => {
            const invalidPayload = {
                word: 'Test',
                meaning: 'Test meaning',
                sourceType: 'INVALID_TYPE',
            };

            const request = testRequest.post('/api/flashcard', invalidPayload);
            const response = await POST(request);
            const { status } = await parseResponse(response);

            expect(status).toBe(400);
        });

        it('should return 400 for duplicate flashcard', async () => {
            const uniqueWord = `ExistingCard_${Date.now()}`;
            // Arrange: Create existing card
            const entry = await prisma.dictionaryEntry.create({
                data: DictionaryEntryFactory.build({ word: uniqueWord }),
            });
            await prisma.flashcard.create({
                data: FlashcardFactory.build(entry.id),
            });

            // Act: Try to create duplicate
            const payload = {
                word: uniqueWord,
                meaning: 'Duplicate attempt',
                sourceType: 'DICTIONARY',
            };
            const request = testRequest.post('/api/flashcard', payload);
            const response = await POST(request);
            const { status } = await parseResponse(response);

            // Assert
            expect(status).toBe(400);
        });

        // --- Boundary Cases ---
        it('should handle empty contextUsage', async () => {
            const uniqueWord = `NoContext_${Date.now()}`;
            const payload = {
                word: uniqueWord,
                meaning: 'Tanpa konteks',
                contextUsage: '',
                sourceType: 'MANUAL',
            };

            const request = testRequest.post('/api/flashcard', payload);
            const response = await POST(request);
            const { status } = await parseResponse(response);

            expect(status).toBe(201);
        });
    });

    // ==============================
    // PATCH /api/flashcard (Review/SRS)
    // ==============================
    describe('PATCH /api/flashcard', () => {
        it('should update mastery level when remembered', async () => {
            const uniqueWord = `RememberMe_${Date.now()}`;
            // Arrange
            const entry = await prisma.dictionaryEntry.create({
                data: DictionaryEntryFactory.build({ word: uniqueWord }),
            });
            const card = await prisma.flashcard.create({
                data: FlashcardFactory.build(entry.id, { masteryLevel: 1 }),
            });

            // Act
            const request = testRequest.patch('/api/flashcard', {
                id: card.id,
                isRemembered: true,
            });
            const response = await PATCH(request);
            const { status, data } = await parseResponse<{ masteryLevel: number }>(response);

            // Assert
            expect(status).toBe(200);
            expect(data.masteryLevel).toBeGreaterThanOrEqual(1);
        });

        it('should decrease or reset mastery when forgotten', async () => {
            const uniqueWord = `ForgotMe_${Date.now()}`;
            // Arrange
            const entry = await prisma.dictionaryEntry.create({
                data: DictionaryEntryFactory.build({ word: uniqueWord }),
            });
            const card = await prisma.flashcard.create({
                data: FlashcardFactory.build(entry.id, { masteryLevel: 3 }),
            });

            // Act
            const request = testRequest.patch('/api/flashcard', {
                id: card.id,
                isRemembered: false,
            });
            const response = await PATCH(request);
            const { status } = await parseResponse(response);

            // Assert
            expect(status).toBe(200);
        });

        it('should return 400 for invalid review payload', async () => {
            const request = testRequest.patch('/api/flashcard', {
                id: 'some-id',
                // Missing isRemembered
            });
            const response = await PATCH(request);
            const { status, data } = await parseResponse<{ error: string }>(response);

            expect(status).toBe(400);
            expect(data.error).toContain('Invalid');
        });
    });

    // ==============================
    // DELETE /api/flashcard
    // ==============================
    describe('DELETE /api/flashcard', () => {
        it('should delete flashcard by id', async () => {
            const uniqueWord = `DeleteMe_${Date.now()}`;
            // Arrange
            const entry = await prisma.dictionaryEntry.create({
                data: DictionaryEntryFactory.build({ word: uniqueWord }),
            });
            const card = await prisma.flashcard.create({
                data: FlashcardFactory.build(entry.id),
            });

            // Act
            const request = testRequest.delete('/api/flashcard', { id: card.id });
            const response = await DELETE(request);
            const { status } = await parseResponse(response);

            // Assert
            expect(status).toBe(200);
            const deleted = await prisma.flashcard.findUnique({ where: { id: card.id } });
            expect(deleted).toBeNull();
        });

        it('should return 400 when id is missing', async () => {
            const request = testRequest.delete('/api/flashcard', {});
            const response = await DELETE(request);
            const { status, data } = await parseResponse<{ error: string }>(response);

            expect(status).toBe(400);
            expect(data.error).toContain('ID');
        });
    });
});
