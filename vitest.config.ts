import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import dotenv from 'dotenv';

// Load .env.test secara eksplisit agar database dev (5432) tidak tersentuh
dotenv.config({ path: '.env.test' });

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node', // Default ke node untuk backend testing
    globals: true,
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    // Timeout agak panjang karena koneksi DB pertama kali kadang butuh waktu
    testTimeout: 10000, 
  },
});