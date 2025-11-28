import { prisma } from "@/shared/lib/prisma"; // <-- Path Baru
import Dashboard from "@/features/dashboard/components/Dashboard"; // <-- Path Baru
import { HistoryItem } from "@/shared/types"; // <-- Path Baru

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [vocabStats, historyRaw, dailyProgress] = await Promise.all([
    prisma.vocab.findMany({ select: { mastered: true } }),
    prisma.history.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.dailyProgress.findUnique({
      where: { date: new Date().toISOString().split('T')[0] }
    })
  ]);

  const masteredCount = vocabStats.filter(v => v.mastered).length;
  const tokenAggregate = await prisma.history.aggregate({ _sum: { tokens: true } });
  const streakCount = 0; 

  const recentActivity: HistoryItem[] = historyRaw.map(h => ({
    id: h.id,
    feature: h.feature,
    details: h.details,
    source: h.source as 'API' | 'CACHE',
    tokens: h.tokens,
    timestamp: h.createdAt
  }));

  const stats = {
    challengesCompleted: dailyProgress ? dailyProgress.completed.length : 0,
    masteredVocab: masteredCount,
    monthlyTokens: tokenAggregate._sum.tokens || 0,
    streak: streakCount
  };

  return (
    <div className="h-full">
      <Dashboard stats={stats} recentActivity={recentActivity} />
    </div>
  );
}