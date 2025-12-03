import { describe, it, expect } from 'vitest';
// 🔥 FIX: Arahkan ke lokasi Shared
import { prisma } from '@/shared/lib/prisma';

describe('System Health Check', () => {
  
  // LAYER 1: UNIT TEST (Logika Murni)
  it('⚡ Logic Layer: Should pass basic math', () => {
    expect(1 + 1).toBe(2);
  });

});