import React, { useState } from 'react';
import { ArrowRightLeft, Book, Lightbulb, Layers, RotateCcw } from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { TranslationResult } from '../types';

const Translator: React.FC = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTranslate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await GeminiService.translateAndExplain(input);
      setResult(data);
    } catch (error) {
      console.error(error);
      // Fallback error handling handled by UI
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setInput('');
    setResult(null);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Input Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
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
          placeholder="Ketik kalimat yang ingin diterjemahkan..."
          className="w-full p-6 bg-white text-slate-800 placeholder-slate-300 text-xl md:text-2xl focus:outline-none resize-none min-h-[150px] font-medium"
        />
      </div>

      {/* Result Section */}
      {result && (
        <div className="space-y-6 animate-fade-in">
          {/* Main Translation Card */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-8 relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex items-center gap-2 text-brand-600 mb-4 font-semibold">
                    <Book size={22} /> 
                    <span>Translation</span>
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-brand-900 leading-tight">
                    {result.translation}
                </h3>
            </div>
            {/* Decorative placeholder box from screenshot */}
            <div className="hidden md:block absolute right-8 top-1/2 -translate-y-1/2 w-32 h-24 border-2 border-brand-200/30 rounded-xl"></div>
          </div>

          {/* Details Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Grammar Explanation */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-3 text-amber-600 mb-6 pb-4 border-b border-slate-100">
                <Lightbulb size={24} /> 
                <h4 className="font-bold text-lg text-slate-800">Penjelasan Grammar</h4>
              </div>
              <p className="text-slate-600 leading-relaxed text-lg">
                {result.explanation}
              </p>
            </div>

            {/* Variations */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-3 text-emerald-600 mb-6 pb-4 border-b border-slate-100">
                <Layers size={24} /> 
                <h4 className="font-bold text-lg text-slate-800">Variasi Kalimat</h4>
              </div>
              <ul className="space-y-4">
                {result.variations.map((variation, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-slate-700">
                    <span className="block w-2 h-2 rounded-full bg-emerald-400 mt-2.5 shrink-0" />
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