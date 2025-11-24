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
    return NextResponse.json({ error: 'Error fetching daily progress' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, targets, memorized, completed } = body;

    // Upsert: Create kalau belum ada, Update kalau sudah ada
    const progress = await prisma.dailyProgress.upsert({
      where: { date },
      update: {
        memorized,
        completed
        // Targets biasanya tidak berubah setelah digenerate hari itu
      },
      create: {
        date,
        targets,
        memorized: [],
        completed: []
      }
    });

    return NextResponse.json(progress);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error saving progress' }, { status: 500 });
  }
}