import { NextResponse } from 'next/server';
import { DictionaryService } from '@/features/dictionary/services/dictionary.service';
import { z } from 'zod';

// 1. GET: Ambil daftar kata dari DictionaryEntry
export async function GET() {
  try {
    const entries = await DictionaryService.getEntries();
    return NextResponse.json(entries);
  } catch (error) {
    console.error("[DICTIONARY_GET]", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// 2. POST: Simpan kata baru ke DictionaryEntry
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Panggil Service (Validasi Zod terjadi di dalam service)
    const newEntry = await DictionaryService.saveEntry(body);

    return NextResponse.json(newEntry, { status: 201 });

  } catch (error) {
    // Error Handling Terpusat
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        message: "Validation Error",
        errors: error.flatten().fieldErrors 
      }, { status: 400 });
    }

    // Handle Error Bisnis (misal: duplikasi)
    if (error instanceof Error && error.message.includes('sudah ada')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error("[DICTIONARY_POST]", error);
    return NextResponse.json({ error: 'Gagal menyimpan kata' }, { status: 500 });
  }
}

// 3. DELETE: Hapus entry
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await DictionaryService.deleteEntry(id);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[DICTIONARY_DELETE]", error);
    return NextResponse.json({ error: 'Gagal menghapus kata' }, { status: 500 });
  }
}

// 4. PATCH: Update entry
export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const updated = await DictionaryService.updateEntry(id, body);
    return NextResponse.json(updated);

  } catch (error) {
    console.error("[DICTIONARY_PATCH]", error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}