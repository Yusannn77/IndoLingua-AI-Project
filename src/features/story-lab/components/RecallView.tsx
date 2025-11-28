import { useState, useEffect, useRef, FC, FormEvent } from 'react';
import { CheckCircle2, XCircle, ArrowRight, Loader2, RotateCcw } from 'lucide-react';
import { SavedVocab } from '@/shared/types'; // <-- Path Baru
import { GeminiService } from '@/shared/services/geminiService'; // <-- Path Baru

interface RecallViewProps {
  vocabList: SavedVocab[];
  onUpdateMastery: (id: string, mastered: boolean) => void;
  onSwitchMode: (mode: 'HISTORY') => void;
}

export const RecallView: FC<RecallViewProps> = ({ vocabList, onUpdateMastery, onSwitchMode }) => {
  const [activeCard, setActiveCard] = useState<SavedVocab | null>(null);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'IDLE' | 'CHECKING' | 'CORRECT' | 'WRONG'>('IDLE');
  const [feedback, setFeedback] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const activeList = vocabList.filter(v => !v.mastered);

  const pickCard = () => {
    setInput('');
    setStatus('IDLE');
    setFeedback('');
    if (activeList.length === 0) {
      setActiveCard(null);
      return;
    }
    const random = activeList[Math.floor(Math.random() * activeList.length)];
    setActiveCard(random);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  useEffect(() => {
    pickCard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vocabList.length]);

  const checkAnswer = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeCard || !input.trim()) return;

    setStatus('CHECKING');

    try {
      const result = await GeminiService.evaluateRecall(
        activeCard.word,
        activeCard.translation,
        input
      );

      if (result.isCorrect) {
        setStatus('CORRECT');
        setFeedback(result.feedback || "Jawaban tepat!");
        
        // 🔥 UPDATE: Panggil satu fungsi saja.
        // Logic Simpan DB + Optimistic Update sudah ada di parent (useStoryLogic)
        onUpdateMastery(activeCard.id, true);
        
        setTimeout(pickCard, 2000);
      } else {
        setStatus('WRONG');
        setFeedback(result.feedback || "Kurang tepat, coba lihat jawaban di bawah.");
      }
    } catch (error) {
      console.error("AI Error:", error);
      // Fallback manual check jika AI gagal/timeout
      const simpleCheck = input.toLowerCase().trim() === activeCard.translation.toLowerCase().trim();
      if (simpleCheck) {
        setStatus('CORRECT');
        onUpdateMastery(activeCard.id, true); // 🔥 Konsisten panggil fungsi parent
        setTimeout(pickCard, 1500);
      } else {
        setStatus('WRONG');
      }
    }
  };

  if (activeList.length === 0 && !activeCard) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm animate-fade-in">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">All Caught Up!</h2>
        <p className="text-slate-500 mb-8">You have mastered all your saved words.</p>
        <button 
          onClick={() => onSwitchMode('HISTORY')} 
          className="px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-black transition-all"
        >
          View History
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto animate-slide-up">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden relative transition-all">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

        <button 
          onClick={pickCard}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
          title="Ganti Soal Lain"
        >
          <RotateCcw size={20} />
        </button>

        <div className="p-8 md:p-10">
          <div className="text-center mb-8">
            <span className="inline-block px-3 py-1 bg-slate-100 text-slate-500 text-xs font-bold uppercase tracking-widest rounded-full mb-6">
              Recall Challenge
            </span>
            <p className="text-sm text-slate-400 mb-2 font-medium">What is the meaning of:</p>
            <h2 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight mb-1">
              &quot;{activeCard?.word}&quot;
            </h2>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-8 text-center">
            <p className="text-xs text-slate-400 font-bold uppercase mb-2">Context Hint</p>
            <p className="text-slate-600 italic text-lg">
              &quot;...{activeCard?.originalSentence?.replace(new RegExp(activeCard?.word || '___', 'gi'), '_____')}...&quot;
            </p>
          </div>

          <form onSubmit={checkAnswer} className="space-y-4">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (status === 'WRONG') setStatus('IDLE');
              }}
              disabled={status === 'CORRECT' || status === 'CHECKING'}
              placeholder="Ketik arti dalam Bahasa Indonesia..."
              className={`w-full text-center text-xl p-5 border-2 rounded-2xl outline-none transition-all duration-200 font-medium
                ${status === 'WRONG' 
                  ? 'border-red-300 bg-red-50 text-red-900 placeholder-red-300' 
                  : status === 'CORRECT'
                    ? 'border-green-300 bg-green-50 text-green-900'
                    : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50'
                }`}
              autoComplete="off"
            />

            {(status === 'IDLE' || status === 'CHECKING') && (
              <button
                type="submit"
                disabled={!input.trim() || status === 'CHECKING'}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200 active:scale-95 flex items-center justify-center gap-2"
              >
                {status === 'CHECKING' ? (
                  <> <Loader2 size={20} className="animate-spin" /> Memeriksa... </>
                ) : (
                  'Cek Jawaban'
                )}
              </button>
            )}

            {status === 'CORRECT' && (
              <div className="w-full py-4 bg-green-500 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-green-200 animate-bounce-in">
                <CheckCircle2 size={24} /> {feedback || "Benar!"}
              </div>
            )}

            {status === 'WRONG' && (
              <div className="animate-shake space-y-4">
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-center">
                  <div className="flex items-center justify-center gap-2 text-red-600 font-bold mb-1">
                    <XCircle size={20} /> Kurang Tepat
                  </div>
                  <p className="text-slate-500 text-sm mb-1">{feedback}</p>
                  <p className="text-slate-500 text-xs uppercase font-bold">Jawaban tersimpan:</p>
                  <p className="text-xl font-bold text-slate-800 mt-1">{activeCard?.translation}</p>
                </div>
                
                <button
                  type="button"
                  onClick={pickCard}
                  className="w-full py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-bold text-lg hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowRight size={20} /> Lanjut Kata Berikutnya
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};