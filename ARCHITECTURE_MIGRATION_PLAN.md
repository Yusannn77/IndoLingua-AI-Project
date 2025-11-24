# Simulasi Perombakan Arsitektur: SPA ke Industry Standard (Next.js)

## 1. Analisis Awal & Rekomendasi

Untuk mengubah aplikasi Single Page Application (SPA) React Anda menjadi arsitektur yang scalable, aman, dan SEO-friendly, berikut adalah 3 opsi pendekatan:

1.  **React + Backend Terpisah (Express/NestJS):**
    -   *Kelebihan:* Pemisahan total antara Frontend dan Backend (bisa didevelop tim berbeda).
    -   *Risiko:* Setup awal rumit, duplikasi type definition (TS), hosting terpisah.
2.  **Next.js (Fullstack React Framework) [REKOMENDASI]:**
    -   *Kelebihan:* Menggunakan React yang sudah ada, *Routing* bawaan (file-based), API Routes sudah termasuk (tidak butuh server backend terpisah), *Server Components* untuk performa, dan Type-safety end-to-end.
    -   *Risiko:* Learning curve di konsep Server vs Client component.
3.  **React + Inertia + Laravel:**
    -   *Kelebihan:* Backend sangat mature (Laravel), development cepat.
    -   *Risiko:* Harus migrasi bahasa backend ke PHP, setup environment lebih berat.

**Rekomendasi: Next.js.**
Alasannya: Anda sudah menggunakan TypeScript dan React. Migrasi ke Next.js adalah jalur paling natural karena 80% kode komponen UI Anda (Dashboard, VocabBuilder) bisa langsung dipakai ulang (copy-paste) dengan sedikit penyesuaian, sambil langsung mendapatkan fitur backend (API) dan routing yang proper tanpa belajar bahasa baru.

---

## 2. Simulasi Struktur Folder Baru (Pola Route-View-Controller-Model)

Struktur ini memisahkan logika bisnis (Controller), Data (Model), dan Tampilan (View/Page) secara tegas.

```text
/my-app
├── /app                     # (ROUTER & VIEW Layer)
│   ├── /api                 # ---> REST API Routes
│   │   ├── /vocab
│   │   │   └── route.ts     # Endpoint: /api/vocab
│   │   └── /stories
│   │       └── route.ts     # Endpoint: /api/stories
│   ├── /dashboard           # ---> Halaman Dashboard
│   │   └── page.tsx
│   ├── /stories             # ---> Halaman Story Lab
│   │   ├── page.tsx         # List stories
│   │   └── [id]
│   │       └── page.tsx     # Detail story
│   └── layout.tsx           # Layout Global
├── /components              # (UI Components - Reusable)
│   ├── Dashboard.tsx
│   ├── StoryCard.tsx
│   └── ...
├── /lib                     # (LOGIC Layer)
│   ├── /controllers         # ---> CONTROLLER Layer (Business Logic)
│   │   ├── vocabController.ts
│   │   └── storyController.ts
│   └── db.ts                # Koneksi Database
├── /prisma                  # (MODEL Layer)
│   └── schema.prisma        # Definisi Schema Database
└── /services
    └── geminiService.ts     # Refactored to run on server
```

---

## 3. Rincian Implementasi (Kode)

### A. Model (Prisma ORM)
File: `/prisma/schema.prisma`
Mendefinisikan struktur data yang sebelumnya ada di file JSON/TS static.

```prisma
// Model Layer
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  progress  Json?    // Menyimpan data progress/history
  createdAt DateTime @default(now())
}

model Story {
  id          String   @id @default(uuid())
  title       String
  content     String   @db.Text // Cerita panjang
  genre       String
  difficulty  String
  createdAt   DateTime @default(now())
}

model Vocab {
  id          String   @id @default(uuid())
  word        String
  meaning     String
  example     String
  isMastered  Boolean  @default(false)
  userId      String
}
```

### B. Controller (Business Logic)
File: `/lib/controllers/storyController.ts`
Memisahkan logic dari router agar bisa di-test independen.

```typescript
// Controller Layer
import { prisma } from '@/lib/db'; // Import instance prisma

export const StoryController = {
  // Method: index (Get All)
  async index() {
    try {
      return await prisma.story.findMany({
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      throw new Error('Failed to fetch stories');
    }
  },

  // Method: show (Get One)
  async show(id: string) {
    const story = await prisma.story.findUnique({ where: { id } });
    if (!story) throw new Error('Story not found');
    return story;
  },

  // Method: store (Create)
  async store(data: { title: string; content: string; genre: string }) {
    // Validasi sederhana
    if (!data.title || !data.content) throw new Error('Invalid data');
    
    return await prisma.story.create({
      data: {
        title: data.title,
        content: data.content,
        genre: data.genre,
        difficulty: 'Intermediate'
      }
    });
  }
};
```

### C. Route (API Endpoints)
File: `/app/api/stories/route.ts`
Menghubungkan HTTP Request ke Controller.

