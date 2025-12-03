'use client';

import { useState, useEffect } from 'react';
import { 
  Play, Layers, Zap, Brain, Plus, 
  LayoutGrid, History, RotateCcw, Search
} from 'lucide-react';
import { FlashcardSession } from '@/features/flashcard/components/flashcardSession';
import { FlashcardItem } from '@/features/flashcard/components/flashcardItem'; 
import { DBService } from '@/shared/services/dbService';
import { Flashcard } from '@/shared/types';

// Tipe untuk Tab Navigasi
type FlashcardTab = 'COLLECTION' | 'RECALL' | 'HISTORY';

export default function FlashcardPage() {
  const [activeTab, setActiveTab] = useState<FlashcardTab>('COLLECTION');
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(''); 

  // State khusus untuk sesi recall (Game Mode)
  const [isSessionActive, setIsSessionActive] = useState(false);

  // Fetch Data saat Tab Berubah atau Sesi Selesai
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Ambil semua kartu (Mode ALL)
        const data = await DBService.getFlashcards(false);
        setCards(data);
      } catch (error) {
        console.error("Gagal memuat kartu", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!isSessionActive) {
      fetchData();
    }
  }, [activeTab, isSessionActive]);

  // --- FILTERING LOGIC ---
  const filteredCards = cards.filter(c => 
    (c.dictionaryEntry?.word?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (c.dictionaryEntry?.meaning?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const collectionCards = filteredCards.filter(c => c.status !== 'MASTERED');
  const historyCards = filteredCards.filter(c => c.status === 'MASTERED');
  
  const dueCardsCount = cards.filter(c => {
    if (c.status === 'MASTERED') return false;
    if (c.status === 'NEW') return true;
    if (!c.nextReviewDate) return false;
    return new Date(c.nextReviewDate) <= new Date();
  }).length;

  // --- VIEW 1: RECALL SESSION (Fokus Mode) ---
  if (isSessionActive) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center pt-8 px-4 animate-fade-in">
        <div className="w-full max-w-md flex justify-between items-center mb-8">
           <button 
             onClick={() => setIsSessionActive(false)}
             className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
           >
             &larr; Kembali
           </button>
           <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">Review Mode</span>
        </div>
        {/* Komponen Session akan menangani logika quiz */}
        <FlashcardSession 
          mode="REVIEW_ONLY" 
          onExit={() => setIsSessionActive(false)} 
        />
      </div>
    );
  }

  // --- VIEW 2: MAIN DASHBOARD ---
  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 font-sans animate-slide-up px-4">
      
      {/* HEADER STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
               <Zap size={20} />
            </div>
            <div>
               <p className="text-xs font-bold text-slate-400 uppercase">Siap Review</p>
               <h3 className="text-2xl font-black text-slate-800">{dueCardsCount}</h3>
            </div>
         </div>
         <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center">
               <Layers size={20} />
            </div>
            <div>
               <p className="text-xs font-bold text-slate-400 uppercase">Koleksi Aktif</p>
               <h3 className="text-2xl font-black text-slate-800">{cards.filter(c => c.status !== 'MASTERED').length}</h3>
            </div>
         </div>
         <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
               <Brain size={20} />
            </div>
            <div>
               <p className="text-xs font-bold text-slate-400 uppercase">Mastered</p>
               <h3 className="text-2xl font-black text-slate-800">{cards.filter(c => c.status === 'MASTERED').length}</h3>
            </div>
         </div>
      </div>

      {/* NAVIGATION & SEARCH */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 w-full md:w-auto overflow-x-auto">
          <button 
            onClick={() => setActiveTab('COLLECTION')} 
            className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all whitespace-nowrap ${activeTab === 'COLLECTION' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <LayoutGrid size={16} /> Koleksi
          </button>
          <button 
            onClick={() => setActiveTab('RECALL')} 
            className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all whitespace-nowrap ${activeTab === 'RECALL' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <RotateCcw size={16} /> Recall
          </button>
          <button 
            onClick={() => setActiveTab('HISTORY')} 
            className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all whitespace-nowrap ${activeTab === 'HISTORY' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <History size={16} /> History
          </button>
        </div>

        {activeTab !== 'RECALL' && (
           <div className="relative w-full md:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input 
               type="text" 
               placeholder="Cari kartu..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
             />
           </div>
        )}
      </div>

      {/* --- CONTENT AREA --- */}
      
      {/* TAB 1: COLLECTION (Interactive Grid) */}
      {activeTab === 'COLLECTION' && (
        <div className="space-y-6 animate-fade-in">
           {isLoading ? (
             <p className="text-center text-slate-400 py-20">Memuat koleksi...</p>
           ) : collectionCards.length === 0 ? (
             <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 bg-slate-50/50">
               <p className="mb-4">Belum ada kartu aktif.</p>
               <a href="/story" className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:underline bg-indigo-50 px-4 py-2 rounded-xl transition-colors">
                 <Plus size={16}/> Tambah dari Story Lab
               </a>
             </div>
           ) : (
             // Menggunakan CSS Grid dengan gap yang rapi
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
               {collectionCards.map((card) => (
                 <div key={card.id} className="w-full">
                    {/* Menggunakan FlashcardItem dengan tinggi custom agar pas di grid */}
                    <FlashcardItem 
                       card={card} 
                       mode="VIEW" 
                       className="h-[320px]" // Lebih pendek dari mode Quiz agar compact
                    />
                 </div>
               ))}
             </div>
           )}
        </div>
      )}

      {/* TAB 2: RECALL (Start Button) */}
      {activeTab === 'RECALL' && (
        <div className="animate-fade-in text-center py-20 bg-white rounded-3xl border border-indigo-100 shadow-sm">
           <div className="w-24 h-24 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <RotateCcw size={48} />
           </div>
           <h2 className="text-3xl font-black text-slate-800 mb-3">Sesi Latihan SRS</h2>
           <p className="text-slate-500 mb-8 max-w-md mx-auto leading-relaxed">
             Sistem Spaced Repetition telah menjadwalkan <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{dueCardsCount} kartu</span> untuk kamu review sekarang agar ingatanmu tetap tajam.
           </p>
           <button 
              onClick={() => setIsSessionActive(true)}
              disabled={dueCardsCount === 0}
              className="inline-flex items-center gap-3 px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-200 hover:shadow-2xl active:scale-95"
           >
             {dueCardsCount > 0 ? 'Mulai Sesi Review' : 'Semua Selesai!'} <Play size={20} fill="currentColor" />
           </button>
           {dueCardsCount === 0 && (
              <p className="mt-6 text-sm text-emerald-600 font-bold bg-emerald-50 inline-block px-4 py-2 rounded-full">
                🎉 Kamu sudah menyelesaikan semua target hari ini!
              </p>
           )}
        </div>
      )}

      {/* TAB 3: HISTORY (Mastered Grid) */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-6 animate-fade-in">
           {historyCards.length === 0 ? (
             <div className="text-center py-20 border-2 border-dashed border-emerald-100 bg-emerald-50/30 rounded-3xl text-emerald-600">
               <Brain size={48} className="mx-auto mb-4 opacity-50"/>
               <p>Belum ada kartu yang dikuasai (Mastered). Teruslah berlatih!</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
               {historyCards.map((card) => (
                 <div key={card.id} className="w-full opacity-80 hover:opacity-100 transition-opacity">
                    {/* Kartu Mastered menggunakan komponen yang sama */}
                    <FlashcardItem 
                      card={card} 
                      mode="VIEW"
                      className="h-[320px]"
                    />
                 </div>
               ))}
             </div>
           )}
        </div>
      )}

    </div>
  );
}