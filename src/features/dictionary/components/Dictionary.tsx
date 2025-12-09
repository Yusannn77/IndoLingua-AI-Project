'use client';

import { useState, type FC, type FormEvent } from 'react';
import { 
  Search, Quote, Sparkles, AlertCircle, 
  XCircle, PlusCircle, Check, Info, BookOpenCheck, 
  ArrowRight, Tag, RefreshCcw, ArrowLeftRight
} from 'lucide-react';
import { GroqService } from '@/shared/services/groqService';
import { DBService } from '@/shared/services/dbService';
import { VocabResult, CreateFlashcardInput } from '@/shared/types';

const MAX_CHARS_DICT = 35;
const isLatinScript = (text: string): boolean => /^[a-zA-Z\s'-.,!?]+$/.test(text);

type DictMode = 'EN-ID' | 'ID-EN';

const Dictionary: FC = () => {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<DictMode>('EN-ID');
  const [loading, setLoading] = useState(false);
  const [vocabData, setVocabData] = useState<VocabResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [originalQuery, setOriginalQuery] = useState(''); 
  const [showInvalidModal, setShowInvalidModal] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length <= MAX_CHARS_DICT) {
      setInput(val);
      setErrorMsg(null);
    }
  };

  const toggleMode = () => {
    setMode(prev => prev === 'EN-ID' ? 'ID-EN' : 'EN-ID');
    setVocabData(null);
    setErrorMsg(null);
    setInput('');
  };

  // 🔥 UPDATE 1: Tambahkan parameter 'overrideMode'
  const handleSearch = async (e?: FormEvent, overrideInput?: string, overrideMode?: DictMode) => {
    if (e) e.preventDefault();
    const query = overrideInput ?? input.trim();
    if (!query) return;

    if (!isLatinScript(query)) {
      setShowInvalidModal(true);
      return;
    }

    // Tentukan mode mana yang dipakai (Override prioritas utama)
    const activeMode = overrideMode || mode;

    setOriginalQuery(query);
    setLoading(true);
    setIsSaved(false);
    setVocabData(null);
    setErrorMsg(null);

    try {
      // Gunakan activeMode, bukan state 'mode' langsung
      const result = await GroqService.explainVocab(query, activeMode);
      
      if (result.word === 'INVALID_SCOPE') {
         // Pesan error disesuaikan dengan mode
         const langName = activeMode === 'EN-ID' ? 'Inggris' : 'Indonesia';
         setErrorMsg(`"${query}" tidak dapat ditemukan atau bukan kata yang valid dalam Bahasa ${langName}.`);
      } else {
         setVocabData(result);
         
         // Sinkronisasi state jika menggunakan override (misal dari klik sinonim)
         if (overrideMode) {
           setMode(overrideMode);
           setInput(result.word); // Opsional: update input field dengan kata yang dicari
         }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Gagal menghubungi layanan AI. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFlashcard = async () => {
    if (!vocabData) return;

    const payload: CreateFlashcardInput = {
      word: vocabData.word,
      meaning: vocabData.meaning,
      contextUsage: vocabData.context_usage,
      sourceType: 'DICTIONARY' 
    };

    const saved = await DBService.createFlashcard(payload);
    
    if (saved) {
      setIsSaved(true);
    } else {
      alert(`Gagal menyimpan "${vocabData.word}". Kemungkinan kartu sudah ada di koleksimu.`);
    }
  };

  const isFigurative = vocabData?.category && vocabData.category !== 'Literal';

  return (
    <div className="max-w-3xl mx-auto space-y-8 relative font-sans">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Kamus Kontekstual</h2>
        <p className="text-slate-500 mt-2">Cari definisi, idiom, dan nuansa kata.</p>
      </div>
      
      {/* Search Input Section */}
      <div className="relative z-10">
        
        <div className="flex justify-center mb-4">
          <button 
            onClick={toggleMode}
            className="flex items-center gap-3 px-4 py-2 bg-white border-2 border-slate-200 rounded-full shadow-sm hover:border-blue-400 transition-all active:scale-95 group"
          >
            <span className={`font-bold text-sm ${mode === 'EN-ID' ? 'text-blue-600' : 'text-slate-400'}`}>🇬🇧 EN</span>
            <ArrowLeftRight size={16} className="text-slate-400 group-hover:text-blue-500" />
            <span className={`font-bold text-sm ${mode === 'ID-EN' ? 'text-blue-600' : 'text-slate-400'}`}>🇮🇩 ID</span>
          </button>
        </div>

        <form onSubmit={(e) => handleSearch(e)} className="relative group">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder={mode === 'EN-ID' ? "Cth: break the ice, thinked..." : "Cth: Lari, makan siang, semangat..."}
            className="w-full pl-12 pr-24 py-4 text-lg bg-white text-slate-900 placeholder-slate-400 border-2 border-slate-200 rounded-2xl shadow-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={24} />
          <div className="absolute right-24 top-1/2 -translate-y-1/2 text-xs font-mono font-medium text-slate-400 bg-white px-2">
            <span className={input.length === MAX_CHARS_DICT ? 'text-red-500' : ''}>{input.length}</span>/{MAX_CHARS_DICT}
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="absolute right-2 top-2 bottom-2 px-6 bg-slate-900 text-white rounded-xl font-medium hover:bg-black disabled:bg-slate-200 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center"
          >
            {loading ? <Sparkles className="animate-spin" size={20}/> : 'Cari'}
          </button>
        </form>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700 animate-slide-up">
            <AlertCircle size={20} /> <p className="font-medium">{errorMsg}</p>
        </div>
      )}

      {loading && (
        <div className="space-y-4 animate-pulse">
            <div className="bg-slate-100 rounded-xl h-32 w-full"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-100 rounded-xl h-24"></div>
              <div className="bg-slate-100 rounded-xl h-24"></div>
            </div>
        </div>
      )}

      {vocabData && !loading && (
        <div className="space-y-6 animate-fade-in">
          
          {mode === 'ID-EN' && (
             <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-3 py-2 rounded-lg w-full border border-slate-200 mb-2">
                <Info size={16} className="text-blue-500 shrink-0"/>
                <span>Hasil untuk kata Inggris: <strong className="text-slate-800">{vocabData.word}</strong> (Input asli: <em>{originalQuery}</em>)</span>
             </div>
          )}

          {(vocabData.isMisconception || vocabData.isTypo) && (
            <div className={`rounded-2xl p-5 border-l-4 shadow-sm animate-slide-up ${
                vocabData.isMisconception 
                  ? 'bg-violet-50 border-violet-500 text-violet-900' 
                  : 'bg-amber-50 border-amber-400 text-amber-900'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="mt-1 shrink-0">
                  {vocabData.isMisconception 
                    ? <BookOpenCheck className="text-violet-600" size={24} /> 
                    : <RefreshCcw className="text-amber-600" size={22} />
                  }
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3 font-mono text-lg">
                    {mode === 'ID-EN' && vocabData.correctedSource ? (
                       <>
                         <span className="line-through opacity-60">{vocabData.originalInput || originalQuery}</span>
                         <ArrowRight size={18} className="opacity-60" />
                         <span className="font-bold tracking-tight text-blue-700">{vocabData.correctedSource}</span>
                       </>
                    ) : (
                       <>
                         <span className="line-through opacity-60">{vocabData.originalInput || originalQuery}</span>
                         <ArrowRight size={18} className="opacity-60" />
                         <span className="font-bold tracking-tight">{vocabData.word}</span>
                       </>
                    )}
                  </div>
                  
                  <p className={`text-sm leading-relaxed ${vocabData.isMisconception ? 'text-violet-800' : 'text-amber-800'}`}>
                    {vocabData.errorAnalysis || "Terdeteksi kesalahan penulisan atau penggunaan kata."}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-8 flex flex-col md:flex-row justify-between gap-6 relative overflow-hidden group">
             <div className={`absolute top-0 left-0 w-1.5 h-full transition-colors ${isFigurative ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
             
             <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">{vocabData.word}</h3>
                  {isFigurative && (
                    <span className="px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full uppercase tracking-wide border border-purple-200">
                      {vocabData.category}
                    </span>
                  )}
                </div>
                <p className="text-xl text-slate-600 font-medium leading-relaxed">{vocabData.meaning}</p>
             </div>

             <div className="flex flex-col items-end gap-4">
                {/* SINONIM */}
                <div className="flex flex-wrap gap-2 justify-end">
                  {vocabData.synonyms?.slice(0, 4).map((syn, i) => (
                    <button 
                      key={i} 
                      onClick={() => { 
                        // 🔥 UPDATE 2: Logic Pintar Klik Sinonim
                        // Sinonim selalu bahasa Inggris. Jadi jika kita di mode ID-EN, 
                        // kita harus paksa switch ke EN-ID agar 'syn' (kata Inggris) bisa diproses.
                        const nextMode = 'EN-ID'; 
                        setInput(syn); 
                        
                        // Pass 'nextMode' ke handleSearch untuk eksekusi langsung
                        handleSearch(undefined, syn, nextMode); 
                      }} 
                      className="px-3 py-1.5 bg-slate-50 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors border border-slate-200"
                    >
                      {syn}
                    </button>
                  ))}
                </div>

                <button onClick={handleSaveFlashcard} disabled={isSaved} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-sm ${isSaved ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'}`}>
                   {isSaved ? <Check size={18}/> : <PlusCircle size={18}/>} {isSaved ? 'Tersimpan' : 'Simpan Flashcard'}
                </button>
             </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
             <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                <div className="flex items-center gap-2 text-amber-600 mb-3 font-bold text-sm uppercase tracking-wide">
                  {isFigurative ? <Tag size={16}/> : <Info size={16}/>} 
                  {isFigurative ? "Analisis Makna" : "Nuansa & Detail"}
                </div>
                {isFigurative ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="text-slate-400 font-bold uppercase text-xs">Literal</span>
                      <span className="text-slate-800 font-medium text-right">{vocabData.literal_meaning}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold uppercase text-xs">Figuratif</span>
                      <span className="text-purple-700 font-bold text-right">{vocabData.figurative_meaning}</span>
                    </div>
                    <p className="text-slate-600 mt-2 italic border-t border-slate-200 pt-2">{vocabData.nuance_comparison}</p>
                  </div>
                ) : (
                  <p className="text-slate-700 leading-relaxed font-medium">{vocabData.nuance_comparison}</p>
                )}
             </div>

             <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                <div className="flex items-center gap-2 text-purple-600 mb-3 font-bold text-sm uppercase tracking-wide">
                  <Quote size={16}/> Konteks Penggunaan
                </div>
                <p className="text-slate-700 italic text-lg leading-relaxed">&quot;{vocabData.context_usage}&quot;</p>
             </div>
          </div>
        </div>
      )}

      {showInvalidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-6 text-center border border-slate-100">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500"><XCircle size={28} /></div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Input Tidak Valid</h3>
            <p className="text-slate-500 text-sm mb-6">Mohon gunakan karakter huruf Latin (A-Z).</p>
            <button onClick={() => { setShowInvalidModal(false); setInput(''); }} className="w-full py-3 px-4 bg-slate-900 hover:bg-black text-white rounded-xl font-bold transition-colors">Mengerti</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dictionary;