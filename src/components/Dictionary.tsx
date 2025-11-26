'use client';

import { useState, type FC, type FormEvent } from 'react';
import { 
  Search, Quote, SpellCheck, Sparkles, AlertCircle, 
  XCircle, PlusCircle, Check, Info, BookOpenCheck, 
  ArrowRight, AlertTriangle 
} from 'lucide-react';
import { GeminiService } from '@/services/geminiService';
import { DBService } from '@/services/dbService'; 
import { VocabResult, GrammarCheckResult } from '@/types';

const MAX_CHARS_DICT = 50;

const isLatinScript = (text: string): boolean => {
  const LATIN_REGEX = /^[a-zA-Z\s'-.,!?]+$/;
  return LATIN_REGEX.test(text);
};

const Dictionary: FC = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [vocabData, setVocabData] = useState<VocabResult | null>(null);
  const [grammarData, setGrammarData] = useState<GrammarCheckResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [viewMode, setViewMode] = useState<'DICTIONARY' | 'GRAMMAR'>('DICTIONARY');
  const [originalQuery, setOriginalQuery] = useState(''); 
  const [showInvalidModal, setShowInvalidModal] = useState(false);

  const handleSearch = async (e?: FormEvent, overrideInput?: string) => {
    if (e) e.preventDefault();
    const query = overrideInput ?? input.trim();
    
    if (!query) return;

    if (!isLatinScript(query)) {
      setShowInvalidModal(true);
      return;
    }

    if (viewMode === 'DICTIONARY' && query.length > MAX_CHARS_DICT) {
       if (!overrideInput) {
          setErrorMsg(`Teks terlalu panjang untuk kamus. Beralihlah ke Grammar Check.`);
          return;
       }
    }

    setOriginalQuery(query);
    setLoading(true);
    setIsSaved(false);
    setVocabData(null);
    setGrammarData(null);
    setErrorMsg(null);

    try {
      if (viewMode === 'DICTIONARY') {
        const result = await GeminiService.explainVocab(query);
        if (result.word === 'INVALID_SCOPE') {
           setErrorMsg(`"${query}" tidak valid. Mohon gunakan Bahasa Inggris.`);
        } else {
           setVocabData(result);
        }
      } else {
        const result = await GeminiService.checkGrammar(query);
        setGrammarData(result);
      }
    } catch (err) {
      console.error("Error:", err);
      setErrorMsg("Terjadi kesalahan koneksi.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVocab = async () => {
    if (!vocabData) return;
    const saved = await DBService.addVocab({
      word: vocabData.word,
      translation: vocabData.meaning,
      originalSentence: vocabData.context_usage
    });
    if (saved) setIsSaved(true);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 relative">
      
      {/* Header & Toggle */}
      <div className="text-center space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {viewMode === 'DICTIONARY' ? 'Kamus Kontekstual' : 'Cek Tata Bahasa'}
          </h2>
          <p className="text-slate-600 mt-1">
            {viewMode === 'DICTIONARY' 
              ? 'Cari kata, idiom, atau frasa pendek.' 
              : 'Periksa dan perbaiki kalimat bahasa Inggris.'}
          </p>
        </div>
        
        <div className="flex justify-center gap-2 bg-slate-100 p-1 rounded-full w-fit mx-auto">
          <button 
            onClick={() => { setViewMode('DICTIONARY'); setErrorMsg(null); setVocabData(null); setGrammarData(null); }}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${viewMode === 'DICTIONARY' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Kamus
          </button>
          <button 
            onClick={() => { setViewMode('GRAMMAR'); setErrorMsg(null); setVocabData(null); setGrammarData(null); }}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${viewMode === 'GRAMMAR' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Grammar Check
          </button>
        </div>
      </div>
      
      {/* Search Input */}
      <div className="relative z-10">
        <form onSubmit={(e) => handleSearch(e)} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setErrorMsg(null); }}
            placeholder={viewMode === 'DICTIONARY' ? "Cth: actually, piece of cake..." : "Cth: I buyed a laptop yesterday..."}
            className="w-full pl-12 pr-24 py-4 text-lg bg-white text-slate-900 placeholder-slate-400 border-2 border-slate-200 rounded-2xl shadow-sm outline-none focus:border-blue-500 transition-all"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="absolute right-2 top-2 bottom-2 px-6 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center"
          >
            {loading ? <Sparkles className="animate-spin" size={20}/> : 'Cek'}
          </button>
        </form>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700 animate-slide-up">
            <AlertCircle size={20} />
            <p className="font-medium">{errorMsg}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-6 animate-pulse">
            <div className="bg-white border border-slate-200 rounded-xl p-8 h-40"></div>
        </div>
      )}

      {/* --- RESULT: DICTIONARY --- */}
      {viewMode === 'DICTIONARY' && vocabData && !loading && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Banner: Misconception / Typo */}
          {(vocabData.isMisconception || vocabData.isTypo) && (
            <div className={`border rounded-xl p-4 flex gap-3 shadow-sm ${vocabData.isMisconception ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
              <div className={`p-2 rounded-full shrink-0 mt-1 ${vocabData.isMisconception ? 'bg-blue-100' : 'bg-amber-100'}`}>
                {vocabData.isMisconception ? <BookOpenCheck size={20} /> : <Info size={20} />}
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm uppercase mb-1 opacity-80">
                  {vocabData.isMisconception ? 'Koreksi Konsep' : 'Auto-Correct'}
                </p>
                
                {/* FIX: Menggunakan &quot; untuk menggantikan tanda kutip literal */}
                <p className="mb-2 text-lg font-bold flex items-center gap-2 flex-wrap">
                  <span className="line-through opacity-60">&quot;{originalQuery}&quot;</span> 
                  <ArrowRight className="w-4 h-4 opacity-60"/> 
                  <span>&quot;{vocabData.word}&quot;</span>
                </p>
                
                {vocabData.misconceptionRule && (
                   <p className="text-sm opacity-90 pt-2 border-t border-current/20">💡 {vocabData.misconceptionRule}</p>
                )}
              </div>
            </div>
          )}
          
          {/* Main Card */}
          <div className="bg-white border-l-4 border-blue-600 rounded-r-xl shadow-sm p-6 flex flex-col md:flex-row justify-between gap-4">
             <div className="flex-1">
                <h3 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-2">{vocabData.word}</h3>
                <p className="text-lg text-slate-600 font-medium leading-relaxed">{vocabData.meaning}</p>
             </div>
             <div className="flex flex-col items-end gap-3">
                <div className="flex flex-wrap gap-2 justify-end">
                  {vocabData.synonyms?.map((syn, i) => (
                    <button key={i} onClick={() => { setInput(syn); handleSearch(undefined, syn); }} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs rounded-full hover:bg-slate-200 transition-colors">{syn}</button>
                  ))}
                </div>
                <button onClick={handleSaveVocab} disabled={isSaved} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm ${isSaved ? 'bg-green-100 text-green-700' : 'bg-slate-900 text-white hover:bg-black'}`}>
                   {isSaved ? <Check size={16}/> : <PlusCircle size={16}/>} {isSaved ? 'Tersimpan' : 'Simpan'}
                </button>
             </div>
          </div>

          {/* Context & Nuance */}
          <div className="grid md:grid-cols-2 gap-6">
             <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 text-purple-600 mb-3"><Quote size={20}/><h4 className="font-bold">Konteks</h4></div>
                {/* FIX: Menggunakan &quot; */}
                <p className="text-slate-700 italic leading-relaxed">&quot;{vocabData.context_usage}&quot;</p>
             </div>
             <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 text-blue-600 mb-3"><Info size={20}/><h4 className="font-bold">Nuansa</h4></div>
                <p className="text-slate-700 leading-relaxed">{vocabData.nuance_comparison}</p>
             </div>
          </div>
        </div>
      )}

      {/* --- RESULT: GRAMMAR CHECKER --- */}
      {viewMode === 'GRAMMAR' && grammarData && !loading && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
            <div className="bg-blue-600 p-8 text-white">
               <p className="text-blue-100 text-sm font-bold uppercase tracking-wider mb-4">Hasil Perbaikan</p>
               <div className="space-y-4">
                 {/* FIX: Menggunakan &quot; */}
                 <div className="opacity-70 text-lg line-through decoration-blue-300 decoration-2 font-mono">
                   &quot;{originalQuery}&quot;
                 </div>
                 <h3 className="text-2xl md:text-3xl font-serif font-medium leading-relaxed">
                   &quot;{grammarData.correctedSentence}&quot;
                 </h3>
               </div>
            </div>
            
            <div className="p-6">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-8 text-blue-900 font-medium flex gap-3">
                 <Sparkles className="shrink-0 text-blue-500" />
                 <p>{grammarData.generalFeedback}</p>
              </div>

              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="text-red-500" size={20}/> 
                Analisis Kesalahan ({grammarData.errors.length})
              </h4>
              
              <div className="space-y-3">
                {grammarData.errors.length === 0 ? (
                  <p className="text-slate-500 italic p-4 text-center">Tidak ada kesalahan gramatikal yang ditemukan. Good job!</p>
                ) : (
                  grammarData.errors.map((err, i) => (
                    <div key={i} className="p-4 bg-white border border-slate-200 rounded-xl hover:border-red-200 transition-colors group">
                       <div className="flex flex-wrap justify-between items-start mb-2 gap-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-mono text-red-600 bg-red-50 px-2 py-1 rounded text-sm line-through decoration-2">{err.original}</span>
                            <ArrowRight size={16} className="text-slate-300"/>
                            <span className="font-mono text-green-600 bg-green-50 px-2 py-1 rounded text-sm font-bold">{err.correction}</span>
                          </div>
                          <span className="text-[10px] uppercase font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">{err.type}</span>
                       </div>
                       <p className="text-sm text-slate-600 mt-2">{err.explanation}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invalid Modal */}
      {showInvalidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><XCircle size={32} className="text-red-500" /></div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Input Tidak Valid</h3>
            <p className="text-slate-500 text-sm mb-6">Hanya huruf latin dan tanda baca standar yang diperbolehkan.</p>
            <button onClick={() => { setShowInvalidModal(false); setInput(''); }} className="w-full py-3 px-4 bg-slate-900 hover:bg-black text-white rounded-xl font-bold">Mengerti</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dictionary;