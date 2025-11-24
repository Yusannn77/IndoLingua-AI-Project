import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const history = await prisma.history.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit 50 item terakhir
    });
    return NextResponse.json(history);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching history' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const entry = await prisma.history.create({
      data: {
        feature: body.feature,
        details: body.details,
        source: body.source,
        tokens: body.tokens || 0
      }
    });
    return NextResponse.json(entry);
  } catch (error) {
    return NextResponse.json({ error: 'Error saving history' }, { status: 500 });
  }
}