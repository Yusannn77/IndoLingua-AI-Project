import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const vocabs = await prisma.vocab.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(vocabs);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { word, translation, originalSentence } = body;

    if (!word || !translation) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    const newVocab = await prisma.vocab.create({
      data: {
        word,
        translation,
        originalSentence: originalSentence || "-"
      }
    });
    
    return NextResponse.json(newVocab);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menyimpan kata' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await prisma.vocab.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menghapus' }, { status: 500 });
  }
}