import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { vocabSchema } from '@/lib/validators';
import { z } from 'zod';

// 1. GET
export async function GET() {
  try {
    const vocabs = await prisma.vocab.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100 
    });
    return NextResponse.json(vocabs);
  } catch (error) {
    console.error("[VOCAB_GET]", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// 2. POST
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // --- VALIDATION LAYER ---
    const validation = vocabSchema.safeParse(body);

    if (validation.success) {
      // [HAPPY PATH] - TypeScript tahu 'validation.data' ada di sini
      const { word, translation, originalSentence } = validation.data;

      const existing = await prisma.vocab.findFirst({
        where: { word: { equals: word, mode: 'insensitive' } }
      });

      if (existing) {
        return NextResponse.json({ error: 'Word already exists' }, { status: 409 });
      }

      const newVocab = await prisma.vocab.create({
        data: {
          word,
          translation,
          originalSentence,
          mastered: false
        }
      });

      return NextResponse.json(newVocab, { status: 201 });

    } else {
      // [ERROR PATH] - TypeScript tahu 'validation.error' PASTI ada di sini
      return NextResponse.json({ 
        message: "Validation Error",
        errors: validation.error.flatten().fieldErrors // .flatten() membuat format error lebih rapi
      }, { status: 400 });
    }

  } catch (error) {
    console.error("[VOCAB_POST]", error);
    return NextResponse.json({ error: 'Failed to save vocabulary' }, { status: 500 });
  }
}

// 3. PATCH
export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    // Schema inline untuk PATCH
    const patchSchema = z.object({ mastered: z.boolean() });
    const validation = patchSchema.safeParse(body);

    if (validation.success) {
      // [HAPPY PATH]
      const updated = await prisma.vocab.update({
        where: { id },
        data: { mastered: validation.data.mastered }
      });
      return NextResponse.json(updated);

    } else {
      // [ERROR PATH]
      return NextResponse.json({ 
        message: "Invalid Request Format",
        errors: validation.error.flatten().fieldErrors 
      }, { status: 400 });
    }

  } catch (error) {
    console.error("[VOCAB_PATCH]", error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

// 4. DELETE
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await prisma.vocab.delete({ where: { id } });
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[VOCAB_DELETE]", error);
    return NextResponse.json({ error: 'Error deleting vocab' }, { status: 500 });
  }
}