import { NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma';

interface ProgressMetrics {
    wordsAdded: number;
    cardsMastered: number;
    cardsReviewed: number;
    storyAttempts: number;
    storyAvgScore: number;
    storyBestScore: number;
    tokensUsed: number;
    aiRequests: number;
    activeDays: number;
    totalSessions: number;
    mostProductiveDay: string | null;
    mostActiveHour: string | null;
}

interface ProgressResponse {
    current: ProgressMetrics;
    previous: ProgressMetrics | null;
    period: { month: number; year: number };
}

function getMonthDateRange(month: number, year: number): { start: Date; end: Date } {
    const start = new Date(year, month, 1, 0, 0, 0, 0);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
    return { start, end };
}

function emptyMetrics(): ProgressMetrics {
    return {
        wordsAdded: 0,
        cardsMastered: 0,
        cardsReviewed: 0,
        storyAttempts: 0,
        storyAvgScore: 0,
        storyBestScore: 0,
        tokensUsed: 0,
        aiRequests: 0,
        activeDays: 0,
        totalSessions: 0,
        mostProductiveDay: null,
        mostActiveHour: null
    };
}

async function calculateMetrics(month: number, year: number): Promise<ProgressMetrics> {
    const { start, end } = getMonthDateRange(month, year);

    try {
        // Query data yang pasti ada
        const [wordsAdded, masteredCount, storyStats, tokenStats, historyRecords] = await Promise.all([
            // Words added this period
            prisma.dictionaryEntry.count({
                where: { createdAt: { gte: start, lte: end } }
            }),

            // Cards with MASTERED status (approximate - actual transitions tracked separately)
            prisma.flashcard.count({
                where: {
                    status: 'MASTERED',
                    updatedAt: { gte: start, lte: end }
                }
            }),

            // Story attempts with scores
            prisma.storyAttempt.aggregate({
                where: { createdAt: { gte: start, lte: end } },
                _count: true,
                _avg: { score: true },
                _max: { score: true }
            }),

            // Token usage
            prisma.history.aggregate({
                where: {
                    createdAt: { gte: start, lte: end },
                    source: 'API'
                },
                _sum: { tokens: true },
                _count: true
            }),

            // All history records for patterns
            prisma.history.findMany({
                where: { createdAt: { gte: start, lte: end } },
                select: { createdAt: true }
            })
        ]);

        // 🔥 FIX TIMEZONE: Helper untuk local date string
        const getLocalDateString = (date: Date): string => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        // Calculate active days and patterns
        const daySet = new Set<string>();
        const dayCount: Record<string, number> = {};
        const hourCount: Record<number, number> = {};

        historyRecords.forEach((record: { createdAt: Date }) => {
            // 🔥 FIX: Gunakan local date, bukan UTC
            const dateStr = getLocalDateString(record.createdAt);
            daySet.add(dateStr);

            const dayName = record.createdAt.toLocaleDateString('id-ID', { weekday: 'long' });
            dayCount[dayName] = (dayCount[dayName] || 0) + 1;

            const hour = record.createdAt.getHours();
            hourCount[hour] = (hourCount[hour] || 0) + 1;
        });

        // Find most productive day
        let mostProductiveDay: string | null = null;
        let maxDayCount = 0;
        for (const [day, count] of Object.entries(dayCount)) {
            if (count > maxDayCount) {
                maxDayCount = count;
                mostProductiveDay = day;
            }
        }

        // Find most active hour range
        let mostActiveHour: string | null = null;
        let maxHourCount = 0;
        for (const [hour, count] of Object.entries(hourCount)) {
            if (count > maxHourCount) {
                maxHourCount = count;
                const h = parseInt(hour);
                if (h >= 5 && h < 12) mostActiveHour = 'Pagi (05:00-12:00)';
                else if (h >= 12 && h < 17) mostActiveHour = 'Siang (12:00-17:00)';
                else if (h >= 17 && h < 21) mostActiveHour = 'Sore (17:00-21:00)';
                else mostActiveHour = 'Malam (21:00-05:00)';
            }
        }

        return {
            wordsAdded,
            cardsMastered: masteredCount,
            cardsReviewed: historyRecords.length, // Using history as proxy for now
            storyAttempts: storyStats._count || 0,
            storyAvgScore: Math.round((storyStats._avg?.score || 0) * 10) / 10,
            storyBestScore: storyStats._max?.score || 0,
            tokensUsed: tokenStats._sum?.tokens || 0,
            aiRequests: tokenStats._count || 0,
            activeDays: daySet.size,
            totalSessions: historyRecords.length,
            mostProductiveDay,
            mostActiveHour
        };
    } catch (error) {
        console.error('Error in calculateMetrics:', error);
        return emptyMetrics();
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const month = parseInt(searchParams.get('month') || String(currentMonth), 10);
        const year = parseInt(searchParams.get('year') || String(currentYear), 10);

        const isFuture = year > currentYear || (year === currentYear && month > currentMonth);
        const selectedMonth = isFuture ? currentMonth : month;
        const selectedYear = isFuture ? currentYear : year;

        const current = await calculateMetrics(selectedMonth, selectedYear);

        // Calculate previous period
        let previous: ProgressMetrics | null = null;
        const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
        const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;

        const oldestRecord = await prisma.history.findFirst({
            orderBy: { createdAt: 'asc' },
            select: { createdAt: true }
        });

        if (oldestRecord) {
            const prevStart = new Date(prevYear, prevMonth, 1);
            if (prevStart >= oldestRecord.createdAt) {
                previous = await calculateMetrics(prevMonth, prevYear);
            }
        }

        const response: ProgressResponse = {
            current,
            previous,
            period: { month: selectedMonth, year: selectedYear }
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error fetching progress:', error);
        return NextResponse.json({ error: 'Error fetching progress' }, { status: 500 });
    }
}
