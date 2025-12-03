'use client';

import { useState, useRef, useEffect } from 'react';
import { useFlashcards } from '../hooks/useFlashcards';
import { FlashcardItem } from './flashcardItem';
import { Loader2, Trophy, Layers, CheckCircle2, XCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { GeminiService } from '@/shared/services/geminiService';

interface FlashcardSessionProps {
  mode?: 'ALL' | 'REVIEW_ONLY';
  onExit?: () => void;
}

export const FlashcardSession = ({ mode = 'REVIEW_ONLY', onExit }: FlashcardSessionProps) => {
  const { cards, isLoading, submitReview, refresh, shuffleCards } = useFlashcards(mode);
  const [sessionCount, setSessionCount] = useState(0);
  
  // -- GAME STATE --
  const [userInput, setUserInput] = useState('');
  const [checkStatus, setCheckStatus] = useState<'IDLE' | 'CHECKING' | 'RESULT'>('IDLE');
  const [aiFeedback, setAiFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  
  const currentCard = cards[0];

  useEffect(() => {
    if (checkStatus === 'IDLE' && currentCard) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [currentCard, checkStatus]);

  const handleCheckAnswer = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userInput.trim() || !currentCard) return;

    setCheckStatus('CHECKING');

    try {
      const result = await GeminiService.evaluateRecall(
        currentCard.dictionaryEntry?.word || "",
        currentCard.dictionaryEntry?.meaning || "",
        userInput
      );

      setAiFeedback({
        isCorrect: result.isCorrect,
        message: result.feedback
      });

      setCheckStatus('RESULT');
    } catch (error) {
      console.error("AI Error:", error);
      alert("Gagal menghubungi AI. Coba lagi.");
      setCheckStatus('IDLE');
    }
  };

  const handleNextCard = async () => {
    if (!currentCard || !aiFeedback) return;
    await submitReview(currentCard.id, aiFeedback.isCorrect);
    
    setUserInput('');
    setAiFeedback(null);
    setCheckStatus('IDLE');
    setSessionCount(prev => prev + 1);
  };

  // --- FITUR SHUFFLE (Tanpa Confirm Alert) ---
  const handleShuffle = () => {
    // Langsung acak kartu
    shuffleCards();
    
    // Reset input user agar bersih (UX lebih baik)
    setUserInput('');
    setCheckStatus('IDLE');
    setAiFeedback(null);
  };

  // --- STATE 1: LOADING ---
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="relative">
           <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
           <div className="absolute inset-0 flex items-center justify-center">
             <Layers size={20} className="text-indigo-600/50" />
           </div>
        </div>
        <p className="text-slate-400 font-medium animate-pulse">Menyiapkan ujian...</p>
      </div>
    );
  }

  // --- STATE 2: SELESAI ---
  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] text-center animate-fade-in p-8 bg-white rounded-3xl border-2 border-dashed border-slate-200">
        <div className="w-24 h-24 bg-yellow-50 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <Trophy size={48} className="text-yellow-500 drop-shadow-sm" />
        </div>
        <h2 className="text-3xl font-black text-slate-800 mb-2">Sesi Selesai!</h2>
        <p className="text-slate-500 mb-8 max-w-xs leading-relaxed">
          Luar biasa! Kamu telah menyelesaikan semua kartu untuk sesi ini.
        </p>
        
        <div className="flex gap-3 w-full max-w-xs">
          <button 
            onClick={() => refresh()} 
            className="flex-1 py-3 px-6 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all active:scale-95"
          >
            Ulangi
          </button>
          {onExit && (
            <button 
              onClick={onExit} 
              className="flex-1 py-3 px-6 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
            >
              Selesai
            </button>
          )}
        </div>
      </div>
    );
  }

  // --- STATE 3: GAMEPLAY ---
  return (
    <div className="relative w-full max-w-md mx-auto pb-20">
      
      {/* Header Progress & Controls */}
      <div className="flex justify-between items-center mb-6 px-2">
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-2">
             <span className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center justify-center border border-indigo-100">{cards.length}</span>
             <span className="text-xs font-bold text-slate-400 uppercase hidden sm:inline">Sisa Soal</span>
           </div>
           
           {/* TOMBOL SHUFFLE (Updated Icon & No Alert) */}
           <button 
             onClick={handleShuffle}
             disabled={checkStatus !== 'IDLE'}
             className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
             title="Acak Kartu"
           >
             {/* Icon RefreshCw (Panah Melingkar) */}
             <RefreshCw size={16} />
           </button>
        </div>
        
        {sessionCount > 0 && (
           <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 animate-bounce-in">
             {sessionCount} Selesai
           </div>
        )}
      </div>

      {/* The Card */}
      <div className="relative z-10 mb-8">
         <FlashcardItem 
           key={currentCard.id}
           card={currentCard} 
           mode="QUIZ" 
           isFlipped={checkStatus === 'RESULT'} 
         />
      </div>

      {/* Interaction Area */}
      <div className="relative z-20">
        {/* FORM INPUT */}
        {checkStatus !== 'RESULT' && (
          <form onSubmit={handleCheckAnswer} className="animate-slide-up">
            <div className="relative group">
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                disabled={checkStatus === 'CHECKING'}
                placeholder="Ketik arti dalam Bahasa Indonesia..."
                className="w-full p-4 pr-14 rounded-2xl border-2 border-slate-200 text-lg outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all shadow-sm placeholder:text-slate-300 disabled:bg-slate-50"
                autoComplete="off"
              />
              <button 
                type="submit"
                disabled={!userInput.trim() || checkStatus === 'CHECKING'}
                className="absolute right-2 top-2 bottom-2 aspect-square bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-md shadow-indigo-200"
              >
                {checkStatus === 'CHECKING' ? <Loader2 className="animate-spin" size={20}/> : <ArrowRight size={20}/>}
              </button>
            </div>
            <p className="text-center text-xs text-slate-400 mt-3 font-medium tracking-wide">Tekan Enter untuk periksa</p>
          </form>
        )}

        {/* FEEDBACK RESULT */}
        {checkStatus === 'RESULT' && aiFeedback && (
          <div className={`p-6 rounded-3xl border-2 animate-bounce-in shadow-xl ${aiFeedback.isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
            <div className="flex items-start gap-4">
               <div className={`p-3 rounded-full shrink-0 ${aiFeedback.isCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                 {aiFeedback.isCorrect ? <CheckCircle2 size={28}/> : <XCircle size={28}/>}
               </div>
               <div className="flex-1">
                 <h4 className={`font-black text-lg mb-1 ${aiFeedback.isCorrect ? 'text-emerald-800' : 'text-rose-800'}`}>
                   {aiFeedback.isCorrect ? 'Benar!' : 'Kurang Tepat'}
                 </h4>
                 <p className={`text-sm leading-relaxed ${aiFeedback.isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                   {aiFeedback.message}
                 </p>
               </div>
            </div>

            <button 
              onClick={handleNextCard}
              className="w-full mt-6 py-4 bg-white border-2 border-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
            >
              Lanjut Kartu Berikutnya <ArrowRight size={18} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};