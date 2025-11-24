'use client';

// FIXED: Hapus 'React' dari import. Gunakan named imports saja.
import { useEffect, useState, type FC } from 'react';
import { DBService } from '@/services/dbService'; 
import { HistoryItem } from '@/types';
import { Trophy, Zap, Brain, Activity, Calendar } from 'lucide-react';

const Dashboard: FC = () => {
  const [stats, setStats] = useState({
    challengesCompleted: 0, 
    masteredVocab: 0,
    monthlyTokens: 0,
    streak: 0 
  });

  const [recentActivity, setRecentActivity] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        // 1. Load Vocab dari DB
        const vocabs = await DBService.getVocabs();
        const masteredCount = vocabs.filter(v => v.mastered).length;

        // 2. Load History dari DB
        const history = await DBService.getHistory();
        setRecentActivity(history.slice(0, 5)); // Ambil 5 terakhir

        // 3. Hitung Tokens dari History DB
        const totalTokens = history.reduce((acc, curr) => acc + (curr.tokens || 0), 0);

        // 4. Hitung Streak (Logic sederhana berdasarkan tanggal unik di history)
        const uniqueDays = new Set(
          history.map(h => new Date(h.timestamp).toDateString())
        );

        setStats({
          challengesCompleted: 0, // Nanti ambil dari API DailyProgress
          masteredVocab: masteredCount,
          monthlyTokens: totalTokens,
          streak: uniqueDays.size
        });

      } catch (error) {
        console.error("Failed to load dashboard data", error);
      }
    };

    loadStats();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Dashboard Belajar</h2>
          <p className="text-slate-500">Pantau progres dan pencapaianmu sejauh ini.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
           <Calendar size={18} className="text-blue-500"/>
           <span className="text-sm font-medium text-slate-600">
             {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
           </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Trophy size={80} className="text-blue-600" />
           </div>
           <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                 <Trophy size={24} />
              </div>
              <h3 className="font-semibold text-slate-700">Tantangan Selesai</h3>
           </div>
           <div className="space-y-1">
              <span className="text-4xl font-bold text-slate-900">{stats.challengesCompleted}</span>
              <p className="text-sm text-slate-500">Sesi latihan diselesaikan</p>
           </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Brain size={80} className="text-purple-600" />
           </div>
           <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                 <Brain size={24} />
              </div>
              <h3 className="font-semibold text-slate-700">Kata Dikuasai</h3>
           </div>
           <div className="space-y-1">
              <span className="text-4xl font-bold text-slate-900">{stats.masteredVocab}</span>
              <p className="text-sm text-slate-500">Flashcard dihafal permanen</p>
           </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Zap size={80} className="text-amber-500" />
           </div>
           <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                 <Zap size={24} />
              </div>
              <h3 className="font-semibold text-slate-700">Token AI Terpakai</h3>
           </div>
           <div className="space-y-1">
              <span className="text-4xl font-bold text-slate-900">{stats.monthlyTokens.toLocaleString()}</span>
              <p className="text-sm text-slate-500">Token bulan ini</p>
           </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
           <Activity className="text-slate-400" size={20} />
           <h3 className="text-lg font-bold text-slate-800">Aktivitas Terakhir</h3>
        </div>
        
        <div className="space-y-4">
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-slate-400 italic">
               Belum ada aktivitas tercatat di Database.
            </div>
          ) : (
            recentActivity.map((item) => (
              <div key={item.id} className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                 <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                    item.source === 'CACHE' ? 'bg-green-400' : 'bg-amber-400'
                 }`} />
                 <div className="flex-1">
                    <div className="flex justify-between items-start">
                       <h4 className="font-semibold text-slate-800 text-sm">{item.feature}</h4>
                       <span className="text-xs text-slate-400">
                          {item.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                       </span>
                    </div>
                    <p className="text-slate-600 text-sm mt-1">{item.details}</p>
                    <div className="mt-2 flex items-center gap-2">
                       <span className="text-[10px] px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-500 uppercase tracking-wide">
                          {item.source}
                       </span>
                       {item.tokens !== undefined && item.tokens > 0 && (
                          <span className="text-[10px] text-slate-400">
                             {item.tokens} tokens
                          </span>
                       )}
                    </div>
                 </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;