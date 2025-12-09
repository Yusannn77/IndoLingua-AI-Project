'use client';

import { useState, FC, FormEvent } from 'react';
import { 
  Sparkles, AlertTriangle, CheckCircle2, ArrowRight, 
  Eraser, Copy, Check 
} from 'lucide-react';
import { GroqService } from '@/shared/services/groqService'; // <-- Path Baru
import { GrammarCheckResult } from '@/shared/types'; // <-- Path Baru

const GrammarChecker: FC = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GrammarCheckResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCheck = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setResult(null);
    setErrorMsg(null);
    setCopied(false);

    try {
      const data = await GroqService.checkGrammar(input);
      setResult(data);
    } catch (err) {
      console.error(err);
      setErrorMsg("Terjadi kesalahan saat menganalisis grammar.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result?.correctedSentence) {
      navigator.clipboard.writeText(result.correctedSentence);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 font-sans animate-fade-in">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Input Section */}
        <div className="p-6 md:p-8 bg-slate-50 border-b border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="text-purple-500" size={20}/> Grammar Check
            </h2>
            {input && (
              <button onClick={() => { setInput(''); setResult(null); }} className="text-slate-400 hover:text-red-500 transition-colors" title="Bersihkan">
                <Eraser size={18} />
              </button>
            )}
          </div>
          
          <form onSubmit={handleCheck} className="space-y-4">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tulis kalimat Bahasa Inggris di sini (misal: 'She don't like apple')..."
              className="w-full p-4 text-lg bg-white border-2 border-slate-200 rounded-2xl outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-50/50 transition-all resize-none min-h-[120px]"
              spellCheck="false"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-8 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-purple-200 active:scale-95 flex items-center gap-2"
              >
                {loading ? 'Menganalisis...' : 'Periksa Sekarang'}
              </button>
            </div>
          </form>
        </div>

        {loading && (
          <div className="p-8 space-y-4 animate-pulse bg-white">
            <div className="h-8 bg-slate-100 rounded-lg w-3/4"></div>
            <div className="h-20 bg-slate-100 rounded-xl w-full"></div>
            <div className="h-4 bg-slate-100 rounded w-1/2"></div>
          </div>
        )}

        {errorMsg && (
          <div className="p-6 text-center text-red-600 bg-red-50">
            <p>{errorMsg}</p>
          </div>
        )}

        {result && !loading && (
          <div className="bg-white">
            <div className="p-8 bg-gradient-to-br from-purple-600 to-indigo-600 text-white">
              <p className="text-purple-200 text-xs font-bold uppercase tracking-widest mb-4">Saran Perbaikan</p>
              <div className="text-2xl md:text-3xl font-medium font-serif leading-relaxed mb-6">
                &quot;{result.correctedSentence}&quot;
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium backdrop-blur-sm transition-colors"
                >
                  {copied ? <Check size={16}/> : <Copy size={16}/>}
                  {copied ? 'Disalin' : 'Salin Teks'}
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5 mb-8 flex gap-4 items-start">
                <div className="p-2 bg-white rounded-full text-purple-600 shadow-sm shrink-0">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-purple-900 mb-1">General Feedback</h4>
                  <p className="text-purple-800 leading-relaxed">{result.generalFeedback}</p>
                </div>
              </div>

              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="text-amber-500" size={20}/> 
                Detail Kesalahan ({result.errors.length})
              </h3>

              <div className="space-y-3">
                {result.errors.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 italic border-2 border-dashed border-slate-100 rounded-xl">
                    Tidak ditemukan kesalahan gramatikal mayor. Kalimat sudah cukup baik!
                  </div>
                ) : (
                  result.errors.map((err, i) => (
                    <div key={i} className="group p-5 bg-white border border-slate-200 rounded-xl hover:border-purple-300 hover:shadow-sm transition-all">
                       <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-mono text-red-600 bg-red-50 px-2 py-1 rounded text-sm line-through decoration-red-300">{err.original}</span>
                            <ArrowRight size={16} className="text-slate-300"/>
                            <span className="font-mono text-green-700 bg-green-50 px-2 py-1 rounded text-sm font-bold">{err.correction}</span>
                          </div>
                          <span className="self-start md:self-auto text-[10px] uppercase font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded border border-slate-200 tracking-wide">
                            {err.type}
                          </span>
                       </div>
                       <p className="text-slate-600 text-sm leading-relaxed border-t border-slate-50 pt-2 mt-1">
                         {err.explanation}
                       </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GrammarChecker;