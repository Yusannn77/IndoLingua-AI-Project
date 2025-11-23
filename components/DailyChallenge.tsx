import React, { useState, useEffect } from 'react';
import { Trophy, CheckCircle, Lock, Brain, Target, ArrowRight, RefreshCcw, Star, Zap } from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { ChallengeFeedback, DailyProgress, SurvivalScenario } from '../types';
import { advancedVocabList } from '../data/advancedVocab';

const STORAGE_KEY = 'indolingua_daily_v1';

// Fungsi helper generate data
const generateNewDaily = (date: string): DailyProgress => {
  const shuffled = [...advancedVocabList].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 10);
  
  return {
    date,
    targets: selected,
    memorized: [],
    completed: []
  };
};

const DailyChallenge: React.FC = () => {
  const [tab, setTab] = useState<'VOCAB' | 'SURVIVAL'>('VOCAB');
  
  // --- CORE LOGIC: PERSISTENCE ---
  const [progress, setProgress] = useState<DailyProgress>(() => {
    const today = new Date().toISOString().split('T')[0]; 
    
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const data = JSON.parse(saved);
          if (data.date === today) {
            return data; 
          }
        }
      }
    } catch (e) {
      console.error("Gagal membaca daily progress:", e);
    }

    return generateNewDaily(today);
  });
  
  // Survival State
  const [activeScenario, setActiveScenario] = useState<SurvivalScenario | null>(null);
  const [userResponse, setUserResponse] = useState('');
  const [feedback, setFeedback] = useState<ChallengeFeedback | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-Save
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  // --- HANDLERS ---

  const toggleMemorized = (word: string) => {
    const isMemorized = progress.memorized.includes(word);
    
    let newMemorized;
    if (isMemorized) {
      newMemorized = progress.memorized.filter(w => w !== word);
    } else {
      newMemorized = [...progress.memorized, word];
    }

    setProgress({ ...progress, memorized: newMemorized });
  };

  const startSurvivalMission = async () => {
    const availableWords = progress.memorized.filter(w => !progress.completed.includes(w));
    
    if (availableWords.length === 0) {
        alert("Semua kata yang dihafal sudah lulus Survival Mode! Tambah hafalan lagi.");
        return;
    }

    const targetWord = availableWords[Math.floor(Math.random() * availableWords.length)];
    
    setLoading(true);
    setFeedback(null);
    setUserResponse('');
    setActiveScenario(null); 
    
    try {
      const scenario = await GeminiService.generateSurvivalScenario(targetWord);
      setActiveScenario(scenario);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const submitSurvivalResponse = async () => {
    if (!activeScenario || !userResponse) return;
    setLoading(true);
    try {
      const result = await GeminiService.evaluateSurvivalResponse(
        activeScenario.situation,
        activeScenario.word,
        userResponse
      );
      setFeedback(result);

      if (result.score >= 6) {
        if (!progress.completed.includes(activeScenario.word)) {
            setProgress(prev => ({
                ...prev,
                completed: [...prev.completed, activeScenario.word]
            }));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const completedCount = progress.completed.length;
  const totalCount = progress.targets.length;
  const memorizedCount = progress.memorized.length;
  const readyForSurvivalCount = progress.memorized.filter(w => !progress.completed.includes(w)).length;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      
      {/* HEADER PROGRESS */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 animate-fade-in">
         <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Target className="text-brand-600" /> Misi Harian ({progress.date})
            </h2>
            <p className="text-slate-500 text-sm">Selesaikan 10 kata B2-C2 hari ini untuk menjaga streak!</p>
         </div>
         <div className="flex items-center gap-4">
            <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mastered</p>
                <p className="text-3xl font-black text-brand-600">{completedCount}<span className="text-lg text-slate-300 font-medium">/{totalCount}</span></p>
            </div>
            <div className="w-16 h-16 rounded-full border-4 border-slate-100 flex items-center justify-center relative bg-white">
                <div 
                    className="absolute inset-0 rounded-full border-4 border-brand-500 transition-all duration-1000 ease-out"
                    style={{ clipPath: `inset(${100 - (completedCount/totalCount)*100}% 0 0 0)` }}
                ></div>
                <Trophy className={completedCount === 10 ? "text-amber-500 fill-amber-100" : "text-slate-300"} size={24} />
            </div>
         </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-slate-200">
         <button 
            onClick={() => setTab('VOCAB')}
            className={`flex-1 py-4 text-center font-medium transition-colors border-b-2 ${tab === 'VOCAB' ? 'border-brand-500 text-brand-600 bg-brand-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
         >
            1. Hafalan ({memorizedCount}/10)
         </button>
         <button 
            onClick={() => setTab('SURVIVAL')}
            className={`flex-1 py-4 text-center font-medium transition-colors border-b-2 ${tab === 'SURVIVAL' ? 'border-brand-500 text-brand-600 bg-brand-50/50' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
         >
            2. Survival Mode ({completedCount}/10)
         </button>
      </div>

      {/* === TAB 1: VOCAB LIST (FLASH CARD STYLE) === */}
      {tab === 'VOCAB' && (
        <div className="animate-slide-up">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {progress.targets.map((word, idx) => {
                    const isMemorized = progress.memorized.includes(word);
                    const isCompleted = progress.completed.includes(word);
                    
                    return (
                        <div 
                            key={word} 
                            onClick={() => toggleMemorized(word)}
                            className={`
                                relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 active:scale-95 group overflow-hidden
                                ${isCompleted 
                                    ? 'bg-emerald-50 border-emerald-400 opacity-90' 
                                    : isMemorized 
                                        ? 'bg-white border-brand-500 shadow-md shadow-brand-100' 
                                        : 'bg-white border-slate-200 hover:border-brand-300 hover:shadow-sm'
                                }
                            `}
                        >
                            {/* Status Icon Top Right */}
                            <div className="absolute top-4 right-4 transition-all duration-300">
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

                            {/* Word Content */}
                            <div className="flex flex-col h-full justify-center">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                                    {isCompleted ? 'MASTERED' : isMemorized ? 'MEMORIZED' : 'TO LEARN'}
                                </span>
                                <h3 className={`text-2xl font-bold ${isCompleted ? 'text-emerald-800' : isMemorized ? 'text-brand-700' : 'text-slate-800'}`}>
                                    {word}
                                </h3>
                            </div>

                            {/* Decorative Background Icon */}
                            {isMemorized && !isCompleted && (
                                <Zap size={80} className="absolute -bottom-4 -right-4 text-brand-50 opacity-50 pointer-events-none" />
                            )}
                            {isCompleted && (
                                <Star size={80} className="absolute -bottom-4 -right-4 text-emerald-100 opacity-50 pointer-events-none" />
                            )}
                        </div>
                    );
                })}
            </div>
            
            <div className="mt-8 text-center">
                <p className="text-sm text-slate-500 mb-4">Klik kartu untuk menandai sudah hafal.</p>
                <button 
                    onClick={() => setTab('SURVIVAL')}
                    disabled={memorizedCount === 0}
                    className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-2 mx-auto shadow-lg shadow-slate-200"
                >
                    Lanjut ke Survival Mode <ArrowRight size={18} />
                </button>
            </div>
        </div>
      )}

      {/* === TAB 2: SURVIVAL MODE === */}
      {tab === 'SURVIVAL' && (
        <div className="animate-slide-up">
            {!activeScenario ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 border-dashed">
                    <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Brain size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Uji Kemampuanmu</h3>
                    
                    <div className="max-w-md mx-auto mb-8">
                        {readyForSurvivalCount > 0 ? (
                            <p className="text-slate-600">
                                Kamu punya <span className="font-bold text-brand-600">{readyForSurvivalCount} kata</span> yang siap diuji. 
                                AI akan memberikan situasi darurat, dan kamu harus merespon menggunakan kata tersebut.
                            </p>
                        ) : memorizedCount === 0 ? (
                            <p className="text-slate-500">
                                Belum ada kata yang dihafal. Silakan ceklist kata di tab <b>Hafalan</b> dulu.
                            </p>
                        ) : completedCount === 10 ? (
                            <p className="text-green-600 font-bold">
                                Selamat! Kamu sudah menyelesaikan semua misi hari ini! 🎉
                            </p>
                        ) : (
                            <p className="text-slate-500">
                                Semua kata yang dihafal sudah lulus! Tambah hafalan baru di tab sebelah.
                            </p>
                        )}
                    </div>

                    <button 
                        onClick={startSurvivalMission}
                        disabled={readyForSurvivalCount === 0 || loading}
                        className="bg-amber-500 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-200 flex items-center gap-2 mx-auto"
                    >
                        {loading ? 'Meracik Skenario...' : 'Mulai Misi Survival'}
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* KARTU MISI */}
                    <div className="bg-white border-2 border-amber-100 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-amber-100 text-amber-800 text-xs font-bold px-4 py-2 rounded-bl-xl tracking-wide">
                            TARGET WORD: <span className="text-amber-900 uppercase">{activeScenario.word}</span>
                        </div>
                        <div className="mt-2">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Lock size={14}/> Situasi Survival
                            </h3>
                            <p className="text-xl md:text-2xl font-medium text-slate-900 leading-relaxed">
                                "{activeScenario.situation}"
                            </p>
                        </div>
                    </div>

                    {/* INPUT USER */}
                    {!feedback ? (
                        <div className="space-y-4 animate-fade-in">
                            <div className="relative">
                                <textarea 
                                    value={userResponse}
                                    onChange={(e) => setUserResponse(e.target.value)}
                                    placeholder={`Tulis responmu dalam Bahasa Inggris... \n(Wajib menggunakan kata "${activeScenario.word}")`}
                                    className="w-full p-5 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none min-h-[140px] text-lg bg-slate-50 focus:bg-white transition-colors placeholder:text-slate-400"
                                />
                                <div className="absolute bottom-4 right-4 text-xs text-slate-400 font-medium bg-white/80 px-2 py-1 rounded">
                                    {userResponse.length} chars
                                </div>
                            </div>
                            <button 
                                onClick={submitSurvivalResponse}
                                disabled={!userResponse || loading}
                                className="w-full py-4 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 disabled:opacity-70 transition-all shadow-md flex justify-center items-center gap-2"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2"><RefreshCcw className="animate-spin" size={20}/> Sedang Menilai...</span>
                                ) : (
                                    'Kirim Respon'
                                )}
                            </button>
                        </div>
                    ) : (
                        /* FEEDBACK */
                        <div className={`p-6 md:p-8 rounded-3xl border-2 animate-slide-up shadow-sm ${feedback.score >= 6 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h4 className="text-sm font-bold uppercase tracking-wider opacity-60 mb-1">Status Misi</h4>
                                    <div className="flex items-center gap-2 font-bold text-2xl">
                                        {feedback.score >= 6 ? (
                                            <span className="text-green-700 flex items-center gap-2"><CheckCircle className="fill-green-200" /> Lulus!</span>
                                        ) : (
                                            <span className="text-red-700 flex items-center gap-2"><Lock className="fill-red-200" /> Gagal</span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold uppercase opacity-60 mb-1">Skor AI</p>
                                    <div className="flex items-center justify-end gap-1 font-black text-3xl text-slate-800">
                                        <Star className="fill-amber-400 text-amber-400" size={28} /> {feedback.score}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white/60 p-5 rounded-2xl border border-slate-200/50 mb-6">
                                <p className="font-bold text-slate-700 mb-2 text-sm uppercase">Feedback Guru:</p>
                                <p className="text-slate-800 leading-relaxed text-lg">{feedback.feedback}</p>
                            </div>
                            
                            <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 mb-8">
                                <p className="text-xs font-bold text-blue-600 uppercase mb-2">Contoh Respon Natural:</p>
                                <p className="text-blue-900 italic font-medium text-lg">"{feedback.improved_response}"</p>
                            </div>

                            <div className="flex gap-3">
                                {feedback.score < 6 && (
                                    <button 
                                        onClick={() => setFeedback(null)} 
                                        className="flex-1 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                                    >
                                        Coba Lagi
                                    </button>
                                )}
                                <button 
                                    onClick={startSurvivalMission} 
                                    className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black flex items-center justify-center gap-2 transition-colors shadow-lg"
                                >
                                    <RefreshCcw size={18} /> {feedback.score >= 6 ? 'Misi Berikutnya' : 'Ganti Soal'}
                                </button>
                            </div>
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