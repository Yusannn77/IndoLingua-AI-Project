'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Layers, RotateCcw, Archive, Sparkles, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { GeminiService } from '@/services/geminiService';
import { StoryScenario, SavedVocab, ChallengeFeedback } from '@/types';
import { storyCollection } from '@/data/storyData';

const STORAGE_KEY = 'indolingua_vocab_v1';
const ITEMS_PER_PAGE = 5;

type LabMode = 'STORY' | 'FLASHCARD' | 'RECALL' | 'HISTORY';

const StoryLab: React.FC = () => {
  const [mode, setMode] = useState<LabMode>('STORY');
  
  const [savedVocabs, setSavedVocabs] = useState<SavedVocab[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
      }
    } catch (error) {
      console.error("Gagal membaca storage:", error);
    }
    return [];
  });

  const [scenario, setScenario] = useState<StoryScenario | null>(null);
  const [userTranslation, setUserTranslation] = useState('');
  const [storyFeedback, setStoryFeedback] = useState<ChallengeFeedback | null>(null);
  const [loadingStory, setLoadingStory] = useState(false);
  const [loadingWord, setLoadingWord] = useState<string | null>(null);

  const [recallCard, setRecallCard] = useState<SavedVocab | null>(null);
  const [recallInput, setRecallInput] = useState('');
  const [recallStatus, setRecallStatus] = useState<'IDLE' | 'CORRECT' | 'WRONG'>('IDLE');

  const [historyPage, setHistoryPage] = useState(1);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedVocabs));
  }, [savedVocabs]);

  useEffect(() => {
    loadNewScenario();
  }, []);

  const loadNewScenario = () => {
    setLoadingStory(true);
    setStoryFeedback(null);
    setUserTranslation('');
    const randomIndex = Math.floor(Math.random() * storyCollection.length);
    const data = storyCollection[randomIndex];
    setScenario({ sentence: data.english, translation: "" });
    setTimeout(() => setLoadingStory(false), 300);
  };

  const handleCheckStory = async () => {
    if (!scenario || !userTranslation) return;
    setLoadingStory(true);
    try {
      const result = await GeminiService.evaluateStoryTranslation(scenario.sentence, userTranslation);
      setStoryFeedback(result);
    } catch (e) { console.error(e); } 
    finally { setLoadingStory(false); }
  };

  const handleWordClick = async (word: string) => {
    const cleanWord = word.replace(/[.,!?;:"'()]/g, "").toLowerCase();
    if (savedVocabs.some(v => v.word.toLowerCase() === cleanWord)) {
      alert(`Kata "${cleanWord}" sudah ada di Flash Card!`);
      return;
    }
    setLoadingWord(cleanWord);
    try {
      const translation = await GeminiService.getWordDefinition(cleanWord, scenario?.sentence || "");
      const newVocab: SavedVocab = {
        id: Date.now().toString() + Math.random().toString().slice(2,5),
        word: cleanWord,
        originalSentence: scenario?.sentence || "",
        translation: translation, 
        mastered: false,
        timestamp: Date.now()
      };
      setSavedVocabs(prev => [newVocab, ...prev]);
    } catch (error) { console.error(error); } 
    finally { setLoadingWord(null); }
  };

  const handleDeleteVocab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    setSavedVocabs(prev => prev.filter(v => v.id !== id));
  };

  const renderInteractiveSentence = (text: string) => {
    return text.split(' ').map((word, idx) => {
        const cleanWord = word.replace(/[.,!?;:"'()]/g, "").toLowerCase();
        const isLoading = loadingWord === cleanWord;
        return (
            <span key={idx} onClick={() => !isLoading && handleWordClick(word)}
                className={`inline-block mx-0.5 px-1 rounded transition-all cursor-pointer border-b-2 border-transparent ${isLoading ? 'bg-slate-200 text-slate-400 animate-pulse' : 'hover:bg-purple-100 hover:text-purple-700 hover:border-purple-300'}`}>
                {word}
            </span>
        );
    });
  };

  const startRecall = () => {
    setMode('RECALL');
    pickNextRecallCard(savedVocabs);
  };

  const pickNextRecallCard = (currentList?: SavedVocab[]) => {
    const sourceList = currentList || savedVocabs;
    setRecallInput('');
    setRecallStatus('IDLE');
    const activeList = sourceList.filter(v => !v.mastered);
    if (activeList.length === 0) {
      setRecallCard(null); 
      return;
    }
    const random = activeList[Math.floor(Math.random() * activeList.length)];
    setRecallCard(random);
  };

  const submitRecall = () => {
    if (!recallCard) return;
    const cleanInput = recallInput.toLowerCase().trim();
    const targetWord = recallCard.word.toLowerCase();

    if (cleanInput === targetWord) {
      setRecallStatus('CORRECT');
      setTimeout(() => {
        const updatedList = savedVocabs.map(v => 
          v.id === recallCard.id ? { ...v, mastered: true } : v
        );
        setSavedVocabs(updatedList);
        pickNextRecallCard(updatedList);
      }, 1200);
    } else {
      setRecallStatus('WRONG');
    }
  };

  const historyList = savedVocabs.filter(v => v.mastered);
  const totalHistoryPages = Math.ceil(historyList.length / ITEMS_PER_PAGE);
  const currentHistoryData = historyList.slice((historyPage - 1) * ITEMS_PER_PAGE, historyPage * ITEMS_PER_PAGE);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-wrap justify-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm w-fit mx-auto">
        <button onClick={() => setMode('STORY')} className={`px-4 py-2 rounded-lg font-medium text-sm flex gap-2 ${mode === 'STORY' ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:bg-slate-50'}`}>
          <BookOpen size={16} /> Story
        </button>
        <button onClick={() => setMode('FLASHCARD')} className={`px-4 py-2 rounded-lg font-medium text-sm flex gap-2 relative ${mode === 'FLASHCARD' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}>
          <Layers size={16} /> Flash Card
          {savedVocabs.filter(v => !v.mastered).length > 0 && (
             <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full absolute -top-1 -right-1">{savedVocabs.filter(v => !v.mastered).length}</span>
          )}
        </button>
        <button onClick={startRecall} className={`px-4 py-2 rounded-lg font-medium text-sm flex gap-2 ${mode === 'RECALL' ? 'bg-amber-100 text-amber-700' : 'text-slate-500 hover:bg-slate-50'}`}>
          <RotateCcw size={16} /> Recall
        </button>
        <button onClick={() => setMode('HISTORY')} className={`px-4 py-2 rounded-lg font-medium text-sm flex gap-2 ${mode === 'HISTORY' ? 'bg-green-100 text-green-700' : 'text-slate-500 hover:bg-slate-50'}`}>
          <Archive size={16} /> History
        </button>
      </div>

      {mode === 'STORY' && (
        <div className="animate-fade-in space-y-6">
          <div className="bg-white p-6 md:p-10 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles size={100} /></div>
             <div className="mb-6 flex justify-between items-center relative z-10">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Story Context</span>
                <span className="text-xs text-purple-600 bg-purple-50 px-3 py-1.5 rounded-full font-medium">Klik kata untuk simpan</span>
             </div>
             {!scenario ? (
               <div className="space-y-3 animate-pulse">
                  <div className="h-6 bg-slate-100 rounded w-full"></div>
                  <div className="h-6 bg-slate-100 rounded w-2/3"></div>
               </div>
             ) : (
               <p className="text-2xl md:text-3xl font-serif text-slate-800 leading-relaxed relative z-10">
                 {renderInteractiveSentence(scenario.sentence)}
               </p>
             )}
             <div className="mt-10 pt-8 border-t border-slate-100 relative z-10">
               <label className="block text-sm font-medium text-slate-600 mb-2">Terjemahanmu:</label>
               <textarea value={userTranslation} onChange={e => setUserTranslation(e.target.value)} className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none bg-slate-50 focus:bg-white" placeholder="Artikan kalimat..." rows={2} />
               <div className="mt-4 flex justify-between items-center">
                  <button onClick={loadNewScenario} className="text-slate-500 hover:text-slate-700 text-sm flex items-center gap-1 font-medium px-2 py-1 hover:bg-slate-100 rounded-lg transition-colors"><RotateCcw size={14} /> Ganti Cerita</button>
                  <button onClick={handleCheckStory} disabled={loadingStory || !userTranslation} className="bg-purple-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 shadow-sm">{loadingStory ? '...' : 'Cek Arti'}</button>
               </div>
             </div>
          </div>
          {storyFeedback && (
             <div className="bg-green-50 border border-green-100 p-6 rounded-2xl animate-slide-up">
                <div className="flex items-center gap-2 mb-3 font-bold text-green-800">Skor AI: {storyFeedback.score}/10</div>
                <p className="text-slate-700 mb-2">&quot;{storyFeedback.feedback}&quot;</p>
                <p className="text-slate-900 italic font-medium mt-2">&quot;{storyFeedback.improved_response}&quot;</p>
             </div>
          )}
        </div>
      )}

      {mode === 'FLASHCARD' && (
        <div className="animate-fade-in">
           <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">Daftar Hafalan</h2>
              <p className="text-slate-500 text-sm">Pelajari sebelum masuk Recall.</p>
           </div>
           {savedVocabs.filter(v => !v.mastered).length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
                 <p className="text-slate-400">Flash Card kosong. Tambah dari Story Mode.</p>
              </div>
           ) : (
              <div className="grid md:grid-cols-2 gap-4">
                 {savedVocabs.filter(v => !v.mastered).map((vocab) => (
                    <div key={vocab.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative">
                       <div className="flex justify-between items-start mb-2">
                          <h3 className="text-xl font-bold text-blue-600">{vocab.word}</h3>
                          <button onClick={(e) => handleDeleteVocab(vocab.id, e)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                       </div>
                       <div className="mb-3"><p className="text-sm text-slate-400 font-medium uppercase mb-1">Arti:</p><p className="text-lg text-slate-800 font-medium">{vocab.translation}</p></div>
                       <div className="bg-slate-50 p-3 rounded-lg border border-slate-100"><p className="text-xs text-slate-400 mb-1">Konteks:</p><p className="text-xs text-slate-600 italic">&quot;...{vocab.originalSentence}...&quot;</p></div>
                    </div>
                 ))}
              </div>
           )}
        </div>
      )}

      {mode === 'RECALL' && (
        <div className="animate-fade-in max-w-xl mx-auto">
           {!recallCard ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm">
                 <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6"><Sparkles size={40} /></div>
                 <h2 className="text-2xl font-bold text-slate-800 mb-2">Luar Biasa!</h2>
                 <p className="text-slate-500 mb-6">Semua kata sudah kamu kuasai.</p>
                 <button onClick={() => setMode('HISTORY')} className="text-purple-600 font-medium hover:underline">Lihat History Hafalan</button>
              </div>
           ) : (
              <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden relative">
                 <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 to-orange-500"></div>
                 <div className="p-8 text-center border-b border-slate-100 bg-slate-50/30">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Recall Challenge</p>
                    <div className="mb-8"><p className="text-sm text-slate-500 mb-2">Apa Bahasa Inggris dari:</p><h2 className="text-3xl md:text-4xl font-bold text-slate-800">&quot;{recallCard.translation}&quot;</h2></div>
                    <div className="inline-block bg-white p-4 rounded-xl border border-slate-200 shadow-sm max-w-sm"><p className="text-xs text-slate-400 mb-1 font-bold">Konteks Kalimat:</p><p className="text-sm text-slate-600 italic">&quot;...{recallCard.originalSentence.replace(new RegExp(recallCard.word, 'gi'), '_____')}...&quot;</p></div>
                 </div>
                 <div className="p-6 space-y-4">
                    {recallStatus === 'IDLE' ? (
                       <form onSubmit={(e) => { e.preventDefault(); submitRecall(); }}>
                          <input type="text" value={recallInput} onChange={e => setRecallInput(e.target.value)} placeholder="Ketik kata bahasa Inggris..." className="w-full text-center text-xl p-4 border border-slate-300 rounded-xl focus:ring-4 focus:ring-amber-100 focus:border-amber-400 outline-none transition-all mb-4" autoFocus />
                          <button type="submit" className="w-full py-3.5 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 shadow-md shadow-amber-200 transition-transform active:scale-95">Cek Jawaban</button>
                       </form>
                    ) : (
                       <div className="text-center animate-fade-in py-2">
                          {recallStatus === 'CORRECT' ? (
                             <div className="animate-bounce-in">
                                <div className="text-green-600 font-bold text-2xl flex justify-center items-center gap-2 mb-6"><Sparkles className="fill-green-100" /> Benar!</div>
                                <p className="text-lg text-slate-800 font-bold mb-4">{recallCard.word}</p>
                                <p className="text-sm text-slate-400 italic animate-pulse">Menyimpan & Lanjut...</p>
                             </div>
                          ) : (
                             <div>
                                <div className="text-red-500 font-bold text-xl mb-4">Kurang Tepat</div>
                                <p className="text-slate-500 mb-1">Jawaban benar:</p>
                                <p className="text-2xl font-bold text-slate-800 mb-6">{recallCard.word}</p>
                                <button onClick={() => { setRecallInput(''); setRecallStatus('IDLE'); }} className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">Coba Lagi</button>
                             </div>
                          )}
                       </div>
                    )}
                 </div>
              </div>
           )}
        </div>
      )}

      {mode === 'HISTORY' && (
        <div className="animate-fade-in">
           <div className="text-center mb-8"><h2 className="text-xl font-bold text-slate-800">Kamus Pribadi (Mastered)</h2><p className="text-slate-500 text-sm">Kata-kata yang sudah dikuasai.</p></div>
           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                 <thead className="bg-slate-50 border-b border-slate-200"><tr><th className="p-4 text-xs font-bold text-slate-500 uppercase">Word</th><th className="p-4 text-xs font-bold text-slate-500 uppercase">Meaning</th><th className="p-4 text-xs font-bold text-slate-500 uppercase hidden md:table-cell">Context</th></tr></thead>
                 <tbody className="divide-y divide-slate-100">
                    {currentHistoryData.length === 0 ? (<tr><td colSpan={3} className="p-8 text-center text-slate-400">Belum ada data.</td></tr>) : (
                       currentHistoryData.map((vocab) => (
                          <tr key={vocab.id} className="hover:bg-slate-50/50"><td className="p-4 font-bold text-slate-800">{vocab.word}</td><td className="p-4 text-slate-600">{vocab.translation}</td><td className="p-4 text-slate-500 text-sm italic hidden md:table-cell truncate max-w-xs">&quot;{vocab.originalSentence}&quot;</td></tr>
                       ))
                    )}
                 </tbody>
              </table>
              {historyList.length > 0 && (
                 <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50/30">
                    <span className="text-sm text-slate-500">Halaman {historyPage} dari {totalHistoryPages || 1}</span>
                    <div className="flex gap-2">
                       <button onClick={() => setHistoryPage(p => Math.max(1, p - 1))} disabled={historyPage === 1} className="p-2 border border-slate-300 rounded-lg hover:bg-white disabled:opacity-50"><ChevronLeft size={16} /></button>
                       <button onClick={() => setHistoryPage(p => Math.min(totalHistoryPages, p + 1))} disabled={historyPage === totalHistoryPages} className="p-2 border border-slate-300 rounded-lg hover:bg-white disabled:opacity-50"><ChevronRight size={16} /></button>
                    </div>
                 </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default StoryLab;