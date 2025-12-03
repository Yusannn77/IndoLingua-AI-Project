import { NextResponse } from 'next/server';
// Pastikan path import ini sesuai dengan lokasi file service Anda
import { StoryService } from '@/features/story-lab/services/story.service';
import { CreateStoryAttemptInput } from '@/shared/types';
import { z } from 'zod';

// 1. GET: Ambil History Latihan User
export async function GET() {
  try {
    const history = await StoryService.getHistory();
    return NextResponse.json(history);
  } catch (error) {
    console.error("[STORY_GET]", error);
    return NextResponse.json({ error: 'Gagal mengambil riwayat story' }, { status: 500 });
  }
}

// 2. POST: Simpan Log Latihan Baru
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Panggil Service (Validasi ada di dalam service)
    const log = await StoryService.logAttempt(body as CreateStoryAttemptInput);

    return NextResponse.json(log, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        message: "Data tidak valid",
        errors: error.flatten().fieldErrors 
      }, { status: 400 });
    }

    console.error("[STORY_POST]", error);
    return NextResponse.json({ error: 'Gagal menyimpan log cerita' }, { status: 500 });
  }
}