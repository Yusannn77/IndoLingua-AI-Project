import React, { useState } from 'react';
import { AppView } from '../types';
import { Languages, BookOpen, CheckSquare, Trophy, Menu, X, GraduationCap, History as HistoryIcon, Sparkles, LayoutDashboard } from 'lucide-react';

interface LayoutProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ currentView, onNavigate, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { view: AppView.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { view: AppView.VOCAB, label: 'Kamus Kontekstual', icon: BookOpen },
    { view: AppView.STORY_LAB, label: 'Story Lab', icon: Sparkles }, // <--- INI BARU
    { view: AppView.GRAMMAR, label: 'Latihan Grammar', icon: CheckSquare },
    { view: AppView.CHALLENGE, label: 'Tantangan Harian', icon: Trophy },
    { view: AppView.HISTORY, label: 'Riwayat Request', icon: HistoryIcon },
  ];

  const handleNav = (view: AppView) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-brand-600 cursor-pointer" onClick={() => handleNav(AppView.HOME)}>
            <GraduationCap size={28} />
            <span className="text-xl font-bold tracking-tight">IndoLingua.ai</span>
          </div>
          <button className="lg:hidden text-slate-500" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => handleNav(item.view)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium
                ${currentView === item.view 
                  ? 'bg-brand-50 text-brand-700' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
              `}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl p-4 text-white">
            <p className="text-xs font-medium text-brand-100 uppercase mb-1">Pro Tip</p>
            <p className="text-sm">Gunakan fitur Riwayat untuk memantau penggunaan kuota API.</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-16 flex items-center justify-between px-4 lg:px-8 bg-white border-b border-slate-100 lg:hidden">
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-600 p-2 -ml-2">
            <Menu size={24} />
          </button>
          <span className="font-semibold text-slate-900">
            {navItems.find(i => i.view === currentView)?.label || 'Home'}
          </span>
          <div className="w-8" />
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-4xl mx-auto h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;