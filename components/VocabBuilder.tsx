import React, { useState } from 'react';
import { Search, Quote, SpellCheck, Sparkles, AlertCircle, XCircle } from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { VocabResult } from '../types';

/**
 * Stage 1 Validation: Syntax Check
 * Filters out obvious non-English scripts (Numbers, Symbols, Kanji, etc.)
 */
const isLatinScript = (text: string): boolean => {
  const LATIN_REGEX = /^[a-zA-Z\s'-]+$/;
  return LATIN_REGEX.test(text);
};

const VocabBuilder: React.FC = () => {
  const [word, setWord] = useState('');
  const [data, setData] = useState<VocabResult | null>(null);
  const [loading, setLoading] = useState(false);
  
  // State Error & Modal
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showInvalidModal, setShowInvalidModal] = useState(false);

  const executeSearch = async (targetWord: string) => {
    setLoading(true);
    setData(null);
    setErrorMsg(null);

    try {
      const result = await GeminiService.explainVocab(targetWord);
      
      // Stage 2 Validation: Semantic Check (from AI - via INVALID_SCOPE check)
      if (result.word === 'INVALID_SCOPE') {
        setErrorMsg(`"${targetWord}" sepertinya bukan kata Bahasa Inggris yang valid. Mohon masukkan kata Bahasa Inggris.`);
      } else {
        setData(result);
      }
    } catch (err) {
      console.error("VocabBuilder Fetch Error:", err);
      setErrorMsg("Terjadi kesalahan koneksi. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e?: React.FormEvent, keyword?: string) => {
    if (e) e.preventDefault();
    
    const rawInput = keyword ?? word;
    const sanitizedInput = rawInput.trim();

    if (!sanitizedInput) return;

    // Stage 1: Client-side Validation (Zero Cost)
    if (!isLatinScript(sanitizedInput)) {
      setShowInvalidModal(true);
      return;
    }

    if (keyword) setWord(keyword);
    executeSearch(sanitizedInput);
  };

  const closeInvalidModal = () => {
    setShowInvalidModal(false);
    setWord(''); 
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 relative">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Kamus Kontekstual</h2>
        <p className="text-slate-600 mt-2">Pahami kata bahasa Inggris lebih dalam dengan konteks Indonesia.</p>
      </div>

      <form onSubmit={handleSearch} className="relative z-10">
        <input
          type="text"
          value={word}
          onChange={(e) => {
            setWord(e.target.value);
            if (errorMsg) setErrorMsg(null);
          }}
          placeholder="Masukkan kata (contoh: actually, hang out)"
          className={`w-full pl-12 pr-4 py-4 text-lg bg-white text-slate-900 placeholder-slate-400 border rounded-2xl shadow-sm outline-none transition-all ${errorMsg ? 'border-red-300 ring-4 ring-red-50' : 'border-slate-200 focus:ring-4 focus:ring-brand-100 focus:border-brand-500'}`}
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
        <button
          type="submit"
          disabled={loading || !word}
          className="absolute right-2 top-2 bottom-2 px-6 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          {loading ? 'Mencari...' : 'Cari'}
        </button>
      </form>

      {/* Error Feedback UI (Server Side / AI Error) */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700 animate-slide-up">
            <AlertCircle size={20} />
            <p className="font-medium">{errorMsg}</p>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-6 animate-pulse">
            <div className="bg-white border-l-4 border-slate-200 rounded-r-xl p-6 flex flex-col gap-3">
                <div className="h-10 bg-slate-200 rounded w-1/3"></div>
                <div className="h-6 bg-slate-200 rounded w-2/3"></div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
                <div className="h-40 bg-slate-200 rounded-xl"></div>
                <div className="h-40 bg-slate-200 rounded-xl"></div>
            </div>
        </div>
      )}

      {/* Result View (Only if Valid) */}
      {!loading && data && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white border-l-4 border-brand-500 rounded-r-xl shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-4xl font-bold text-brand-900 tracking-tight">{data.word}</h3>
              <p className="text-lg text-slate-600 mt-1 font-medium">{data.meaning}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.synonyms.map((syn, i) => (
                <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded-full font-medium border border-slate-200">
                  {syn}
                </span>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-accent-300 transition-colors group">
              <div className="flex items-center gap-2 text-accent-500 mb-4">
                <Quote size={24} className="group-hover:scale-110 transition-transform"/>
                <h4 className="font-semibold text-lg text-slate-800">Konteks Penggunaan</h4>
              </div>
              <p className="text-slate-700 leading-relaxed italic bg-accent-50/50 p-4 rounded-lg border border-accent-100">
                "{data.context_usage}"
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-purple-300 transition-colors group">
              <div className="flex items-center gap-2 text-purple-600 mb-4">
                <SpellCheck size={24} className="group-hover:scale-110 transition-transform"/>
                <h4 className="font-semibold text-lg text-slate-800">Nuansa & Perbedaan</h4>
              </div>
              <p className="text-slate-700 leading-relaxed">
                {data.nuance_comparison}
              </p>
            </div>
          </div>
        </div>
      )}

      {!data && !loading && !errorMsg && (
        <div className="mt-12">
            <p className="text-center text-slate-400 text-sm mb-4">Coba kata-kata populer ini:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 opacity-70 hover:opacity-100 transition-opacity">
            {['Literally', 'Lowkey', 'Overwhelmed', 'Figure out'].map(w => (
                <button key={w} onClick={() => handleSearch(undefined, w)} className="p-4 border border-dashed border-slate-300 rounded-xl text-center text-slate-500 font-medium hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50 transition-all flex flex-col items-center gap-2">
                    <Sparkles size={16} className="text-slate-300" />
                    {w}
                </button>
            ))}
            </div>
        </div>
      )}

      {/* --- CUSTOM MODAL FOR INVALID INPUT --- */}
      {showInvalidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100 animate-slide-up">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle size={32} className="text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Input Tidak Valid</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Mohon hanya gunakan huruf alfabet (A-Z). Karakter seperti Kanji, Hanzi, atau simbol angka tidak didukung.
              </p>
              <button 
                onClick={closeInvalidModal}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-black text-white rounded-xl font-semibold transition-colors shadow-lg shadow-slate-200"
              >
                Mengerti, Coba Lagi
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default VocabBuilder;