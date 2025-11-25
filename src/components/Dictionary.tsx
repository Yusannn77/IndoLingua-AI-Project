'use client';

import { useState, type FC, type FormEvent } from 'react';
import { Search, Quote, SpellCheck, Sparkles, AlertCircle, XCircle, PlusCircle, Check } from 'lucide-react';
import { GeminiService } from '@/services/geminiService';
import { DBService } from '@/services/dbService'; // Import DBService
import { VocabResult } from '@/types';

const isLatinScript = (text: string): boolean => {
  const LATIN_REGEX = /^[a-zA-Z\s'-]+$/;
  return LATIN_REGEX.test(text);
};

const Dictionary: FC = () => {
  const [word, setWord] = useState('');
  const [data, setData] = useState<VocabResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showInvalidModal, setShowInvalidModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false); // State untuk status simpan

  const executeSearch = async (targetWord: string) => {
    setLoading(true);
    setData(null);
    setErrorMsg(null);
    setIsSaved(false); // Reset status simpan saat cari kata baru

    try {
      const result = await GeminiService.explainVocab(targetWord);
      if (result.word === 'INVALID_SCOPE') {
        setErrorMsg(`"${targetWord}" sepertinya bukan kata Bahasa Inggris yang valid.`);
      } else {
        setData(result);
      }
    } catch (err) {
      console.error("Dictionary Fetch Error:", err);
      setErrorMsg("Terjadi kesalahan koneksi. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e?: FormEvent, keyword?: string) => {
    if (e) e.preventDefault();
    const rawInput = keyword ?? word;
    const sanitizedInput = rawInput.trim();

    if (!sanitizedInput) return;

    if (!isLatinScript(sanitizedInput)) {
      setShowInvalidModal(true);
      return;
    }

    // Update input field jika pencarian berasal dari klik tombol sinonim/suggest
    if (keyword) setWord(keyword);
    
    executeSearch(sanitizedInput);
  };

  // --- FUNGSI BARU: Simpan ke Database ---
  const handleSaveToDb = async () => {
    if (!data) return;
    
    try {
      const saved = await DBService.addVocab({
        word: data.word,
        translation: data.meaning,
        originalSentence: data.context_usage
      });
      
      if (saved) {
        setIsSaved(true);
      }
    } catch (e) {
      console.error("Failed to save vocab:", e);
      alert("Gagal menyimpan ke database.");
    }
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
          className={`w-full pl-12 pr-4 py-4 text-lg bg-white text-slate-900 placeholder-slate-400 border rounded-2xl shadow-sm outline-none transition-all ${errorMsg ? 'border-red-300 ring-4 ring-red-50' : 'border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500'}`}
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
        <button
          type="submit"
          disabled={loading || !word}
          className="absolute right-2 top-2 bottom-2 px-6 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          {loading ? 'Mencari...' : 'Cari'}
        </button>
      </form>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700 animate-slide-up">
            <AlertCircle size={20} />
            <p className="font-medium">{errorMsg}</p>
        </div>
      )}

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

      {!loading && data && (
        <div className="space-y-6 animate-fade-in">
          {/* Result Header with Save Button */}
          <div className="bg-white border-l-4 border-blue-500 rounded-r-xl shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-4xl font-bold text-blue-900 tracking-tight">{data.word}</h3>
              <p className="text-lg text-slate-600 mt-1 font-medium">{data.meaning}</p>
            </div>
            
            <div className="flex flex-col md:items-end gap-3 w-full md:w-auto">
                {/* BAGIAN SINONIM YANG SEKARANG BISA DIKLIK */}
                <div className="flex flex-wrap gap-2 justify-end">
                  {data.synonyms.map((syn, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleSearch(undefined, syn)}
                        disabled={loading}
                        className="px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded-full font-medium border border-slate-200 hover:bg-blue-100 hover:text-blue-700 hover:border-blue-300 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                        title={`Cari arti kata "${syn}"`}
                      >
                        {syn}
                      </button>
                  ))}
                </div>
                
                {/* TOMBOL SAVE KE DATABASE */}
                <button 
                    onClick={handleSaveToDb}
                    disabled={isSaved}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all shadow-sm w-full md:w-auto ${
                        isSaved 
                        ? 'bg-green-50 text-green-700 border border-green-200 cursor-default' 
                        : 'bg-slate-900 text-white hover:bg-black active:scale-95'
                    }`}
                >
                    {isSaved ? <Check size={18}/> : <PlusCircle size={18}/>}
                    {isSaved ? 'Tersimpan di Story Lab' : 'Simpan ke Story Lab'}
                </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-purple-300 transition-colors group">
              <div className="flex items-center gap-2 text-purple-500 mb-4">
                <Quote size={24} className="group-hover:scale-110 transition-transform"/>
                <h4 className="font-semibold text-lg text-slate-800">Konteks Penggunaan</h4>
              </div>
              <p className="text-slate-700 leading-relaxed italic bg-purple-50/50 p-4 rounded-lg border border-purple-100">
                &quot;{data.context_usage}&quot;
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors group">
              <div className="flex items-center gap-2 text-blue-600 mb-4">
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
                <button key={w} onClick={() => handleSearch(undefined, w)} className="p-4 border border-dashed border-slate-300 rounded-xl text-center text-slate-500 font-medium hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex flex-col items-center gap-2">
                    <Sparkles size={16} className="text-slate-300" />
                    {w}
                </button>
            ))}
            </div>
        </div>
      )}

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

export default Dictionary;