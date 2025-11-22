import React, { useState } from 'react';
import { ArrowRightLeft, Book, Lightbulb, Layers, RotateCcw, Copy, Check } from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { TranslationResult } from '../types';

const Translator: React.FC = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTranslate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await GeminiService.translateAndExplain(input);
      setResult(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setInput('');
    setResult(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Input Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-shadow focus-within:shadow-md">
        <div className="bg-slate-50/50 px-6 py-4 flex justify-between items-center border-b border-slate-100">
             <span className="text-xs font-bold text-slate-500 tracking-wide uppercase">Bahasa Indonesia</span>
             <div className="flex items-center gap-2">
                {(input || result) && (
                    <button 
                        onClick={handleReset}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                        title="Reset"
                    >
                        <RotateCcw size={18} />
                    </button>
                )}
                <button
                    onClick={handleTranslate}
                    disabled={loading || !input}
                    className="bg-brand-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-600 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm shadow-brand-200"
                >
                    {loading ? 'Menerjemahkan...' : (
                    <>
                        Terjemahkan <ArrowRightLeft size={18} />
                    </>
                    )}
                </button>
             </div>
        </div>
        
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleTranslate();
            }
          }}
          placeholder="Ketik kalimat yang ingin diterjemahkan..."
          className="w-full p-6 bg-white text-slate-800 placeholder-slate-300 text-xl md:text-2xl focus:outline-none resize-none min-h-[150px] font-medium"
        />
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-6 animate-pulse">
            <div className="h-48 bg-slate-200 rounded-2xl w-full"></div>
            <div className="grid md:grid-cols-2 gap-6">
                <div className="h-40 bg-slate-200 rounded-2xl w-full"></div>
                <div className="h-40 bg-slate-200 rounded-2xl w-full"></div>
            </div>
        </div>
      )}

      {/* Result Section */}
      {!loading && result && (
        <div className="space-y-6 animate-fade-in">
          {/* Main Translation Card */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-8 relative overflow-hidden group">
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-brand-600 font-semibold">
                        <Book size={22} /> 
                        <span>English Translation</span>
                    </div>
                    <button 
                        onClick={() => copyToClipboard(result.translation)}
                        className="text-brand-400 hover:text-brand-600 transition-colors"
                        title="Copy"
                    >
                        {copied ? <Check size={20} /> : <Copy size={20} />}
                    </button>
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-brand-900 leading-tight selection:bg-brand-200">
                    {result.translation}
                </h3>
            </div>
            {/* Decorative Pattern */}
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-brand-100 rounded-full opacity-50 blur-3xl pointer-events-none"></div>
          </div>

          {/* Details Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Grammar Explanation */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 text-amber-600 mb-6 pb-4 border-b border-slate-100">
                <div className="p-2 bg-amber-50 rounded-lg">
                    <Lightbulb size={24} /> 
                </div>
                <h4 className="font-bold text-lg text-slate-800">Penjelasan Grammar</h4>
              </div>
              <p className="text-slate-600 leading-relaxed text-lg">
                {result.explanation}
              </p>
            </div>

            {/* Variations */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 text-emerald-600 mb-6 pb-4 border-b border-slate-100">
                <div className="p-2 bg-emerald-50 rounded-lg">
                    <Layers size={24} /> 
                </div>
                <h4 className="font-bold text-lg text-slate-800">Variasi Kalimat</h4>
              </div>
              <ul className="space-y-4">
                {result.variations.map((variation, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-slate-700 group/item">
                    <span className="block w-2 h-2 rounded-full bg-emerald-400 mt-2.5 shrink-0 group-hover/item:bg-emerald-600 transition-colors" />
                    <span className="text-lg italic">"{variation}"</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Translator;