```typescript
// Route Layer
import { NextResponse } from 'next/server';
import { StoryController } from '@/lib/controllers/storyController';

export async function GET() {
  try {
    const stories = await StoryController.index();
    return NextResponse.json({ success: true, data: stories });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newStory = await StoryController.store(body);
    return NextResponse.json({ success: true, data: newStory }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
```

### D. View (Next.js Page)
File: `/app/stories/page.tsx`
Frontend yang memanggil API atau menampilkan data.

```tsx
// View Layer (React Server Component)
import Link from 'next/link';

// Di Next.js App Router, kita bisa fetch langsung di server component
async function getStories() {
  // Dalam real app, panggil API internal atau langsung controller jika di server sama
  const res = await fetch('http://localhost:3000/api/stories', { cache: 'no-store' });
  return res.json();
}

export default async function StoryPage() {
  const { data: stories } = await getStories();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Story Lab</h1>
      <div className="grid gap-4">
        {stories.map((story: any) => (
          <div key={story.id} className="border p-4 rounded-lg shadow hover:shadow-md">
            <h2 className="text-xl font-semibold">{story.title}</h2>
            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {story.genre}
            </span>
            <Link href={`/stories/${story.id}`} className="text-blue-600 ml-4 hover:underline">
              Baca Sekarang →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 4. Penjelasan Integrasi Database

1.  **Definisi Schema:** Kita menggunakan file `schema.prisma` (lihat bagian Model) sebagai sumber kebenaran tunggal (Single Source of Truth).
2.  **Migration:**
    Jalankan perintah: `npx prisma migrate dev --name init`.
    Perintah ini akan mengkonversi kode Prisma menjadi tabel SQL di database PostgreSQL secara otomatis.
3.  **Koneksi Frontend-Backend:**
    -   Frontend (View) *tidak boleh* akses database langsung.
    -   View memanggil `/api/stories` (Route).
    -   Route memanggil `StoryController`.
    -   Controller menggunakan `prisma` client untuk query ke DB.
4.  **Connection Utils:**
    File `/lib/db.ts` untuk mencegah too many connections saat development:
    ```typescript
    import { PrismaClient } from '@prisma/client';
    const globalForPrisma = global as unknown as { prisma: PrismaClient };
    export const prisma = globalForPrisma.prisma || new PrismaClient();
    if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
    ```

---

## 5. Langkah Konkrit Migrasi (SPA ke Multi-Route)

1.  **Tahap 1: Inisialisasi Next.js**
    Buat project baru atau ubah konfigurasi build. Pindahkan folder `components/` ke struktur baru. Install dependencies: `npm install prisma @prisma/client`.
2.  **Tahap 2: Data Migration (Static to DB)**
    Buat script `prisma/seed.ts`. Baca data dari `data/storyData.ts` dan `data/advancedVocab.ts`, lalu loop dan insert ke database menggunakan Prisma. Ini memindahkan "hardcoded data" menjadi "database rows".
3.  **Tahap 3: Refactor Logic & Services**
    Ubah `geminiService.ts`. Saat ini API Key terekspos di browser. Pindahkan logic ini ke `/app/api/generate/route.ts`. Frontend hanya mengirim prompt, Backend yang bicara ke Google Gemini (Aman).
4.  **Tahap 4: Implementasi Routing**
    Hapus state `currentView` di `App.tsx`. Buat file:
    -   `/app/dashboard/page.tsx` (Pindahkan isi component Dashboard)
    -   `/app/vocab/page.tsx` (Pindahkan isi VocabBuilder)
    UI sekarang terpisah per URL (`/dashboard`, `/vocab`).
5.  **Tahap 5: Wiring Data**
    Ubah komponen UI yang tadinya import data static (`import stories from '../data/storyData'`) menjadi `fetch('/api/stories')`.

---

## 6. Checklist Standar Industri

-   [ ] **Arsitektur:** Pemisahan jelas (MVC pattern diterapkan via Next.js App Router).
-   [ ] **Security:**
    -   Semua API Routes dilindungi (misal cek session user).
    -   Environment Variables (`.env`) untuk API KEY dan DATABASE_URL (tidak di-commit).
    -   CORS configuration di `next.config.js`.
-   [ ] **Error Handling:** Menggunakan `try-catch` di Controller dan mengembalikan status code HTTP yang tepat (200, 400, 500).
-   [ ] **Validasi:** Menggunakan library **Zod** untuk memvalidasi input di API Route sebelum diproses Controller.
-   [ ] **Logging:** Implementasi logger sederhana (atau Winston) di server side.
-   [ ] **Testing:** Setup Vitest atau Jest.

**Contoh File Test (`/tests/story.test.ts`):**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { StoryController } from '@/lib/controllers/storyController';

// Mock database call
vi.mock('@/lib/db', () => ({
  prisma: {
    story: {
      findMany: vi.fn().mockResolvedValue([{ id: '1', title: 'Test Story' }])
    }
  }
}));

describe('StoryController', () => {
  it('should return all stories', async () => {
    const stories = await StoryController.index();
    expect(stories).toHaveLength(1);
    expect(stories[0].title).toBe('Test Story');
  });
});
```
