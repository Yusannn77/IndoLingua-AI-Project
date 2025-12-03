import { NextResponse } from 'next/server';
import { FlashcardService } from '@/features/flashcard/services/flashcard.service';
import { CreateFlashcardInput } from '@/shared/types';
import { z } from 'zod';

// Schema validasi runtime (opsional tapi recommended)
const createCardSchema = z.object({
  word: z.string().min(1),
  meaning: z.string().min(1),
  contextUsage: z.string().optional(),
  sourceType: z.enum(['STORY', 'DICTIONARY', 'MANUAL'])
});

// 1. GET: Ambil daftar kartu
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    // Cek apakah mode "Review" (hanya yang jatuh tempo)
    const onlyDue = searchParams.get('due') === 'true';
    
    const cards = await FlashcardService.getCards(onlyDue);
    return NextResponse.json(cards);
  } catch (error) {
    console.error("[FLASHCARD_GET]", error);
    return NextResponse.json({ error: 'Failed fetch cards' }, { status: 500 });
  }
}

// 2. POST: Buat kartu baru
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validasi Payload
    const validation = createCardSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Invalid Payload', 
        details: validation.error.flatten() 
      }, { status: 400 });
    }

    // Panggil Service
    const newCard = await FlashcardService.createCard(validation.data as CreateFlashcardInput);
    
    return NextResponse.json(newCard, { status: 201 });

  } catch (error) {
    // Handle Error Bisnis (misal: kartu sudah ada)
    const msg = error instanceof Error ? error.message : 'Failed create card';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

// 3. PATCH: Update progress (Review SRS)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, isRemembered } = body;

    if (!id || typeof isRemembered !== 'boolean') {
      return NextResponse.json({ error: 'Invalid Review Payload' }, { status: 400 });
    }

    const updated = await FlashcardService.submitReview(id, isRemembered);
    return NextResponse.json(updated);

  } catch (error) {
    console.error("[FLASHCARD_PATCH]", error);
    return NextResponse.json({ error: 'Failed update progress' }, { status: 500 });
  }
}

// 4. DELETE: Hapus kartu
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await FlashcardService.deleteCard(id);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[FLASHCARD_DELETE]", error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}