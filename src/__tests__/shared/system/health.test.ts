import { describe, it, expect } from 'vitest';
// 🔥 FIX: Arahkan ke lokasi Shared
import { prisma } from '@/shared/lib/prisma';

describe('System Health Check', () => {
  
  // LAYER 1: UNIT TEST (Logika Murni)
  it('⚡ Logic Layer: Should pass basic math', () => {
    expect(1 + 1).toBe(2);
  });

  // LAYER 2: INTEGRATION TEST (Database Test - Port 5433)
  it('🗄️ Database Layer: Should connect to Test DB', async () => {
    const count = await prisma.vocab.count();
    expect(typeof count).toBe('number');
    console.log(`      ✅ Connected to DB! Current Vocab Count: ${count}`);
  });

});