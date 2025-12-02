import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { GET, POST, PATCH, DELETE } from '@/app/api/vocab/route';
import { prisma } from '@/shared/lib/prisma';
import type { Vocab } from '@prisma/client';

describe('Dictionary Feature: Vocab API Integration', () => {
  
  // 1. SETUP: Pastikan koneksi ke DB Test (Port 5433)
  beforeAll(async () => {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl?.includes('5433')) {
      throw new Error('🚨 BAHAYA: Test runner tidak terhubung ke Port 5433! Cek .env.test');
    }
    await prisma.vocab.deleteMany(); // Reset data sebelum test
  });

  let createdVocabId: string;

  // --- TEST CASE 1: CREATE (POST) ---
  it('Should CREATE a new vocabulary entry successfully', async () => {
    const payload = {
      word: 'Ephemeral',
      translation: 'Sementara / Fana',
      originalSentence: 'Beauty is ephemeral.', 
    };

    const req = new Request('http://localhost/api/vocab', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    const data = (await res.json()) as Vocab;

    expect(res.status).toBe(201);
    expect(data.word).toBe(payload.word);
    expect(data.originalSentence).toBe(payload.originalSentence); // Validasi field ini
    expect(data.id).toBeDefined();
    
    createdVocabId = data.id;
  });

  // --- TEST CASE 2: READ (GET) ---
  it('Should FETCH the list containing the new vocab', async () => {
    const res = await GET();
    const data = (await res.json()) as Vocab[];

    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    
    const found = data.find((v) => v.id === createdVocabId);
    expect(found).toBeDefined();
    expect(found?.word).toBe('Ephemeral');
    expect(found?.originalSentence).toBe('Beauty is ephemeral.');
  });

  // --- TEST CASE 3: DUPLICATE CHECK (POST) ---
  it('Should REJECT duplicate words', async () => {
    const payload = {
      word: 'Ephemeral', 
      translation: 'Apapun',
      originalSentence: '-'
    };

    const req = new Request('http://localhost/api/vocab', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    const data = (await res.json()) as { error: string };

    expect(res.status).toBe(409); // Conflict
    expect(data.error).toMatch(/exist/i);
  });

  // --- TEST CASE 4: UPDATE (PATCH) ---
  it('Should UPDATE mastery status', async () => {
    const req = new Request(`http://localhost/api/vocab?id=${createdVocabId}`, {
      method: 'PATCH',
      body: JSON.stringify({ mastered: true }),
    });

    const res = await PATCH(req);
    const data = (await res.json()) as Vocab;

    expect(res.status).toBe(200);
    expect(data.mastered).toBe(true);
  });

  // --- TEST CASE 5: DELETE (DELETE) ---
  it('Should DELETE the vocab entry', async () => {
    const req = new Request(`http://localhost/api/vocab?id=${createdVocabId}`, {
      method: 'DELETE',
    });

    const res = await DELETE(req);
    const data = (await res.json()) as { success: boolean };

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);

    // Verifikasi data hilang dari DB
    const dbCheck = await prisma.vocab.findUnique({ where: { id: createdVocabId }});
    expect(dbCheck).toBeNull();
  });

  // 3. TEARDOWN
  afterAll(async () => {
    await prisma.$disconnect();
  });
});