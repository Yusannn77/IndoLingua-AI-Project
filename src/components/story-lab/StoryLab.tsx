'use client';

import { useState, useEffect, FC, MouseEvent } from 'react';
import { 
  BookOpen, Layers, RotateCcw, Archive, Sparkles, 
  Trash2, Lightbulb, Plus, RotateCcw as ReloadIcon, Loader2,
  CheckCircle2, ThumbsUp 
} from 'lucide-react';

import { useStoryLogic } from './useStoryLogic';
import { RecallView } from './RecallView';
import { HistoryView } from './HistoryView';

import { GeminiService } from '@/services/geminiService';
import { DBService } from '@/services/dbService';
import { 
  StoryScenario, ChallengeFeedback, 
  VocabRecommendation, CachedAnalysis,
  LabMode 
} from '@/types';
import { storyCollection } from '@/data/storyData';

const CACHE_DURATION = 24 * 60 * 60 * 1000;

const StoryLab: FC = () => {
  const [mode, setMode] = useState<LabMode>('STORY');
  const { 
    savedVocabs, 
    addVocabOptimistic, 
    updateVocabMastery, 
    deleteVocabOptimistic 
  } = useStoryLogic();

  // --- STORY STATE ---
  const [scenario, setScenario] = useState<StoryScenario | null>(null);
  const [userTranslation, setUserTranslation] = useState('');
  const [storyFeedback, setStoryFeedback] = useState<ChallengeFeedback | null>(null);
  const [loadingStory, setLoadingStory] = useState(false);
  const [loadingWord, setLoadingWord] = useState<string | null>(null);
  
  // --- RECOMMENDATION STATE ---
  const [recommendations, setRecommendations] = useState<VocabRecommendation[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [_recError, setRecError] = useState<string | null>(null); // renamed to _recError to silence unused var warning

  useEffect(() => {
    loadNewScenario();
  }, []);

  useEffect(() => {
    if (scenario?.sentence) {
      fetchAndCacheRecommendations(scenario.sentence);
    }
  }, [scenario]);

  const fetchAndCacheRecommendations = async (sentence: string) => {
    setRecommendations([]);
    setRecError(null);
    setLoadingRecs(true);

    const cacheKey = `vocab_analysis_${btoa(sentence.slice(0, 30))}`;
    
    try {
      const cachedRaw = localStorage.getItem(cacheKey);
      if (cachedRaw) {
        const cached: CachedAnalysis = JSON.parse(cachedRaw);
        if (Date.now() - cached.timestamp < CACHE_DURATION) {
          setRecommendations(cached.recommendations);
          setLoadingRecs(false);
          return;
        }
      }

      const { recommendations: newRecs } = await GeminiService.analyzeStoryVocab(sentence);
      
      if (newRecs && newRecs.length > 0) {
        setRecommendations(newRecs);
        localStorage.setItem(cacheKey, JSON.stringify({
          timestamp: Date.now(),
          recommendations: newRecs
        }));
      }
    } catch (error: unknown) {
      console.error(error);
      setRecError("AI sedang sibuk. Gunakan fitur manual.");
    } finally {
      setLoadingRecs(false);
    }
  };

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

  const saveToFlashcard = async (text: string, preCalculatedTranslation?: string) => {
    const cleanWord = text.replace(/[.,!?;:"'()]/g, "").toLowerCase();
    
    // Check duplikasi (sederhana)
    if (savedVocabs.some((v) => v.word.toLowerCase() === cleanWord)) {
      alert(`"${text}" sudah ada di Flash Card!`);
      return;
    }

    setLoadingWord(cleanWord);
    try {
      let finalWord = text;
      let translation = preCalculatedTranslation;

      // 🔥 SMART FALLBACK LOGIC 🔥
      if (!translation) {
        // 1. Cek apakah kata yang diklik adalah bagian dari FRASA yang direkomendasikan AI?
        // Contoh: User klik "stretching", tapi AI merekomendasikan "stretching too far".
        // Maka kita simpan "stretching too far" karena terjemahannya lebih akurat.
        const foundPhrase = recommendations.find(r => 
          r.type === 'phrase' && r.text.toLowerCase().includes(cleanWord)
        );

        if (foundPhrase) {
          // Konfirmasi implisit: Gunakan frasa lengkap
          finalWord = foundPhrase.text;
          translation = foundPhrase.translation;
        } else {
          // 2. Cek apakah kata ada di rekomendasi kata tunggal
          const foundWord = recommendations.find(r => r.text.toLowerCase() === cleanWord);
          if (foundWord) {
            translation = foundWord.translation;
          } else {
            // 3. Last Resort: Panggil API On-Demand dengan Prompt 'quick_def' yang sudah diperbaiki
            translation = await GeminiService.getWordDefinition(cleanWord, scenario?.sentence || "");
          }
        }
      }
      
      const newVocab = await DBService.addVocab({
        word: finalWord, // Simpan kata/frasa yang optimal
        originalSentence: scenario?.sentence || "",
        translation: translation || "Definisi tidak ditemukan",
      });

      if (newVocab) {
        addVocabOptimistic(newVocab);
      }
    } catch (error) { console.error(error); } 
    finally { setLoadingWord(null); }
  };

  const handleDeleteVocab = async (id: string, e?: MouseEvent) => {
    e?.stopPropagation();
    const success = await DBService.deleteVocab(id);
    if (success) {
      deleteVocabOptimistic(id);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 font-sans">
      {/* NAVBAR */}
      <div className="flex flex-wrap justify-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm w-fit mx-auto">
        <button onClick={() => setMode('STORY')} className={`px-4 py-2 rounded-lg font-medium text-sm flex gap-2 transition-colors ${mode === 'STORY' ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:bg-slate-50'}`}>
          <BookOpen size={16} /> Story
        </button>
        <button onClick={() => setMode('FLASHCARD')} className={`px-4 py-2 rounded-lg font-medium text-sm flex gap-2 relative transition-colors ${mode === 'FLASHCARD' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}>
          <Layers size={16} /> Flash Card 
          <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full absolute -top-1 -right-1 font-bold">
            {savedVocabs.filter((v) => !v.mastered).length}
          </span>
        </button>
        <button onClick={() => setMode('RECALL')} className={`px-4 py-2 rounded-lg font-medium text-sm flex gap-2 transition-colors ${mode === 'RECALL' ? 'bg-amber-100 text-amber-700' : 'text-slate-500 hover:bg-slate-50'}`}>
          <RotateCcw size={16} /> Recall
        </button>
        <button onClick={() => setMode('HISTORY')} className={`px-4 py-2 rounded-lg font-medium text-sm flex gap-2 transition-colors ${mode === 'HISTORY' ? 'bg-green-100 text-green-700' : 'text-slate-500 hover:bg-slate-50'}`}>
          <Archive size={16} /> History
        </button>
      </div>

      {/* MODE: STORY */}
      {mode === 'STORY' && (
        <div className="animate-fade-in space-y-6">
          <div className="bg-white p-6 md:p-10 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles size={100} /></div>
             
             <div className="relative z-10 mb-8">
               <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Story Context</span>
               </div>
               {!scenario || loadingStory ? (
                 <div className="space-y-3 animate-pulse"><div className="h-6 bg-slate-100 rounded w-full"></div><div className="h-6 bg-slate-100 rounded w-2/3"></div></div>
               ) : (
                 <p className="text-2xl md:text-3xl font-serif text-slate-800 leading-relaxed">
                   {scenario.sentence.split(' ').map((word, idx) => (
                      <span 
                        key={idx} 
                        onClick={() => saveToFlashcard(word)} 
                        className="cursor-pointer hover:text-purple-600 hover:bg-purple-50 rounded px-0.5 transition-colors duration-200" 
                        title="Klik untuk simpan"
                      >
                        {word}{" "}
                      </span>
                   ))}
                 </p>
               )}
             </div>

             {/* AI Recommendations */}
             <div className="relative z-10 bg-purple-50/50 rounded-2xl p-5 border border-purple-100 mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb size={18} className="text-amber-500 fill-amber-500" />
                  <span className="text-sm font-bold text-purple-900">AI Recommendations (Smart)</span>
                </div>
                
                {loadingRecs ? (
                  <div className="flex gap-2 overflow-hidden">
                    {[1,2,3].map(i => <div key={i} className="h-8 w-24 bg-purple-100/50 rounded-lg animate-pulse" />)}
                  </div>
                ) : recommendations.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {recommendations.map((rec, idx) => {
                      const isAlreadySaved = savedVocabs.some((v) => v.word.toLowerCase() === rec.text.toLowerCase());
                      return (
                        <button
                          key={idx}
                          disabled={isAlreadySaved || loadingWord === rec.text.toLowerCase()}
                          onClick={() => saveToFlashcard(rec.text, rec.translation)}
                          className={`group flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200
                            ${isAlreadySaved 
                              ? 'bg-green-100 text-green-700 border-green-200 opacity-60 cursor-default' 
                              : 'bg-white text-slate-700 border-slate-200 hover:border-purple-400 hover:shadow-sm hover:-translate-y-0.5'
                            }`}
                        >
                          <span className={rec.type === 'phrase' ? 'italic' : ''}>{rec.text}</span>
                          {!isAlreadySaved && (
                             loadingWord === rec.text.toLowerCase() 
                             ? <Loader2 size={14} className="animate-spin text-purple-400"/>
                             : <Plus size={14} className="text-purple-400 group-hover:text-purple-600" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">Tidak ada rekomendasi khusus.</p>
                )}
             </div>

             <div className="pt-6 border-t border-slate-100 relative z-10">
               <textarea 
                 value={userTranslation} 
                 onChange={e => setUserTranslation(e.target.value)} 
                 className="w-full p-4 border border-slate-200 rounded-xl outline-none bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-100 transition-all" 
                 placeholder="Tulis terjemahanmu di sini..." 
                 rows={2} 
               />
               <div className="mt-4 flex justify-between items-center">
                  <button onClick={loadNewScenario} className="text-slate-500 hover:text-slate-700 text-sm flex items-center gap-1 font-medium px-2 py-1 hover:bg-slate-100 rounded-lg transition-colors">
                    <ReloadIcon size={14} /> Ganti Cerita
                  </button>
                  <button onClick={handleCheckStory} disabled={loadingStory || !userTranslation} className="bg-purple-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 shadow-md shadow-purple-200 transition-transform active:scale-95">
                    {loadingStory ? 'Menilai...' : 'Cek Jawaban'}
                  </button>
               </div>
             </div>
          </div>
          
          {storyFeedback && (
            <div className="bg-green-50 border border-green-100 p-6 rounded-2xl animate-slide-up shadow-sm">
              <div className="flex items-center gap-2 mb-3 font-bold text-green-800">
                <CheckCircle2 size={20}/> AI Score: {storyFeedback.score}/10
              </div>
              
              <p className="text-slate-700 mb-6 leading-relaxed border-b border-green-200 pb-4">
                {storyFeedback.feedback}
              </p>

              <div className="bg-white/80 p-4 rounded-xl border border-green-200 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-green-700 uppercase tracking-wider">
                   <ThumbsUp size={14} /> Jawaban Ideal / Natural
                </div>
                <p className="text-slate-800 font-medium italic text-lg">
                  &quot;{storyFeedback.improved_response}&quot;
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE: FLASHCARD */}
      {mode === 'FLASHCARD' && (
        <div className="animate-fade-in grid md:grid-cols-2 gap-4">
             {savedVocabs.filter((v) => !v.mastered).length === 0 ? (
                <div className="col-span-2 text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
                  Belum ada kartu. Tambahkan dari Story Lab!
                </div>
             ) : (
               savedVocabs.filter((v) => !v.mastered).map((vocab) => (
                  <div key={vocab.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative group hover:border-blue-300 transition-all">
                     <div className="flex justify-between items-start mb-2">
                       <h3 className="text-xl font-bold text-blue-600">{vocab.word}</h3>
                       <button onClick={() => handleDeleteVocab(vocab.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                         <Trash2 size={16} />
                       </button>
                     </div>
                     <p className="text-lg text-slate-800 font-medium mb-3">{vocab.translation}</p>
                     <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                       <p className="text-xs text-slate-600 italic line-clamp-2">&quot;...{vocab.originalSentence}...&quot;</p>
                     </div>
                  </div>
               ))
             )}
        </div>
      )}

      {/* MODE: RECALL (MODULAR) */}
      {mode === 'RECALL' && (
        <RecallView 
          vocabList={savedVocabs} 
          onUpdateMastery={updateVocabMastery}
          onSwitchMode={(targetMode) => setMode(targetMode)}
        />
      )}

      {/* MODE: HISTORY (MODULAR) */}
      {mode === 'HISTORY' && (
        <HistoryView vocabList={savedVocabs} />
      )}
    </div>
  );
};

export default StoryLab;