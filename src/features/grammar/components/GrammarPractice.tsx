'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, HelpCircle, Loader2, Sparkles, BookOpen } from 'lucide-react';
import { GroqService } from '@/shared/services/groqService'; // <-- Path Baru
import { GrammarQuestion } from '@/shared/types'; // <-- Path Baru
import { beginnerQuestions, intermediateQuestions } from '../data/grammarQuestions'; // <-- Relative Path Baru

const GrammarPractice: React.FC = () => {
  const [question, setQuestion] = useState<GrammarQuestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate'>('beginner');
  const [source, setSource] = useState<'LOCAL' | 'AI'>('LOCAL');

  const fetchQuestion = async (forceAI: boolean = false) => {
    setLoading(true);
    setQuestion(null);
    setSelectedIdx(null);
    setShowResult(false);

    try {
      if (!forceAI) {
        // OPSI 1: AMBIL DARI DATA LOKAL
        const dataset = difficulty === 'beginner' ? beginnerQuestions : intermediateQuestions;
        const randomIdx = Math.floor(Math.random() * dataset.length);
        
        await new Promise(r => setTimeout(r, 400));
        
        setQuestion(dataset[randomIdx]);
        setSource('LOCAL');
      } else {
        // OPSI 2: GENERATE VIA AI
        const q = await GroqService.generateGrammarQuestion(difficulty);
        setQuestion(q);
        setSource('AI');
      }
    } catch (error) {
      console.error("Failed to fetch question", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestion(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  const handleAnswer = (index: number) => {
    if (showResult) return;
    setSelectedIdx(index);
    setShowResult(true);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header & Difficulty Toggle */}
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
          <p>{source === 'AI' ? 'Sedang membuat soal baru dengan AI...' : 'Mengambil soal latihan...'}</p>
        </div>
      )}

      {!loading && question && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
          <div className="p-6 md:p-8 border-b border-slate-100">
            <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full mb-4 ${source === 'AI' ? 'bg-purple-100 text-purple-600' : 'bg-indigo-50 text-indigo-600'}`}>
                {source === 'AI' ? <Sparkles size={12}/> : <BookOpen size={12}/>}
                {source === 'AI' ? 'AI Generated' : 'Bank Soal'}
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
                  btnClass = "bg-green-100 border-green-300 text-green-800";
                } else if (idx === selectedIdx && idx !== question.correctIndex) {
                  btnClass = "bg-red-100 border-red-300 text-red-800";
                } else {
                  btnClass = "bg-slate-50 border-slate-200 opacity-60";
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
            <div className="p-6 md:p-8 bg-indigo-50 border-t border-indigo-100 animate-slide-up">
              <div className="flex items-start gap-3 mb-6">
                <HelpCircle className="text-indigo-600 shrink-0 mt-1" size={24} />
                <div>
                  <h4 className="font-bold text-indigo-900 mb-1">Penjelasan</h4>
                  <p className="text-indigo-800 leading-relaxed">{question.explanation}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button 
                    onClick={() => fetchQuestion(false)}
                    className="w-full py-3 bg-white border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors"
                  >
                    <BookOpen size={18} /> Soal Latihan Lain
                  </button>
                  <button 
                    onClick={() => fetchQuestion(true)}
                    className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <Sparkles size={18} /> Buat Soal Baru AI
                  </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GrammarPractice;