import { prisma } from '@/shared/lib/prisma';

export async function assertTestDatabase() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    throw new Error('🚨 CRITICAL: DATABASE_URL is not defined.');
  }

  // Cek Port (Harus 5433) dan Nama DB (Harus ada kata 'test')
  const isTestPort = dbUrl.includes(':5433');
  const isTestName = dbUrl.includes('test_db') || dbUrl.includes('_test');

  if (!isTestPort || !isTestName) {
    throw new Error(
      `🚨 SAFETY GUARD: Mencegah run di Non-Test DB!\n` +
      `   URL saat ini tidak mengarah ke port 5433 atau nama db tidak mengandung 'test'.`
    );
  }
}