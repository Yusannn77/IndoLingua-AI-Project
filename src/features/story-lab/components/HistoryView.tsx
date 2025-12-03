import { useState } from 'react';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { DictionaryEntry } from '@/shared/types';

const ITEMS_PER_PAGE = 6;

export const HistoryView = ({ vocabList }: { vocabList: DictionaryEntry[] }) => {
  const [page, setPage] = useState(1);
  
  const historyList = vocabList
    .sort((a, b) => {
      // SAFETY: Pastikan createdAt ada, jika tidak pakai 0 (terlama)
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA; 
    });
  
  const totalPages = Math.ceil(historyList.length / ITEMS_PER_PAGE) || 1;
  const currentData = historyList.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 p-4 px-6 flex items-center justify-between">
          <h3 className="font-bold text-slate-700 flex items-center gap-2">
            <BookOpen size={18} className="text-blue-500"/> Saved Words
          </h3>
          <span className="text-xs font-medium bg-white px-2 py-1 rounded-md border border-slate-200 text-slate-500">
            Total: {historyList.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs font-bold text-slate-400 uppercase border-b border-slate-100">
                <th className="p-6 w-1/4">Word</th>
                <th className="p-6 w-1/3">Meaning</th>
                <th className="p-6">Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-12 text-center text-slate-400 italic">Belum ada kata tersimpan.</td>
                </tr>
              ) : (
                currentData.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-6 align-top">
                      <span className="font-bold text-slate-800 text-lg block">{entry.word || "Unknown"}</span>
                      {entry.category && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full font-bold border border-blue-200 mt-1 uppercase tracking-wide">
                          {entry.category}
                        </span>
                      )}
                      <span className="block text-[10px] text-slate-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : "-"}
                      </span>
                    </td>
                    <td className="p-6 align-top">
                      <p className="text-slate-700 font-medium leading-relaxed">{entry.meaning || "-"}</p>
                      {entry.synonyms && entry.synonyms.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {entry.synonyms.slice(0, 3).map((syn, idx) => (
                            <span key={idx} className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{syn}</span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="p-6 align-top">
                      <p className="text-slate-500 text-sm italic opacity-70 group-hover:opacity-100 transition-opacity leading-relaxed border-l-2 border-slate-200 pl-3">
                        &quot;{entry.contextUsage || "-"}&quot;
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {historyList.length > 0 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
            <p className="text-sm text-slate-500 pl-2">Halaman <span className="font-bold text-slate-800">{page}</span> dari <span className="font-bold text-slate-800">{totalPages}</span></p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold transition-colors text-slate-600 shadow-sm"><ChevronLeft size={16} /> Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold transition-colors text-slate-600 shadow-sm">Next <ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};