'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Sparkles, 
  CheckSquare, 
  Trophy, 
  History as HistoryIcon, 
  GraduationCap, 
  Menu, 
  X,
  Layers // Import icon Layers untuk Flashcard
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dictionary', label: 'Kamus Kontekstual', icon: BookOpen },
    
    // --- NEW MENU: FLASH CARD ---
    { href: '/flashcard', label: 'Flash Card', icon: Layers },
    
    { href: '/story', label: 'Story Lab', icon: Sparkles },
    { href: '/grammar', label: 'Latihan Grammar', icon: CheckSquare },
    { href: '/challenge', label: 'Tantangan Harian', icon: Trophy },
    { href: '/history', label: 'Riwayat Request', icon: HistoryIcon },
  ];

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b fixed top-0 left-0 right-0 z-50 h-16">
        <div className="flex items-center gap-2 text-blue-600 font-bold">
          <GraduationCap /> IndoLingua
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out 
        lg:translate-x-0 lg:static lg:h-screen
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-blue-600 text-xl font-bold">
            <GraduationCap size={28} />
            <span>IndoLingua</span>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            // Logic active state: Cek apakah pathname dimulai dengan href item
            // (kecuali dashboard '/' yang harus exact match)
            const isActive = item.href === '/' 
              ? pathname === '/' 
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium
                  ${isActive 
                    ? 'bg-indigo-50 text-indigo-700 border-r-4 border-indigo-600' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                `}
              >
                <item.icon size={20} className={isActive ? "text-indigo-600" : "text-slate-400"} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}