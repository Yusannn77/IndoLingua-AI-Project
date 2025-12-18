'use client';

import { Trophy, Zap, Brain } from 'lucide-react';
import { MonthYearSelector } from '@/shared/components/MonthYearSelector';
import { HistoricalModeBanner } from '@/shared/components/HistoricalModeBanner';
import { useTemporal } from '@/shared/contexts/TemporalContext';
import ProgressTemporal from './ProgressTemporal';

export default function Dashboard() {
   return (
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">
         {/* Header */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
               <h2 className="text-3xl font-bold text-slate-900">Dashboard Belajar</h2>
               <p className="text-slate-500">Pantau progres dan pencapaianmu sejauh ini.</p>
            </div>
            <MonthYearSelector />
         </div>

         {/* Historical Mode Banner */}
         <HistoricalModeBanner />

         {/* Progress Temporal - Full Width */}
         <ProgressTemporal />
      </div>
   );
}