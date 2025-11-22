import React, { useState } from 'react';
import { AppView } from './types';
import Layout from './components/Layout';
import ChatTutor from './components/ChatTutor';
import Translator from './components/Translator';
import VocabBuilder from './components/VocabBuilder';
import GrammarPractice from './components/GrammarPractice';
import DailyChallenge from './components/DailyChallenge';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);

  const renderView = () => {
    switch (currentView) {
      case AppView.CHAT:
        return <ChatTutor />;
      case AppView.TRANSLATE:
        return <Translator />;
      case AppView.VOCAB:
        return <VocabBuilder />;
      case AppView.GRAMMAR:
        return <GrammarPractice />;
      case AppView.CHALLENGE:
        return <DailyChallenge />;
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
    <div className="flex flex-col items-center justify-center h-full text-center space-y-8 max-w-3xl mx-auto">
      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold text-brand-900 tracking-tight">
          Belajar Bahasa Inggris <br />
          <span className="text-brand-500">Tanpa Takut Salah</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          IndoLingua.ai adalah teman belajarmu. Percakapan santai, penjelasan dalam Bahasa Indonesia, dan materi yang relevan dengan keseharianmu.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 w-full max-w-2xl">
        <div 
            onClick={() => onNavigate(AppView.CHAT)}
            className="group p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-brand-300 cursor-pointer transition-all text-left"
        >
            <div className="w-12 h-12 bg-brand-100 text-brand-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Chat dengan Tutor</h3>
            <p className="text-slate-500 text-sm mt-1">Latihan ngobrol santai atau role-play situasi tertentu.</p>
        </div>

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
      </div>
      
      <div className="flex gap-2 text-sm text-slate-400 pt-8">
        Powered by Google Gemini AI
      </div>
    </div>
  );
}

export default App;
