'use client';

import { useState, useEffect, FC } from 'react';
// Tambahkan import icon 'Check'
import {
  BookOpen, History, RotateCcw, Sparkles,
  CheckCircle2, ThumbsUp, Loader2, Lightbulb, Plus, Check
} from 'lucide-react';

import { useStoryLogic } from '../hooks/useStoryLogic';
import { GroqService } from '@/shared/services/groqService';
import { storyCollection } from '../data/storyData';
import { StoryScenario, ChallengeFeedback, VocabRecommendation, CachedAnalysis } from '@/shared/types';
import { StoryHistoryList } from './StoryHistoryList';

type StoryTab = 'PRACTICE' | 'HISTORY';
const CACHE_DURATION = 24 * 60 * 60 * 1000;

const StoryLab: FC = () => {
  const [activeTab, setActiveTab] = useState<StoryTab>('PRACTICE');

  // Ambil savedWordSet dari hook
  const {
    historyLogs,
    submitTranslationLog,
    saveWordToFlashcard,
    savedWordSet
  } = useStoryLogic();

  const [scenario, setScenario] = useState<StoryScenario | null>(null);
  const [userTranslation, setUserTranslation] = useState('');
  const [storyFeedback, setStoryFeedback] = useState<ChallengeFeedback | null>(null);
  const [loadingStory, setLoadingStory] = useState(false);
  const [isProcessingLog, setIsProcessingLog] = useState(false);

  const [recommendations, setRecommendations] = useState<VocabRecommendation[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [loadingWord, setLoadingWord] = useState<string | null>(null);

  // Session storage key untuk persistensi state
  const STORAGE_KEY = 'storylab_session';

  // Restore state dari sessionStorage saat mount
  useEffect(() => {
    const savedSession = sessionStorage.getItem(STORAGE_KEY);
    if (savedSession) {
      try {
        const { scenario: savedScenario, userTranslation: savedTranslation, recommendations: savedRecs } = JSON.parse(savedSession);
        if (savedScenario?.sentence) {
          setScenario(savedScenario);
          setUserTranslation(savedTranslation || '');
          if (savedRecs && savedRecs.length > 0) {
            setRecommendations(savedRecs);
          }
          return; // Jangan load scenario baru
        }
      } catch (e) {
        console.error('Failed to restore story session', e);
      }
    }
    // Hanya load scenario baru jika tidak ada saved session
    loadNewScenario();
  }, []);

  // Simpan state ke sessionStorage setiap kali berubah
  useEffect(() => {
    if (scenario?.sentence) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        scenario,
        userTranslation,
        recommendations
      }));
    }
  }, [scenario, userTranslation, recommendations]);

  // Fetch recommendations jika belum ada (misal dari cache kosong)
  useEffect(() => {
    if (scenario?.sentence && recommendations.length === 0) {
      fetchAndCacheRecommendations(scenario.sentence);
    }
  }, [scenario]);

  const fetchAndCacheRecommendations = async (sentence: string) => {
    setRecommendations([]);
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
      const { recommendations: newRecs } = await GroqService.analyzeStoryVocab(sentence);
      if (newRecs && newRecs.length > 0) {
        setRecommendations(newRecs);
        localStorage.setItem(cacheKey, JSON.stringify({
          timestamp: Date.now(),
          recommendations: newRecs
        }));
      }
    } catch (error: unknown) {
      console.error("Failed to fetch recommendations", error);
    } finally {
      setLoadingRecs(false);
    }
  };

  const loadNewScenario = () => {
    setLoadingStory(true);
    setStoryFeedback(null);
    setUserTranslation('');
    setRecommendations([]); // Clear recommendations untuk scenario baru
    sessionStorage.removeItem(STORAGE_KEY); // Clear saved session
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * storyCollection.length);
      const data = storyCollection[randomIndex];
      setScenario({ sentence: data.english, translation: "" });
      setLoadingStory(false);
    }, 300);
  };

  const handleCheckStory = async () => {
    if (!scenario || !userTranslation.trim()) return;
    setLoadingStory(true);
    try {
      const result = await GroqService.evaluateStoryTranslation(scenario.sentence, userTranslation);
      setStoryFeedback(result);
      setIsProcessingLog(true);
      await submitTranslationLog({
        englishText: scenario.sentence,
        userTranslation: userTranslation,
        aiFeedback: result.feedback,
        score: result.score
      });
      setIsProcessingLog(false);
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan saat menghubungi AI.");
    } finally {
      setLoadingStory(false);
    }
  };

  const handleWordClick = async (text: string, preCalculatedTranslation?: string) => {
    if (!text) return;
    const cleanWord = text.replace(/[.,!?;:"'()]/g, "").trim();
    if (!cleanWord) return;

    // Guard: Jangan simpan jika sudah ada
    if (savedWordSet.has(cleanWord.toLowerCase())) return;

    setLoadingWord(cleanWord.toLowerCase());
    try {
      // Jika ada preCalculatedTranslation, berarti diklik dari AI Recommendations
      // Gunakan text asli (bisa berupa phrase)
      const isFromRecommendation = !!preCalculatedTranslation;

      let finalWord = cleanWord;
      let translation = preCalculatedTranslation;

      if (isFromRecommendation) {
        // Diklik dari AI Recommendations - gunakan text lengkap (termasuk phrase)
        finalWord = text;
      } else {
        // Diklik dari kalimat - cari terjemahan saja, JANGAN ganti finalWord
        // Cek exact match dulu
        const exactMatch = recommendations.find(r =>
          r.text.toLowerCase() === cleanWord.toLowerCase()
        );

        if (exactMatch) {
          translation = exactMatch.translation;
        } else {
          // Tidak ada exact match, panggil AI untuk definisi
          translation = await GroqService.getWordDefinition(cleanWord, scenario?.sentence || "");
        }
      }

      const success = await saveWordToFlashcard(
        finalWord,
        translation || "Definisi belum tersedia",
        scenario?.sentence || ""
      );

      if (!success) {
        alert(`Gagal menambahkan "${finalWord}".`);
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan sistem.");
    } finally {
      setLoadingWord(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 font-sans">
      {/* HEADER */}
      <div className="flex flex-col items-center justify-center gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center justify-center gap-2">
            <Sparkles className="text-purple-500" /> Story Lab
          </h1>
          <p className="text-slate-500 mt-1">Latih kemampuan penerjemahan kontekstual.</p>
        </div>
        <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('PRACTICE')}
            className={`px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'PRACTICE' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <BookOpen size={16} /> Practice
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'HISTORY' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <History size={16} /> Riwayat ({historyLogs.length})
          </button>
        </div>
      </div>

      {activeTab === 'PRACTICE' && (
        <div className="animate-slide-up space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><BookOpen size={120} /></div>

            {/* BAGIAN TEKS CERITA */}
            <div className="relative z-10">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Translate this sentence</span>
              {!scenario || (loadingStory && !storyFeedback) ? (
                <div className="space-y-3 animate-pulse py-4">
                  <div className="h-8 bg-slate-100 rounded w-full"></div>
                  <div className="h-8 bg-slate-100 rounded w-2/3"></div>
                </div>
              ) : (
                <p className="text-2xl md:text-3xl font-serif text-slate-800 leading-relaxed font-medium">
                  {scenario.sentence.split(' ').map((word, idx) => {
                    const cleanWord = word.replace(/[.,!?;:"'()]/g, "").trim().toLowerCase();
                    const isSaved = savedWordSet.has(cleanWord);

                    return (
                      <span
                        key={idx}
                        onClick={() => !isSaved && handleWordClick(word)}
                        className={`
                            rounded px-0.5 transition-colors duration-200
                            ${isSaved
                            ? 'text-emerald-600 cursor-default' // Style jika tersimpan
                            : 'cursor-pointer hover:text-purple-600 hover:bg-purple-50' // Style jika belum
                          }
                          `}
                        title={isSaved ? "Sudah tersimpan di Flashcard" : "Klik untuk simpan ke Flashcard"}
                      >
                        {word}{" "}
                      </span>
                    );
                  })}
                </p>
              )}
            </div>

            {/* BAGIAN REKOMENDASI CHIP */}
            <div className="relative z-10 bg-purple-50/50 rounded-2xl p-5 border border-purple-100 mt-8">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb size={18} className="text-amber-500 fill-amber-500" />
                <span className="text-sm font-bold text-purple-900">AI Recommendations</span>
              </div>

              {loadingRecs ? (
                <div className="flex gap-2 overflow-hidden">
                  {[1, 2, 3].map(i => <div key={i} className="h-8 w-24 bg-purple-100/50 rounded-lg animate-pulse" />)}
                </div>
              ) : recommendations.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {recommendations.map((rec, idx) => {
                    const isAlreadySaved = savedWordSet.has(rec.text.toLowerCase());

                    return (
                      <button
                        key={idx}
                        disabled={isAlreadySaved || loadingWord === rec.text.toLowerCase()}
                        onClick={() => handleWordClick(rec.text, rec.translation)}
                        className={`
                            group flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200
                            ${isAlreadySaved
                            ? "bg-emerald-100 border-emerald-200 text-emerald-700 cursor-default"
                            : "bg-white text-slate-700 border-slate-200 hover:border-purple-400 hover:shadow-sm hover:-translate-y-0.5 cursor-pointer"
                          }
                          `}
                      >
                        <span className={rec.type === 'phrase' ? 'italic' : ''}>{rec.text}</span>
                        {loadingWord === rec.text.toLowerCase() ? (
                          <Loader2 size={14} className="animate-spin text-purple-400" />
                        ) : isAlreadySaved ? (
                          <Check size={14} className="text-emerald-600" strokeWidth={3} />
                        ) : (
                          <Plus size={14} className="text-purple-400 group-hover:text-purple-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">Tidak ada rekomendasi khusus.</p>
              )}
            </div>

            {/* TEXTAREA INPUT */}
            <div className="pt-8 mt-4 relative z-10 border-t border-slate-100">
              <textarea
                value={userTranslation}
                onChange={e => setUserTranslation(e.target.value)}
                disabled={!!storyFeedback || loadingStory}
                className="w-full p-5 border-2 border-slate-100 rounded-2xl outline-none bg-slate-50/50 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-50 transition-all text-lg resize-none"
                placeholder="Ketik terjemahan bahasa Indonesia di sini..."
                rows={3}
              />

              <div className="mt-4 flex justify-between items-center">
                <button
                  onClick={loadNewScenario}
                  className="text-slate-500 hover:text-slate-800 text-sm flex items-center gap-2 font-bold px-4 py-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <RotateCcw size={16} /> Ganti Cerita
                </button>

                {!storyFeedback && (
                  <button
                    onClick={handleCheckStory}
                    disabled={loadingStory || !userTranslation.trim()}
                    className="bg-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-200 transition-transform active:scale-95 flex items-center gap-2"
                  >
                    {loadingStory ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                    {loadingStory ? 'Menilai...' : 'Cek Jawaban'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* FEEDBACK SECTION */}
          {storyFeedback && (
            <div className="bg-white border border-green-100 p-8 rounded-3xl animate-bounce-in shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-emerald-500"></div>
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <CheckCircle2 size={28} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Analisis AI</h3>
                    <p className="text-slate-500 text-sm">Hasil penilaian terjemahanmu</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-4xl font-black text-green-600">{storyFeedback.score}</span>
                  <span className="text-xs font-bold text-green-400 uppercase">Skor</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <p className="text-slate-700 leading-relaxed text-base">
                    {storyFeedback.feedback}
                  </p>
                </div>
                <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 flex gap-4 items-start">
                  <ThumbsUp className="text-blue-600 shrink-0 mt-1" size={20} />
                  <div>
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Saran Terjemahan Natural</p>
                    <p className="text-blue-900 font-medium italic text-lg">
                      &quot;{storyFeedback.improved_response}&quot;
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button
                  onClick={loadNewScenario}
                  className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg flex justify-center items-center gap-2"
                >
                  Lanjut Cerita Berikutnya <RotateCcw size={18} />
                </button>
                {isProcessingLog && <p className="text-xs text-center text-slate-400 mt-2 ml-4 self-center">Menyimpan riwayat...</p>}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'HISTORY' && (
        <StoryHistoryList historyLogs={historyLogs} />
      )}
    </div>
  );
};

export default StoryLab;