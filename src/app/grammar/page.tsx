'use client';

import { useState } from 'react';
import GrammarPractice from "@/features/grammar/components/GrammarPractice"; // <-- Path Baru
import GrammarChecker from "@/features/grammar/components/GrammarChecker";   // <-- Path Baru
import { CheckSquare, Sparkles } from 'lucide-react';

export default function GrammarPage() {
  const [activeTab, setActiveTab] = useState<'PRACTICE' | 'CHECKER'>('PRACTICE');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Grammar Studio</h1>
          <p className="text-slate-500">Latih kemampuan atau periksa tata bahasa Anda.</p>
        </div>
        
        <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex">
          <button
            onClick={() => setActiveTab('PRACTICE')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'PRACTICE' 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <CheckSquare size={16} /> Latihan Soal
          </button>
          <button
            onClick={() => setActiveTab('CHECKER')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'CHECKER' 
                ? 'bg-purple-600 text-white shadow-md' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Sparkles size={16} /> AI Checker
          </button>
        </div>
      </div>

      <div className="pt-4">
        {activeTab === 'PRACTICE' ? <GrammarPractice /> : <GrammarChecker />}
      </div>
    </div>
  );
}