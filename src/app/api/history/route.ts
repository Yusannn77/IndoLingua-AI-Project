import { NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma';

const ITEMS_PER_PAGE = 50; // 50 entries per page (simpler approach)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // 🔥 Page-based pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = ITEMS_PER_PAGE;
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await prisma.history.count();
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    // Fetch entries for current page
    const history = await prisma.history.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    // Calculate unique days in total (for info display)
    const uniqueDatesSet = new Set<string>();
    history.forEach(h => {
      uniqueDatesSet.add(h.createdAt.toISOString().split('T')[0]);
    });

    return NextResponse.json({
      entries: history,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasPrev: page > 1,
        hasNext: page < totalPages,
        daysInPage: uniqueDatesSet.size
      }
    });
  } catch (error) {
    console.error('Error fetching history:', error);
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