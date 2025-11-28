import { useState } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, CheckCircle2 } from 'lucide-react';
import { SavedVocab } from '@/shared/types'; // <-- Path Baru

const ITEMS_PER_PAGE = 6;

export const HistoryView = ({ vocabList }: { vocabList: SavedVocab[] }) => {
  const [page, setPage] = useState(1);
  
  // 1. Filter: Ambil yang sudah hafal (Mastered)
  // 2. Sort: Berdasarkan timestamp (Terbaru di atas)
  const historyList = vocabList
    .filter(v => v.mastered)
    .sort((a, b) => {
      // Prioritaskan updatedAt, jika tidak ada gunakan timestamp (created at), atau 0
      const timeA = a.updatedAt || a.timestamp || 0;
      const timeB = b.updatedAt || b.timestamp || 0;
      return timeB - timeA; // Descending (Newest First)
    });
  
  // DEFINISI VARIABEL YANG BENAR: totalPages
  const totalPages = Math.ceil(historyList.length / ITEMS_PER_PAGE);
  
  const currentData = historyList.slice(
    (page - 1) * ITEMS_PER_PAGE, 
    page * ITEMS_PER_PAGE
  );

  return (
    <div className="animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 px-6 flex items-center justify-between">
          <h3 className="font-bold text-slate-700 flex items-center gap-2">
            <BookOpen size={18} className="text-blue-500"/> Mastered Words
          </h3>
          <span className="text-xs font-medium bg-white px-2 py-1 rounded-md border border-slate-200 text-slate-500">
            Total: {historyList.length}
          </span>
        </div>

        {/* Table Body */}
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
                  <td colSpan={3} className="p-12 text-center text-slate-400 italic">
                    Belum ada kata yang dikuasai. Selesaikan Recall Challenge untuk menambah daftar ini!
                  </td>
                </tr>
              ) : (
                currentData.map((vocab) => (
                  <tr key={vocab.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-6 align-top">
                      <span className="font-bold text-slate-800 text-lg block">{vocab.word}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-green-700 bg-green-100 px-2 py-0.5 rounded-full font-bold border border-green-200 mt-1">
                        <CheckCircle2 size={10} /> MASTERED
                      </span>
                      {/* Debug: Tanggal Update */}
                      <span className="block text-[10px] text-slate-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {new Date(vocab.updatedAt || vocab.timestamp).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-6 align-top">
                      <p className="text-slate-700 font-medium leading-relaxed">{vocab.translation}</p>
                    </td>
                    <td className="p-6 align-top">
                      <p className="text-slate-500 text-sm italic opacity-70 group-hover:opacity-100 transition-opacity leading-relaxed">
                        &quot;{vocab.originalSentence}&quot;
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {historyList.length > 0 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
            <p className="text-sm text-slate-500 pl-2">
              {/* FIX: Gunakan variabel 'totalPages' yang benar */}
              Halaman <span className="font-bold text-slate-800">{page}</span> dari <span className="font-bold text-slate-800">{totalPages || 1}</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold transition-colors text-slate-600 shadow-sm"
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold transition-colors text-slate-600 shadow-sm"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};