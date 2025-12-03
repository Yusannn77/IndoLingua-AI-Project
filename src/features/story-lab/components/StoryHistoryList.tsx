import { FC } from 'react';
import { StoryAttempt } from '@/shared/types';
import { Clock, Star, AlertCircle, CheckCircle2 } from 'lucide-react';

interface StoryHistoryListProps {
  historyLogs: StoryAttempt[];
}

const ScoreBadge = ({ score }: { score: number }) => {
  let colorClass = "bg-slate-100 text-slate-600 border-slate-200";
  let Icon = Clock;

  if (score >= 80) {
    colorClass = "bg-emerald-100 text-emerald-700 border-emerald-200";
    Icon = CheckCircle2;
  } else if (score >= 50) {
    colorClass = "bg-amber-100 text-amber-700 border-amber-200";
    Icon = Star;
  } else {
    colorClass = "bg-red-100 text-red-700 border-red-200";
    Icon = AlertCircle;
  }

  return (
    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${colorClass}`}>
      <Icon size={14} /> Score: {score}
    </span>
  );
};

export const StoryHistoryList: FC<StoryHistoryListProps> = ({ historyLogs }) => {
  if (historyLogs.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
        <p className="text-slate-400 font-medium">Belum ada riwayat latihan.</p>
        <p className="text-sm text-slate-300 mt-1">Selesaikan cerita pertamamu!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {historyLogs.map((log) => (
        <div key={log.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all">
          
          {/* Header Card */}
          <div className="flex justify-between items-start mb-3 border-b border-slate-50 pb-3">
            <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">
              {new Date(log.createdAt).toLocaleDateString('id-ID', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit'
              })}
            </span>
            <ScoreBadge score={log.score} />
          </div>

          {/* Content */}
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Soal (English)</p>
              {/* FIX: Syntax JSX yang benar untuk menampilkan string dengan tanda kutip */}
              <p className="text-slate-800 font-medium italic">&quot;{log.englishText}&quot;</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Jawaban Kamu</p>
              {/* FIX: Syntax JSX yang benar */}
              <p className="text-slate-700">&quot;{log.userTranslation}&quot;</p>
            </div>
          </div>

          {/* Feedback AI */}
          <div className="mt-4 pt-3 border-t border-slate-100 bg-slate-50/50 -mx-5 -mb-5 p-4 rounded-b-2xl">
            <div className="flex gap-2">
              <span className="text-blue-500 font-bold text-xs shrink-0 mt-0.5">AI FEEDBACK:</span>
              <p className="text-slate-600 text-xs leading-relaxed">{log.aiFeedback}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};