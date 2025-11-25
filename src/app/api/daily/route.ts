import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (!date) return NextResponse.json({ error: 'Date required' }, { status: 400 });

  try {
    const progress = await prisma.dailyProgress.findUnique({
      where: { date }
    });
    return NextResponse.json(progress || null);
  } catch (error) {
    console.error("Error fetching daily:", error);
    return NextResponse.json({ error: 'Error fetching daily progress' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, targets, memorized, completed, meanings } = body;

    // Validasi meanings agar tidak undefined
    const meaningsToSave = meanings && typeof meanings === 'object' ? meanings : {};

    const progress = await prisma.dailyProgress.upsert({
      where: { date },
      update: {
        memorized,
        completed,
        meanings: meaningsToSave // Pastikan ini di-passing
      },
      create: {
        date,
        targets,
        memorized: [],
        completed: [],
        meanings: meaningsToSave
      }
    });

    return NextResponse.json(progress);
  } catch (error) {
    console.error("Error saving progress:", error);
    return NextResponse.json({ error: 'Error saving progress' }, { status: 500 });
  }
}