import React, { useState } from 'react';
import { Search, BookOpen, Quote, ArrowRight, SpellCheck } from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { VocabResult } from '../types';

const VocabBuilder: React.FC = () => {
  const [word, setWord] = useState('');
  const [data, setData] = useState<VocabResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim()) return;
    setLoading(true);
    try {
      const result = await GeminiService.explainVocab(word);
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

      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="Masukkan kata (contoh: actually, hang out)"
          className="w-full pl-12 pr-4 py-4 text-lg bg-slate-800 text-white placeholder-slate-400 border border-slate-700 rounded-xl shadow-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
        <button
          type="submit"
          disabled={loading || !word}
          className="absolute right-2 top-2 bottom-2 px-6 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Mencari...' : 'Cari'}
        </button>
      </form>

      {data && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Card */}
          <div className="bg-white border-l-4 border-brand-500 rounded-r-xl shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-4xl font-bold text-brand-900">{data.word}</h3>
              <p className="text-lg text-slate-600 mt-1">{data.meaning}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.synonyms.map((syn, i) => (
                <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded-full font-medium">
                  {syn}
                </span>
              ))}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 text-accent-500 mb-4">
                <Quote size={24} />
                <h4 className="font-semibold text-lg text-slate-800">Konteks Penggunaan</h4>
              </div>
              <p className="text-slate-700 leading-relaxed italic">"{data.context_usage}"</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 text-purple-600 mb-4">
                <SpellCheck size={24} />
                <h4 className="font-semibold text-lg text-slate-800">Nuansa & Perbedaan</h4>
              </div>
              <p className="text-slate-700 leading-relaxed">{data.nuance_comparison}</p>
            </div>
          </div>
        </div>
      )}
      
      {!data && !loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 opacity-50 mt-12">
          {['Literally', 'Even', 'Prefer', 'Just'].map(w => (
            <button 
                key={w} 
                onClick={() => { setWord(w); }}
                className="p-4 border border-dashed border-slate-300 rounded-lg text-center text-slate-500 hover:border-brand-400 hover:text-brand-500 transition-colors"
            >
                {w}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default VocabBuilder;