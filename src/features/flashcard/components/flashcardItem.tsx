import { useState, FC } from 'react';
import { Flashcard } from '@/shared/types';
import { Volume2, BookOpen, Sparkles } from 'lucide-react';

interface FlashcardItemProps {
  card: Flashcard;
  mode?: 'VIEW' | 'QUIZ';
  isFlipped?: boolean; 
  onFlip?: () => void;
  className?: string;
}

export const FlashcardItem: FC<FlashcardItemProps> = ({ 
  card, 
  mode = 'VIEW', 
  isFlipped: controlledFlipped, 
  onFlip,
  className = "h-[420px]" 
}) => {
  const [internalFlipped, setInternalFlipped] = useState(false);

  const isFlipped = mode === 'QUIZ' ? (controlledFlipped ?? false) : internalFlipped;

  const handleClick = () => {
    if (mode === 'VIEW') {
      setInternalFlipped(!internalFlipped);
      if (onFlip) onFlip();
    }
  };

  const renderContextSentence = () => {
    if (!card.sourceContext) return null;
    const word = card.dictionaryEntry?.word || "";
    const parts = card.sourceContext.split(new RegExp(`(${word})`, 'gi'));

    return (
      <p className="text-lg md:text-xl font-serif text-slate-700 leading-relaxed text-center">
        &quot;
        {parts.map((part, i) => 
          part.toLowerCase() === word.toLowerCase() ? (
            <span key={i} className="bg-indigo-100 text-indigo-800 font-bold px-2 rounded-md mx-1 border-b-2 border-indigo-300 shadow-sm">
              {isFlipped ? word : "..."}
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
        &quot;
      </p>
    );
  };

  return (
    <div className={`group perspective-1000 w-full ${className}`}>
      <div 
        className={`relative w-full h-full transition-all duration-700 ease-out-back transform-style-3d shadow-md hover:shadow-xl rounded-3xl ${isFlipped ? 'rotate-y-180' : ''}`}
        onClick={handleClick}
      >
        
        {/* === FRONT SIDE (SOAL) === */}
        <div className={`absolute inset-0 backface-hidden bg-white rounded-3xl p-6 flex flex-col justify-between border border-slate-200 overflow-hidden ${mode === 'VIEW' ? 'cursor-pointer hover:border-indigo-300' : ''}`}>
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
          
          <div className="flex justify-between items-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
            {/* HAPUS BADGE LEVEL ROMAWI DI SINI */}
            <span>{card.sourceType === 'STORY' ? 'Context Challenge' : 'Word Recall'}</span>
            <span className="flex items-center gap-1"><Sparkles size={10} /> {mode === 'QUIZ' ? 'Ujian' : 'Hafalan'}</span>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center my-4">
            {card.sourceType === 'STORY' && card.sourceContext ? (
              renderContextSentence()
            ) : (
              <h2 className="text-3xl font-black text-slate-800 tracking-tight text-center">
                {card.dictionaryEntry?.word}
              </h2>
            )}
            
            {mode === 'VIEW' && (
              <p className="text-xs text-slate-300 mt-4 animate-pulse text-center w-full">(Klik balik)</p>
            )}
          </div>
        </div>

        {/* === BACK SIDE (JAWABAN) === */}
        <div className={`absolute inset-0 backface-hidden rotate-y-180 bg-indigo-50 rounded-3xl p-6 flex flex-col border border-indigo-200 overflow-hidden ${mode === 'VIEW' ? 'cursor-pointer' : ''}`}>
          <div className="flex justify-between items-start border-b border-indigo-200 pb-3 mb-3">
            <div>
              <h3 className="text-2xl font-black text-indigo-900 truncate max-w-[180px]" title={card.dictionaryEntry?.word}>{card.dictionaryEntry?.word}</h3>
              {card.dictionaryEntry?.category && (
                 <span className="inline-block mt-1 px-2 py-0.5 bg-white text-indigo-600 text-[9px] font-bold rounded uppercase border border-indigo-100">
                   {card.dictionaryEntry.category}
                 </span>
              )}
            </div>
            <button className="p-1.5 bg-white rounded-full text-indigo-400 hover:text-indigo-600 shadow-sm transition-colors">
              <Volume2 size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
             <div>
               <p className="text-[10px] font-bold text-indigo-400 uppercase mb-0.5">Meaning</p>
               <p className="text-base font-medium text-slate-700 leading-snug">
                 {card.dictionaryEntry?.meaning}
               </p>
             </div>

             {card.dictionaryEntry?.nuanceComparison && card.dictionaryEntry.nuanceComparison !== '-' && (
               <div className="bg-white p-3 rounded-xl border border-indigo-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><BookOpen size={10}/> Nuance</p>
                  <p className="text-xs text-slate-600 italic leading-relaxed">
                    {card.dictionaryEntry.nuanceComparison}
                  </p>
               </div>
             )}
          </div>
        </div>

      </div>
    </div>
  );
};