import React, { useState } from 'react';
import { AppView } from './types';
import Layout from './components/Layout';
// ChatTutor import dihapus
import Translator from './components/Translator';
import VocabBuilder from './components/VocabBuilder';
import GrammarPractice from './components/GrammarPractice';
import DailyChallenge from './components/DailyChallenge';
import HistoryLog from './components/HistoryLog';
import StoryLab from './components/StoryLab'; // <--- IMPORT BARU

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);

  const renderView = () => {
    switch (currentView) {
      // Case CHAT dihapus
      case AppView.TRANSLATE:
        return <Translator />;
      case AppView.VOCAB:
        return <VocabBuilder />;
      case AppView.GRAMMAR:
        return <GrammarPractice />;
      case AppView.CHALLENGE:
        return <DailyChallenge />;
      case AppView.HISTORY:
        return <HistoryLog />;
      case AppView.STORY_LAB: // <--- CASE BARU
        return <StoryLab />;
      case AppView.HOME:
      default:
        return <HomeView onNavigate={setCurrentView} />;
    }
  };

  return (
    <Layout currentView={currentView} onNavigate={setCurrentView}>
      {renderView()}
    </Layout>
  );
};

const HomeView: React.FC<{ onNavigate: (view: AppView) => void }> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-8 max-w-5xl mx-auto animate-fade-in">
      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold text-brand-900 tracking-tight">
          Belajar Bahasa Inggris <br />
          <span className="text-brand-500">Tanpa Takut Salah</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          IndoLingua.ai adalah teman belajarmu. Fokus pada latihan Grammar, Vocabulary, dan percakapan sehari-hari yang relevan.
        </p>
      </div>

      {/* Grid Card Menu Utama */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 w-full px-4">
        {/* Card 1: Translator */}
        <div 
            onClick={() => onNavigate(AppView.TRANSLATE)}
            className="group p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-accent-300 cursor-pointer transition-all text-left"
        >
            <div className="w-12 h-12 bg-accent-100 text-accent-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Terjemah & Paham</h3>
            <p className="text-slate-500 text-sm mt-1">Bukan sekadar translate, tapi paham 'kenapa' grammar-nya begitu.</p>
        </div>

        {/* Card 2: Story Lab (BARU) */}
        <div 
            onClick={() => onNavigate(AppView.STORY_LAB)}
            className="group p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-purple-300 cursor-pointer transition-all text-left"
        >
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Story Lab</h3>
            <p className="text-slate-500 text-sm mt-1">Belajar dari novel & anime. Simpan kata, lalu tes hafalanmu.</p>
        </div>

        {/* Card 3: Daily Challenge */}
        <div 
            onClick={() => onNavigate(AppView.CHALLENGE)}
            className="group p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-brand-300 cursor-pointer transition-all text-left"
        >
            <div className="w-12 h-12 bg-brand-100 text-brand-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Tantangan Harian</h3>
            <p className="text-slate-500 text-sm mt-1">Asah skill percakapanmu dengan skenario dunia nyata.</p>
        </div>
      </div>
      
      <div className="flex gap-2 text-sm text-slate-400 pt-8">
        Powered by Google Gemini AI
      </div>
    </div>
  );
}

export default App;