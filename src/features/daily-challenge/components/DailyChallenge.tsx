'use client';

import { useState, useEffect, useRef, type FC } from 'react';
import { Trophy, CheckCircle, Lock, Brain, Target, ArrowRight, RefreshCcw, Star, Zap, Loader2 } from 'lucide-react';
// 🔥 FIX: Import dari lokasi Shared baru
import { GroqService } from '@/shared/services/groqService';
import { DBService } from '@/shared/services/dbService';
import { ChallengeFeedback, DailyProgress, SurvivalScenario } from '@/shared/types';
// 🔥 FIX: Import data dari folder fitur lokal
import { advancedVocabList } from '../data/advancedVocab';

// --- HELPER ---
const generateDailyMission = (date: string): DailyProgress => ({
  date,
  targets: [...advancedVocabList].sort(() => 0.5 - Math.random()).slice(0, 10),
  memorized: [],
  completed: [],
  meanings: {}
});

// 🔒 SECURITY: Sanitize input untuk mencegah XSS
const sanitizeInput = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

// Konstanta untuk validasi
const MIN_RESPONSE_LENGTH = 20;

// --- COMPONENT: VocabCard ---
interface VocabCardProps {
  word: string;
  meaning?: string;
  isMemorized: boolean;
  isCompleted: boolean;
  onClick: () => void;
}

