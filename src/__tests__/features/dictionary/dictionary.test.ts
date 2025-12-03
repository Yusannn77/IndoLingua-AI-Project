import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { GET, POST, PATCH, DELETE } from '@/app/api/dictionary/route';
import { prisma } from '@/shared/lib/prisma';
import type { DictionaryEntry } from '@prisma/client';
import { assertTestDatabase } from '../../helpers/db-guard';
import { DictionaryEntryFactory } from '../../helpers/factories';

describe('Dictionary Feature: API Integration Test (V2)', () => {
  
  // 1. SETUP: Verifikasi Koneksi DB Test (Port 5433)
  beforeAll(async () => {
    await assertTestDatabase(); // Safety Guard
    // Bersihkan data terkait test ini
    await prisma.dictionaryEntry.deleteMany({
      where: { word: { in: ['Ephemeral', 'Serendipity'] } }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  let createdEntryId: string;

  // --- TEST CASE 1: CREATE (POST) ---
  it('Should CREATE a new Dictionary Entry via API', async () => {
    // Menggunakan Factory
    const payload = DictionaryEntryFactory.build({
      word: 'Ephemeral',
      meaning: 'Sementara / Fana',
      contextUsage: 'Beauty is ephemeral.',
      synonyms: ['Transient', 'Short-lived'],
      category: 'Adjective'
    });

    const req = new Request('http://localhost/api/dictionary', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    const data = (await res.json()) as DictionaryEntry;

    expect(res.status).toBe(201);
    expect(data.word).toBe('Ephemeral');
    expect(data.meaning).toBe('Sementara / Fana');
    expect(data.synonyms).toContain('Transient');
    expect(data.id).toBeDefined();
    
    createdEntryId = data.id;
  });

  // --- TEST CASE 2: READ (GET) ---
  it('Should FETCH the list containing the new entry', async () => {
    const res = await GET();
    const data = (await res.json()) as DictionaryEntry[];

    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    
    const found = data.find((v) => v.id === createdEntryId);
    expect(found).toBeDefined();
    expect(found?.word).toBe('Ephemeral');
    expect(found?.synonyms).toEqual(['Transient', 'Short-lived']);
  });

  // --- TEST CASE 3: DUPLICATE CHECK (POST) ---
  it('Should REJECT duplicate words (Business Rule)', async () => {
    const payload = DictionaryEntryFactory.build({
      word: 'Ephemeral', // Kata yang sama dengan Case 1
      meaning: 'Apapun',
    });

    const req = new Request('http://localhost/api/dictionary', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    const data = (await res.json()) as { error: string };

    expect(res.status).toBe(409); // Conflict Status
    expect(data.error).toMatch(/sudah ada/i);
  });

  // --- TEST CASE 4: UPDATE (PATCH) ---
  // REVISI: Tidak lagi menguji 'mastered', tapi menguji update konten kamus
  it('Should UPDATE content fields via API', async () => {
    const updatePayload = {
      nuanceComparison: 'Updated nuance via API test',
      meaning: 'Updated Meaning: Fana'
    };

    const req = new Request(`http://localhost/api/dictionary?id=${createdEntryId}`, {
      method: 'PATCH',
      body: JSON.stringify(updatePayload),
    });

    const res = await PATCH(req);
    const data = (await res.json()) as DictionaryEntry;

    expect(res.status).toBe(200);
    // Validasi field yang diupdate
    expect(data.nuanceComparison).toBe('Updated nuance via API test');
    expect(data.meaning).toBe('Updated Meaning: Fana');
    // Validasi field yang TIDAK diupdate tetap sama
    expect(data.word).toBe('Ephemeral');
  });

  // --- TEST CASE 5: DELETE (DELETE) ---
  it('Should DELETE the entry via API', async () => {
    const req = new Request(`http://localhost/api/dictionary?id=${createdEntryId}`, {
      method: 'DELETE',
    });

    const res = await DELETE(req);
    const data = (await res.json()) as { success: boolean };

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);

    // Verifikasi data hilang dari DB
    const dbCheck = await prisma.dictionaryEntry.findUnique({ 
      where: { id: createdEntryId }
    });
    expect(dbCheck).toBeNull();
  });
});