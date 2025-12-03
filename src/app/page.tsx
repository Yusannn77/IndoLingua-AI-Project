import { prisma } from "@/shared/lib/prisma";
import Dashboard from "@/features/dashboard/components/Dashboard";
import { HistoryItem } from "@/shared/types";

export const dynamic = 'force-dynamic';

export default async function Home() {
  // 1. Fetch Data Parallel
  const [masteredCards, historyRaw, dailyProgress] = await Promise.all([
    // Ganti 'vocab' dengan 'flashcard' dan filter yang sudah MASTERED
    prisma.flashcard.count({ 
      where: { status: 'MASTERED' } 
    }),
    prisma.history.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.dailyProgress.findUnique({
      where: { date: new Date().toISOString().split('T')[0] }
    })
  ]);

  // 2. Hitung Token Usage
  const tokenAggregate = await prisma.history.aggregate({ _sum: { tokens: true } });
  
  // Placeholder streak (bisa dikembangkan nanti)
  const streakCount = 0; 

  // 3. Transform History Data
  // Kita lakukan mapping manual karena tipe kembalian Prisma mungkin berbeda
  const recentActivity: HistoryItem[] = historyRaw.map(h => ({
    id: h.id,
    feature: h.feature,
    details: h.details,
    source: (h.source === 'CACHE' ? 'CACHE' : 'API') as 'API' | 'CACHE',
    tokens: h.tokens,
    timestamp: h.createdAt
  }));

  // 4. Prepare Stats Prop
  const stats = {
    challengesCompleted: dailyProgress ? dailyProgress.completed.length : 0,
    masteredVocab: masteredCards, // Gunakan hasil count dari flashcard
    monthlyTokens: tokenAggregate._sum.tokens || 0,
    streak: streakCount
  };

  return (
    <div className="h-full">
      <Dashboard stats={stats} recentActivity={recentActivity} />
    </div>
  );
}