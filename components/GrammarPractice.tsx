import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, HelpCircle, ArrowRight, Loader2 } from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { GrammarQuestion } from '../types';

const GrammarPractice: React.FC = () => {
  const [question, setQuestion] = useState<GrammarQuestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate'>('beginner');

  const fetchQuestion = async () => {
    setLoading(true);
    setQuestion(null);
    setSelectedIdx(null);
    setShowResult(false);
    try {
      const q = await GeminiService.generateGrammarQuestion(difficulty);
      setQuestion(q);
    } catch (error) {
      console.error("Failed to fetch question", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  const handleAnswer = (index: number) => {
    if (showResult) return;
    setSelectedIdx(index);
    setShowResult(true);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Latihan Grammar</h2>
        <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
                onClick={() => setDifficulty('beginner')}
                className={`px-4 py-1 text-sm rounded-md transition-colors ${difficulty === 'beginner' ? 'bg-white shadow text-brand-600 font-medium' : 'text-slate-500'}`}
            >
                Beginner
            </button>
            <button 
                onClick={() => setDifficulty('intermediate')}
                className={`px-4 py-1 text-sm rounded-md transition-colors ${difficulty === 'intermediate' ? 'bg-white shadow text-brand-600 font-medium' : 'text-slate-500'}`}
            >
                Intermediate
            </button>
        </div>
      </div>

      {loading && (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="animate-spin mb-4" size={32} />
          <p>Sedang membuat soal baru...</p>
        </div>
      )}

      {!loading && question && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 md:p-8 border-b border-slate-100">
            <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wider rounded-full mb-4">
                Quiz
            </span>
            <h3 className="text-xl font-medium text-slate-900 leading-relaxed">
              {question.question}
            </h3>
          </div>

          <div className="p-6 md:p-8 space-y-3 bg-slate-50/50">
            {question.options.map((option, idx) => {
              let btnClass = "bg-white border-slate-200 hover:border-brand-300 hover:bg-brand-50";
              
              if (showResult) {
                if (idx === question.correctIndex) {
                  btnClass = "bg-green-100 border-green-300 text-green-800"; // Correct answer
                } else if (idx === selectedIdx && idx !== question.correctIndex) {
                  btnClass = "bg-red-100 border-red-300 text-red-800"; // Wrong selection
                } else {
                  btnClass = "bg-slate-50 border-slate-200 opacity-60"; // Others
                }
              } else if (idx === selectedIdx) {
                btnClass = "bg-brand-100 border-brand-400 text-brand-800";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={showResult}
                  className={`w-full text-left p-4 rounded-xl border flex justify-between items-center transition-all ${btnClass}`}
                >
                  <span className="font-medium">{option}</span>
                  {showResult && idx === question.correctIndex && <CheckCircle2 size={20} className="text-green-600" />}
                  {showResult && idx === selectedIdx && idx !== question.correctIndex && <XCircle size={20} className="text-red-600" />}
                </button>
              );
            })}
          </div>

          {showResult && (
            <div className="p-6 md:p-8 bg-indigo-50 border-t border-indigo-100 animate-fade-in">
              <div className="flex items-start gap-3 mb-4">
                <HelpCircle className="text-indigo-600 shrink-0 mt-1" size={24} />
                <div>
                  <h4 className="font-bold text-indigo-900 mb-1">Penjelasan</h4>
                  <p className="text-indigo-800 leading-relaxed">{question.explanation}</p>
                </div>
              </div>
              <button 
                onClick={fetchQuestion}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 flex items-center justify-center gap-2 transition-colors"
              >
                Soal Selanjutnya <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GrammarPractice;
