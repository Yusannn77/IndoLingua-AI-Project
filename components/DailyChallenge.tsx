import React, { useState, useEffect } from 'react';
import { Trophy, CheckCircle, Lock, Brain, Target, ArrowRight, RefreshCcw, Star, Zap, Loader2 } from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { ChallengeFeedback, DailyProgress, SurvivalScenario } from '../types';
import { advancedVocabList } from '../data/advancedVocab';
import { useLocalStorage } from '../hooks/useLocalStorage'; 

const STORAGE_KEY = 'indolingua_daily_v1';

// --- HELPER FUNCTIONS ---
const generateDailyMission = (date: string): DailyProgress => ({
  date,
  targets: [...advancedVocabList].sort(() => 0.5 - Math.random()).slice(0, 10),
  memorized: [],
  completed: [],
  meanings: {}
});

// --- SUB-COMPONENTS ---
interface VocabCardProps {
  word: string;
  meaning?: string;
  isMemorized: boolean;
  isCompleted: boolean;
  onClick: () => void;
}

const VocabCard: React.FC<VocabCardProps> = ({ word, meaning, isMemorized, isCompleted, onClick }) => (
  <div 
    onClick={onClick}
    className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all active:scale-95 group overflow-hidden flex flex-col justify-between min-h-[140px]
      ${isCompleted ? 'bg-emerald-50 border-emerald-400 opacity-90' 
      : isMemorized ? 'bg-white border-brand-500 shadow-md shadow-brand-100' 
      : 'bg-white border-slate-200 hover:border-brand-300 hover:shadow-sm'}`}
  >
    <div className="absolute top-4 right-4 z-10">
      {isCompleted ? (
        <div className="bg-emerald-100 p-1.5 rounded-full">
          <Trophy size={18} className="text-emerald-600 fill-emerald-600" />
        </div>
      ) : isMemorized ? (
        <div className="bg-brand-100 p-1.5 rounded-full">
          <CheckCircle size={20} className="text-brand-600 fill-brand-600" />
        </div>
      ) : (
        <div className="w-6 h-6 rounded-full border-2 border-slate-300 group-hover:border-brand-400"></div>
      )}
    </div>

    <div className="z-10 mt-2">
      <h3 className={`text-2xl font-bold mb-1 ${isCompleted ? 'text-emerald-800' : isMemorized ? 'text-brand-700' : 'text-slate-800'}`}>
        {word}
      </h3>
      <p className={`text-sm font-medium ${isCompleted ? 'text-emerald-600' : 'text-slate-500'}`}>
        {meaning ? meaning : <span className="flex items-center gap-1 text-slate-400 text-xs"><Loader2 size={12} className="animate-spin"/> Memuat arti...</span>}
      </p>
    </div>

    {isMemorized && !isCompleted && <Zap size={80} className="absolute -bottom-4 -right-4 text-brand-50 opacity-50 pointer-events-none" />}
    {isCompleted && <Star size={80} className="absolute -bottom-4 -right-4 text-emerald-100 opacity-50 pointer-events-none" />}
  </div>
);

// --- MAIN COMPONENT ---
const DailyChallenge: React.FC = () => {
  // Kita pakai fungsi helper untuk dapat tanggal hari ini secara konsisten
  const getTodayString = () => new Date().toISOString().split('T')[0];
  
  const [today, setToday] = useState(getTodayString());

  // 1. State Management dengan Custom Hook (Load & Init Logic)
  const [progress, setProgress] = useLocalStorage<DailyProgress>(STORAGE_KEY, () => {
    const currentDate = getTodayString();
    const empty = generateDailyMission(currentDate);
    if (typeof window === 'undefined') return empty;
    
    try {
      const item = window.localStorage.getItem(STORAGE_KEY);
      if (!item) return empty;
      
      const saved = JSON.parse(item);
      // LOGIC RESET HARIAN (Saat Refresh)
      if (saved.date === currentDate) {
        if (!saved.meanings) saved.meanings = {};
        return saved;
      }
      // Jika tanggal beda, return misi baru
      return empty;
    } catch { return empty; }
  });

  const [tab, setTab] = useState<'VOCAB' | 'SURVIVAL'>('VOCAB');
  const [scenario, setScenario] = useState<SurvivalScenario | null>(null);
  const [response, setResponse] = useState('');
  const [feedback, setFeedback] = useState<ChallengeFeedback | null>(null);
  const [loading, setLoading] = useState(false);

  // --- NEW: REALTIME DAY CHECKER ---
  // Menangani kasus user membiarkan tab terbuka semalaman
  useEffect(() => {
    const checkDate = () => {
      const now = getTodayString();
      // Jika tanggal di state beda dengan tanggal sistem sekarang -> RESET
      if (progress.date !== now) {
        console.log("New day detected! Resetting mission...");
        setToday(now);
        setProgress(generateDailyMission(now));
        // Reset UI state juga
        setScenario(null);
        setFeedback(null);
        setResponse('');
        setTab('VOCAB');
      }
    };

    // Cek saat window mendapatkan fokus (user kembali ke tab)
    window.addEventListener('focus', checkDate);
    
    // Optional: Cek setiap 1 menit juga
    const interval = setInterval(checkDate, 60000);

    return () => {
      window.removeEventListener('focus', checkDate);
      clearInterval(interval);
    };
  }, [progress.date, setProgress]);

  // --- AUTO-FETCH MEANINGS ---
  useEffect(() => {
    const fetchMeanings = async () => {
      const newMeanings = { ...progress.meanings };
      let hasChanges = false;

      for (const word of progress.targets) {
        if (!newMeanings[word]) {
          try {
            const def = await GeminiService.getWordDefinition(word, "General definition");
            if (def) {
                newMeanings[word] = def;
                hasChanges = true;
            }
          } catch (e) {
            console.error(`Gagal mengambil arti untuk ${word}`, e);
          }
        }
      }

      if (hasChanges) {
        setProgress(prev => ({ ...prev, meanings: newMeanings }));
      }
    };

    fetchMeanings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress.targets]);

  // Computed Data
  const completedCount = progress.completed.length;
  const memorizedCount = progress.memorized.length;
  const availableForSurvival = progress.memorized.filter(w => !progress.completed.includes(w));

  // Actions
  const toggleMemorized = (word: string) => {
    setProgress(prev => ({
      ...prev,
      memorized: prev.memorized.includes(word) 
        ? prev.memorized.filter(w => w !== word) 
        : [...prev.memorized, word]
    }));
  };

  const startMission = async () => {
    if (availableForSurvival.length === 0) {
        setScenario(null);
        setFeedback(null);
        setResponse('');
        return;
    }

    const word = availableForSurvival[Math.floor(Math.random() * availableForSurvival.length)];
    
    setLoading(true);
    setFeedback(null);
    setResponse('');
    setScenario(null);

    try {
      const data = await GeminiService.generateSurvivalScenario(word);
      setScenario(data);
    } catch (e) { 
      console.error(e); 
      alert("Gagal membuat misi. Coba lagi.");
      setScenario(null);
    } finally { 
      setLoading(false); 
    }
  };

  const submitMission = async () => {
    if (!scenario || !response) return;
    setLoading(true);
    try {
      const res = await GeminiService.evaluateSurvivalResponse(scenario.situation, scenario.word, response);
      setFeedback(res);
      
      if (res.score >= 5 && !progress.completed.includes(scenario.word)) {
        setProgress(prev => ({ 
          ...prev, 
          completed: [...prev.completed, scenario.word] 
        }));
      }
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12 animate-fade-in">
      {/* HEADER */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
         <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center justify-center md:justify-start gap-2">
              <Target className="text-brand-600" /> Misi Harian
            </h2>
            <p className="text-slate-500 text-sm mt-1">Target Tanggal: {today}</p>
         </div>
         
         <div className="flex items-center gap-4">
            <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Progress</p>
                <p className="text-3xl font-black text-brand-600 leading-none">
                  {completedCount}<span className="text-lg text-slate-300 font-medium">/10</span>
                </p>
            </div>
            <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200">
              <Trophy className={completedCount === 10 ? "text-amber-500 fill-amber-500" : "text-slate-300"} size={28} />
            </div>
         </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl overflow-hidden">
         <button 
           onClick={() => setTab('VOCAB')} 
           className={`flex-1 py-4 font-bold text-sm transition-colors border-b-2 
             ${tab === 'VOCAB' ? 'border-brand-500 text-brand-600 bg-brand-50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
         >
           1. HAFALAN ({memorizedCount}/10)
         </button>
         <button 
           onClick={() => setTab('SURVIVAL')} 
           className={`flex-1 py-4 font-bold text-sm transition-colors border-b-2 
             ${tab === 'SURVIVAL' ? 'border-brand-500 text-brand-600 bg-brand-50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
         >
           2. SURVIVAL MODE ({completedCount}/10)
         </button>
      </div>

      {/* CONTENT */}
      {tab === 'VOCAB' ? (
        <div className="animate-slide-up">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {progress.targets.map(word => (
                    <VocabCard 
                      key={word} 
                      word={word} 
                      meaning={progress.meanings?.[word]} 
                      isMemorized={progress.memorized.includes(word)}
                      isCompleted={progress.completed.includes(word)}
                      onClick={() => toggleMemorized(word)}
                    />
                ))}
            </div>
            
            <div className="col-span-full text-center mt-8 p-6 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                <p className="text-slate-500 mb-4 text-sm">Sudah hafal beberapa kata? Saatnya uji nyali.</p>
                <button 
                  onClick={() => setTab('SURVIVAL')} 
                  disabled={memorizedCount === 0} 
                  className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black disabled:opacity-50 transition-all flex items-center gap-2 mx-auto shadow-lg shadow-slate-300"
                >
                    Lanjut ke Survival Mode <ArrowRight size={18} />
                </button>
            </div>
        </div>
      ) : (
        <div className="animate-slide-up space-y-6">
          {!scenario ? (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-200">
              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain size={40} className="text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Uji Kemampuanmu</h3>
              
              {availableForSurvival.length > 0 ? (
                <p className="text-slate-600 mb-8 max-w-sm mx-auto">
                  Kamu punya <span className="font-bold text-brand-600">{availableForSurvival.length} kata</span> yang siap diuji. 
                  AI akan memberikan situasi darurat!
                </p>
              ) : memorizedCount === 0 ? (
                <p className="text-slate-500 mb-8">Belum ada kata yang dihafal.</p>
              ) : completedCount === 10 ? (
                <p className="text-green-600 font-bold mb-8">Semua misi selesai! 🎉</p>
              ) : (
                <p className="text-slate-500 mb-8">Semua kata yang dihafal sudah lulus ujian.</p>
              )}

              <button 
                onClick={startMission} 
                disabled={availableForSurvival.length === 0 || loading} 
                className="bg-amber-500 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-amber-600 disabled:opacity-50 shadow-xl shadow-amber-100 transition-transform active:scale-95"
              >
                {loading ? 'Meracik Misi...' : 'Mulai Misi Survival'}
              </button>
            </div>
          ) : (
            <>
              <div className="bg-white border-2 border-amber-100 p-6 md:p-8 rounded-3xl shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-amber-400"></div>
                <div className="inline-block bg-amber-100 text-amber-800 text-xs font-extrabold px-3 py-1 rounded-full mb-4 tracking-wide">
                  TARGET WORD: {scenario.word}
                </div>
                <h3 className="text-2xl font-medium text-slate-900 leading-relaxed">
                  "{scenario.situation}"
                </h3>
              </div>

              {!feedback ? (
                <div className="space-y-4 animate-fade-in">
                  <textarea 
                    value={response} 
                    onChange={e => setResponse(e.target.value)} 
                    className="w-full p-6 border border-slate-300 rounded-2xl focus:ring-4 focus:ring-amber-100 focus:border-amber-400 outline-none min-h-[140px] text-lg bg-white placeholder:text-slate-400" 
                    placeholder={`Tulis responmu (Wajib pakai kata "${scenario.word}")...`}
                  />
                  <button 
                    onClick={submitMission} 
                    disabled={!response || loading} 
                    className="w-full py-4 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 disabled:opacity-70 shadow-lg shadow-brand-200 transition-all"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2"><RefreshCcw className="animate-spin" /> Sedang Menilai...</span>
                    ) : (
                      'Kirim Respon'
                    )}
                  </button>
                </div>
              ) : (
                <div className={`p-8 rounded-3xl border-2 animate-slide-up ${feedback.score >= 5 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="text-xs font-bold uppercase opacity-50 mb-1">Status</h4>
                      <span className={`text-xl font-black flex items-center gap-2 ${feedback.score >= 5 ? 'text-green-700' : 'text-red-700'}`}>
                        {feedback.score >= 5 ? <CheckCircle /> : <Lock />} 
                        {feedback.score >= 5 ? 'MISSION PASSED' : 'MISSION FAILED'}
                      </span>
                    </div>
                    <div className="text-right">
                      <h4 className="text-xs font-bold uppercase opacity-50 mb-1">Score</h4>
                      <span className="text-3xl font-black text-slate-800 flex items-center justify-end gap-2">
                        <Star className="fill-amber-400 text-amber-400" /> {feedback.score}
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-800 text-lg leading-relaxed mb-6 font-medium">
                    "{feedback.feedback}"
                  </p>

                  <div className="bg-white/60 p-5 rounded-2xl border border-slate-200/50 mb-8">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Saran Jawaban:</p>
                    <p className="italic text-slate-600 text-lg">"{feedback.improved_response}"</p>
                  </div>

                  <div className="flex gap-3">
                    {feedback.score < 5 && (
                       <button onClick={() => setFeedback(null)} className="flex-1 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors">
                         Coba Lagi
                       </button>
                    )}
                    <button onClick={startMission} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black flex justify-center items-center gap-2 shadow-lg transition-transform active:scale-95">
                      <RefreshCcw size={18} /> 
                      {feedback.score >= 5 
                        ? (availableForSurvival.length === 0 ? 'Selesai' : 'Misi Berikutnya') 
                        : 'Ganti Soal'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DailyChallenge;