import React, { useState } from 'react';
import { Search, Quote, SpellCheck, Sparkles } from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { VocabResult } from '../types';

const VocabBuilder: React.FC = () => {
  const [word, setWord] = useState('');
  const [data, setData] = useState<VocabResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e?: React.FormEvent, keyword?: string) => {
    if (e) e.preventDefault();
    const target = keyword || word;
    if (!target.trim()) return;
    
    // Jika klik saran kata, update input juga
    if (keyword) setWord(keyword);

    setLoading(true);
    setData(null); // Reset data lama agar skeleton muncul
    try {
      const result = await GeminiService.explainVocab(target);
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Kamus Kontekstual</h2>
        <p className="text-slate-600 mt-2">Pahami kata bahasa Inggris lebih dalam dengan konteks Indonesia.</p>
      </div>

      <form onSubmit={handleSearch} className="relative z-10">
        <input
          type="text"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="Masukkan kata (contoh: actually, hang out)"
          className="w-full pl-12 pr-4 py-4 text-lg bg-white text-slate-900 placeholder-slate-400 border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-brand-100 focus:border-brand-500 outline-none transition-all"
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

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-6 animate-pulse">
            {/* Header Skeleton */}
            <div className="bg-white border-l-4 border-slate-200 rounded-r-xl p-6 flex flex-col gap-3">
                <div className="h-10 bg-slate-200 rounded w-1/3"></div>
                <div className="h-6 bg-slate-200 rounded w-2/3"></div>
                <div className="flex gap-2 mt-2">
                    <div className="h-6 w-16 bg-slate-200 rounded-full"></div>
                    <div className="h-6 w-16 bg-slate-200 rounded-full"></div>
                </div>
            </div>
            {/* Content Skeleton */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="h-40 bg-slate-200 rounded-xl"></div>
                <div className="h-40 bg-slate-200 rounded-xl"></div>
            </div>
        </div>
      )}

      {/* Result Data */}
      {!loading && data && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Card */}
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

          {/* Details Grid */}
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
      
      {/* Empty State / Suggestions */}
      {!data && !loading && (
        <div className="mt-12">
            <p className="text-center text-slate-400 text-sm mb-4">Coba kata-kata populer ini:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 opacity-70 hover:opacity-100 transition-opacity">
            {['Literally', 'Lowkey', 'Overwhelmed', 'Figure out'].map(w => (
                <button 
                    key={w} 
                    onClick={() => handleSearch(undefined, w)}
                    className="p-4 border border-dashed border-slate-300 rounded-xl text-center text-slate-500 font-medium hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50 transition-all flex flex-col items-center gap-2"
                >
                    <Sparkles size={16} className="text-slate-300" />
                    {w}
                </button>
            ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default VocabBuilder;