const VocabCard: FC<VocabCardProps> = ({ word, meaning, isMemorized, isCompleted, onClick }) => (
  <div onClick={onClick} className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all active:scale-95 group overflow-hidden flex flex-col justify-between min-h-[140px] ${isCompleted ? 'bg-emerald-50 border-emerald-400 opacity-90' : isMemorized ? 'bg-white border-blue-500 shadow-md shadow-blue-100' : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'}`}>
    <div className="absolute top-4 right-4 z-10">
      {isCompleted ? <div className="bg-emerald-100 p-1.5 rounded-full"><Trophy size={18} className="text-emerald-600 fill-emerald-600" /></div> : isMemorized ? <div className="bg-blue-100 p-1.5 rounded-full"><CheckCircle size={20} className="text-blue-600 fill-blue-600" /></div> : <div className="w-6 h-6 rounded-full border-2 border-slate-300 group-hover:border-blue-400"></div>}
    </div>
    <div className="z-10 mt-2">
      <h3 className={`text-2xl font-bold mb-1 ${isCompleted ? 'text-emerald-800' : isMemorized ? 'text-blue-700' : 'text-slate-800'}`}>{word}</h3>
      <p className={`text-sm font-medium ${isCompleted ? 'text-emerald-600' : 'text-slate-500'}`}>
        {meaning ? meaning : <span className="flex items-center gap-1 text-slate-400 text-xs"><Loader2 size={12} className="animate-spin" /> Memuat arti...</span>}
      </p>
    </div>
    {isMemorized && !isCompleted && <Zap size={80} className="absolute -bottom-4 -right-4 text-blue-50 opacity-50 pointer-events-none" />}
    {isCompleted && <Star size={80} className="absolute -bottom-4 -right-4 text-emerald-100 opacity-50 pointer-events-none" />}
  </div>
);

// --- MAIN COMPONENT ---
const DailyChallenge: FC = () => {
  const getTodayString = () => new Date().toISOString().split('T')[0];
  const [today, setToday] = useState(getTodayString());
  const [progress, setProgress] = useState<DailyProgress | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const isFetchingRef = useRef(false);

  // 🔥 STATE PERSISTENCE: Keys untuk localStorage
  const STORAGE_KEY_SCENARIO = `survival_scenario_${getTodayString()}`;
  const STORAGE_KEY_RESPONSE = `survival_response_${getTodayString()}`;
  const STORAGE_KEY_TAB = `survival_tab_${getTodayString()}`;

  // UI States - dengan inisialisasi dari localStorage
  const [tab, setTab] = useState<'VOCAB' | 'SURVIVAL'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_TAB);
      return saved === 'SURVIVAL' ? 'SURVIVAL' : 'VOCAB';
    }
    return 'VOCAB';
  });

  const [scenario, setScenario] = useState<SurvivalScenario | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_SCENARIO);
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  const [response, setResponse] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY_RESPONSE) || '';
    }
    return '';
  });

  const [feedback, setFeedback] = useState<ChallengeFeedback | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  // 🔥 FIX: Flag untuk mencegah re-sync scenario setelah PASSED
  const scenarioCompletedRef = useRef(false);

  // 🔥 PERSISTENCE: Sync state ke localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_TAB, tab);
    }
  }, [tab, STORAGE_KEY_TAB]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 🔥 FIX: Jangan sync jika scenario sudah completed (mencegah race condition)
      if (scenarioCompletedRef.current) {
        return;
      }
      if (scenario) {
        localStorage.setItem(STORAGE_KEY_SCENARIO, JSON.stringify(scenario));
      } else {
        localStorage.removeItem(STORAGE_KEY_SCENARIO);
      }
    }
  }, [scenario, STORAGE_KEY_SCENARIO]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_RESPONSE, response);
    }
  }, [response, STORAGE_KEY_RESPONSE]);

  // 🔥 FIX: Validasi scenario yang di-restore dari localStorage SETELAH progress diload
  // Ini mengatasi race condition dimana scenario di-restore sebelum progress tersedia
  useEffect(() => {
    if (!progress || !scenario) return;

    // 🔥 FIX: Skip validasi jika baru saja PASSED (user perlu melihat feedback dulu)
    if (scenarioCompletedRef.current) {
      return;
    }

    // Jika kata dalam scenario sudah ada di completed list, clear scenario
    if (progress.completed.includes(scenario.word)) {
      console.log(`[Survival] Clearing completed scenario: ${scenario.word}`);
      setScenario(null);
      setResponse('');
      setFeedback(null);

      // Clear dari localStorage juga
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY_SCENARIO);
        localStorage.removeItem(STORAGE_KEY_RESPONSE);
      }
    }
  }, [progress?.completed, scenario?.word, STORAGE_KEY_SCENARIO, STORAGE_KEY_RESPONSE]);

  const updateProgress = (updater: (prev: DailyProgress) => DailyProgress) => {
    setProgress(prev => {
      if (!prev) return null;
      const newState = updater(prev);
      DBService.saveDailyProgress(newState).catch(e => console.error("Auto-save failed:", e));
      return newState;
    });
  };

  // 🔥 FIX: Gunakan ref untuk menyimpan state terkini tanpa trigger re-render
  const currentDateRef = useRef(today);
  currentDateRef.current = today;

  // useEffect untuk inisialisasi data (hanya sekali saat mount)
  useEffect(() => {
    const initData = async () => {
      setIsLoadingData(true);
      try {
        const date = getTodayString();
        setToday(date);
        let data = await DBService.getDailyProgress(date);

        if (!data) {
          data = generateDailyMission(date);
          await DBService.saveDailyProgress(data);
        }

        if (!data.meanings || typeof data.meanings !== 'object') {
          data.meanings = {};
        }

        setProgress(data);
      } catch (e) { console.error(e); }
      finally { setIsLoadingData(false); }
    };
    initData();
  }, []); // ← Hanya sekali saat mount

  // useEffect terpisah untuk polling perubahan hari (stable interval)
  useEffect(() => {
    const checkDayChange = async () => {
      const newDate = getTodayString();

      // 🔥 FIX: Gunakan ref untuk cek tanpa trigger re-render berlebihan
      if (newDate !== currentDateRef.current) {
        console.log('🔄 Hari berubah! Memuat ulang Daily Challenge...');
        setIsLoadingData(true);
        setToday(newDate);

        try {
          let data = await DBService.getDailyProgress(newDate);
          if (!data) {
            data = generateDailyMission(newDate);
            await DBService.saveDailyProgress(data);
          }
          if (!data.meanings || typeof data.meanings !== 'object') {
            data.meanings = {};
          }
          setProgress(data);
        } catch (e) { console.error(e); }
        finally { setIsLoadingData(false); }
      }
    };

    // Polling setiap 60 detik
    const intervalId = setInterval(checkDayChange, 60000);

    return () => clearInterval(intervalId);
  }, []); // ← Empty dependency = interval stabil, tidak di-recreate

  useEffect(() => {
    if (!progress || isLoadingData) return;
    if (isFetchingRef.current) return;

    const missingTargets = progress.targets.filter(word => !progress.meanings?.[word]);

    if (missingTargets.length === 0) return;

    const fetchBatch = async () => {
      try {
        isFetchingRef.current = true;
        console.log("🔥 Fetching AI Batch for:", missingTargets);

        const res = await GroqService.getBatchWordDefinitions(missingTargets);

        if (res && res.definitions) {
          const newMeanings: Record<string, string> = {};
          res.definitions.forEach(item => {
            newMeanings[item.word] = item.meaning;
          });

          updateProgress(prev => ({
            ...prev,
            meanings: { ...prev.meanings, ...newMeanings }
          }));
        }
      } catch (error) {
        console.error("Gagal mengambil arti batch:", error);
      } finally {
        isFetchingRef.current = false;
      }
    };

    fetchBatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress?.targets, isLoadingData]);

  if (isLoadingData || !progress) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-8 animate-pulse">
        <div className="h-32 bg-slate-200 rounded-2xl"></div>
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-40 bg-slate-200 rounded-2xl"></div>)}
        </div>
      </div>
    );
  }

  const completedCount = progress.completed.length;
  const memorizedCount = progress.memorized.length;
  // 🔥 FIX: SURVIVAL MODE counter = union dari completed + memorized
  const survivalModeCount = new Set([...progress.completed, ...progress.memorized]).size;
  const availableForSurvival = progress.memorized.filter(w => !progress.completed.includes(w));

  const toggleMemorized = (word: string) => {
    updateProgress(prev => ({
      ...prev,
      memorized: prev.memorized.includes(word)
        ? prev.memorized.filter(w => w !== word)
        : [...prev.memorized, word]
    }));
  };

  const startMission = async () => {
    if (availableForSurvival.length === 0) return;
    const word = availableForSurvival[Math.floor(Math.random() * availableForSurvival.length)];

    // 🔥 Clear response lama saat mulai misi baru
    setLoadingAI(true);
    setFeedback(null);
    setResponse('');
    setScenario(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_RESPONSE);
    }

    try {
      const data = await GroqService.generateSurvivalScenario(word);
      setScenario(data);
    } catch (e) { alert("Limit API tercapai. Coba lagi nanti."); }
    finally { setLoadingAI(false); }
  };

  const submitMission = async () => {
    if (!scenario || !response) return;
    setLoadingAI(true);

    try {
      const res = await GroqService.evaluateSurvivalResponse(scenario.situation, scenario.word, response);
      setFeedback(res);

      if (res.score >= 5 && !progress.completed.includes(scenario.word)) {
        // Update progress dengan kata yang baru diselesaikan
        updateProgress(prev => ({ ...prev, completed: [...prev.completed, scenario.word] }));

        // 🔥 FIX: Set flag untuk mencegah useEffect re-sync
        scenarioCompletedRef.current = true;

        // Clear localStorage SEGERA
        if (typeof window !== 'undefined') {
          localStorage.removeItem(STORAGE_KEY_SCENARIO);
          localStorage.removeItem(STORAGE_KEY_RESPONSE);
        }

        // Tidak ada auto-advance - user harus klik tombol OK
      }
    } catch (e) { console.error(e); } finally { setLoadingAI(false); }
  };

  // 🔥 NEW: Handler untuk tombol OK saat PASSED
  const handlePassedOk = () => {
    // Reset flag untuk mission berikutnya
    scenarioCompletedRef.current = false;

    // Clear states
    setScenario(null);
    setResponse('');
    setFeedback(null);

    // Cek apakah masih ada kata yang bisa diuji
    if (availableForSurvival.length > 0) {
      // Lanjut ke soal baru
      startMission();
    }
    // Jika tidak ada, kembali ke tampilan awal (scenario sudah null)
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center justify-center md:justify-start gap-2"><Target className="text-blue-600" /> Misi Harian</h2>
          <p className="text-slate-500 text-sm mt-1">Target Tanggal: {today}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right"><p className="text-xs font-bold text-slate-400 uppercase">Progress</p><p className="text-3xl font-black text-blue-600">{completedCount}<span className="text-lg text-slate-300">/10</span></p></div>
          <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200"><Trophy className={completedCount === 10 ? "text-amber-500 fill-amber-500" : "text-slate-300"} size={28} /></div>
        </div>
      </div>

      <div className="flex border-b border-slate-200 bg-white rounded-t-xl overflow-hidden">
        <button onClick={() => setTab('VOCAB')} className={`flex-1 py-4 font-bold text-sm border-b-2 ${tab === 'VOCAB' ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-transparent text-slate-500'}`}>1. HAFALAN ({completedCount}/10)</button>
        <button onClick={() => setTab('SURVIVAL')} className={`flex-1 py-4 font-bold text-sm border-b-2 ${tab === 'SURVIVAL' ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-transparent text-slate-500'}`}>2. SURVIVAL MODE ({survivalModeCount}/10)</button>
      </div>

      {tab === 'VOCAB' ? (
        <div className="animate-slide-up">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {progress.targets.map(word => (
              <VocabCard key={word} word={word} meaning={progress.meanings?.[word]} isMemorized={progress.memorized.includes(word)} isCompleted={progress.completed.includes(word)} onClick={() => toggleMemorized(word)} />
            ))}
          </div>
          <div className="mt-8 p-6 bg-slate-50 rounded-xl border border-slate-200 text-center"><button onClick={() => setTab('SURVIVAL')} disabled={memorizedCount === 0} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black disabled:opacity-50 inline-flex items-center gap-2">Lanjut Survival <ArrowRight size={18} /></button></div>
        </div>
      ) : (
        <div className="animate-slide-up space-y-6">
          {!scenario ? (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-200">
              <Brain size={40} className="text-amber-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-800">Uji Kemampuanmu</h3>
              <p className="text-slate-500 mb-6">Tersedia {availableForSurvival.length} kata untuk diuji.</p>
              <button onClick={startMission} disabled={availableForSurvival.length === 0 || loadingAI} className="bg-amber-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-amber-600 disabled:opacity-50">{loadingAI ? 'Loading...' : 'Mulai Misi'}</button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white border-2 border-amber-100 p-6 rounded-3xl relative overflow-hidden"><div className="absolute top-0 left-0 w-full h-2 bg-amber-400"></div><div className="text-xs font-extrabold bg-amber-100 text-amber-800 px-3 py-1 rounded-full inline-block mb-4">TARGET HAFALAN: {scenario.word}</div><h3 className="text-2xl font-medium text-slate-900">&quot;{scenario.situation}&quot;</h3></div>
              {!feedback ? (
                <>
                  <div className="relative">
                    <textarea
                      value={response}
                      onChange={e => setResponse(e.target.value)}
                      className={`w-full p-6 border rounded-2xl min-h-[120px] text-lg transition-colors ${response.length > 0 && response.trim().length < MIN_RESPONSE_LENGTH
                        ? 'border-red-300 focus:border-red-400'
                        : 'border-slate-300 focus:border-blue-400'
                        }`}
                      placeholder="Jawab di sini dengan kalimat lengkap..."
                    />
                    {/* Karakter Counter Realtime */}
                    <div className={`absolute bottom-3 right-3 text-xs font-medium ${response.trim().length >= MIN_RESPONSE_LENGTH
                      ? 'text-green-600'
                      : response.length > 0
                        ? 'text-red-500'
                        : 'text-slate-400'
                      }`}>
                      {response.trim().length}/{MIN_RESPONSE_LENGTH} karakter
                    </div>
                  </div>
                  {/* Error Message */}
                  {response.length > 0 && response.trim().length < MIN_RESPONSE_LENGTH && (
                    <p className="text-red-500 text-sm -mt-2">
                      ⚠️ Kalimat terlalu pendek, mohon berikan konteks minimal {MIN_RESPONSE_LENGTH} karakter
                    </p>
                  )}
                  <button
                    onClick={() => {
                      const sanitized = sanitizeInput(response);
                      setResponse(sanitized);
                      submitMission();
                    }}
                    disabled={loadingAI || response.trim().length < MIN_RESPONSE_LENGTH}
                    className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    {loadingAI ? <span className="flex items-center justify-center gap-2"><RefreshCcw className="animate-spin" /> Menilai...</span> : 'Kirim'}
                  </button>
                </>
              ) : (
                <div className={`p-6 rounded-3xl border-2 ${feedback.score >= 5 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex justify-between mb-4"><span className={`font-bold text-xl flex gap-2 items-center ${feedback.score >= 5 ? 'text-green-700' : 'text-red-700'}`}>{feedback.score >= 5 ? <CheckCircle /> : <Lock />} {feedback.score >= 5 ? 'PASSED' : 'FAILED'}</span><span className="text-3xl font-black text-slate-800">{feedback.score}</span></div>
                  <p className="mb-4 text-slate-800 text-lg">&quot;{feedback.feedback}&quot;</p>
                  <div className="bg-white/60 p-4 rounded-xl mb-6 text-sm italic text-slate-600 border border-slate-100">&quot;{feedback.improved_response}&quot;</div>

                  {/* 🔥 PASSED: Tampilkan hanya tombol OK */}
                  {feedback.score >= 5 ? (
                    <button
                      onClick={handlePassedOk}
                      className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg"
                    >
                      ✓ OK, Lanjut
                    </button>
                  ) : (
                    /* FAILED: Tampilkan Ulangi + Lanjut */
                    <div className="flex gap-3">
                      <button onClick={() => setFeedback(null)} className="flex-1 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50">Ulangi</button>
                      <button onClick={startMission} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black shadow-lg">Lanjut</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DailyChallenge;