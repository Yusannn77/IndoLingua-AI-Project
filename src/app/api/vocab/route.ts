import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const vocabs = await prisma.vocab.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(vocabs);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching vocab' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Validasi sederhana
    if (!body.word || !body.translation) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const newVocab = await prisma.vocab.create({
      data: {
        word: body.word,
        translation: body.translation,
        originalSentence: body.originalSentence || '-',
        mastered: false
      }
    });
    return NextResponse.json(newVocab);
  } catch (error) {
    return NextResponse.json({ error: 'Error saving vocab' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const updated = await prisma.vocab.update({
      where: { id },
      data: { mastered: body.mastered }
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Error updating vocab' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await prisma.vocab.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting vocab' }, { status: 500 });
  }
}