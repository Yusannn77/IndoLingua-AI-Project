import React, { useEffect, useState } from 'react';
import { History as HistoryIcon, Server, Database, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { HistoryItem } from '../types';

const ITEMS_PER_PAGE = 8;

const HistoryLog: React.FC = () => {
  const [logs, setLogs] = useState<HistoryItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    // Load data awal
    const allLogs = GeminiService.getHistory();
    // Kita balik urutannya di UI agar yang terbaru ada di paling atas (tabel biasanya begitu)
    setLogs([...allLogs].reverse());

    // Realtime update (opsional)
    const interval = setInterval(() => {
        setLogs([...GeminiService.getHistory()].reverse()); 
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // --- Logic Pagination ---
  const totalPages = Math.ceil(logs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentLogs = logs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePrev = () => setCurrentPage(p => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage(p => Math.min(totalPages, p + 1));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <HistoryIcon className="text-brand-600" /> Riwayat Request
                </h2>
                <p className="text-slate-500 text-sm mt-1">Memantau penggunaan token API & efisiensi cache.</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-slate-600">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div> API
                </div>
                <div className="flex items-center gap-1 text-slate-600">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div> Cache
                </div>
            </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 tracking-wider">
                            <th className="p-4 font-semibold w-16 text-center">Source</th>
                            <th className="p-4 font-semibold">Fitur</th>
                            <th className="p-4 font-semibold">Detail Aktivitas</th>
                            <th className="p-4 font-semibold w-32">Token Used</th>
                            <th className="p-4 font-semibold w-40 text-right">Waktu</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {currentLogs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-500">
                                    Belum ada data riwayat.
                                </td>
                            </tr>
                        ) : (
                            currentLogs.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                    {/* Source Icon */}
                                    <td className="p-4 text-center">
                                        <div className={`inline-flex p-2 rounded-lg ${
                                            item.source === 'API' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'
                                        }`}>
                                            {item.source === 'API' ? <Server size={16} /> : <Database size={16} />}
                                        </div>
                                    </td>
                                    
                                    {/* Fitur */}
                                    <td className="p-4">
                                        <span className="font-semibold text-slate-900 text-sm">{item.feature}</span>
                                    </td>

                                    {/* Detail */}
                                    <td className="p-4">
                                        <p className="text-slate-600 text-sm truncate max-w-[250px]" title={item.details}>
                                            {item.details}
                                        </p>
                                    </td>

                                    {/* Token Badge */}
                                    <td className="p-4">
                                        {item.source === 'API' && item.tokens ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                                <Zap size={10} className="fill-current" /> {item.tokens}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 text-xs">-</span>
                                        )}
                                    </td>

                                    {/* Waktu */}
                                    <td className="p-4 text-right">
                                        <span className="text-slate-500 text-sm tabular-nums">
                                            {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            {logs.length > 0 && (
                <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
                    <p className="text-sm text-slate-500">
                        Menampilkan <span className="font-medium text-slate-900">{startIndex + 1}</span> - <span className="font-medium text-slate-900">{Math.min(startIndex + ITEMS_PER_PAGE, logs.length)}</span> dari {logs.length} data
                    </p>
                    
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handlePrev}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-sm font-medium text-slate-700 px-2">
                            Halaman {currentPage} / {totalPages || 1}
                        </span>
                        <button 
                            onClick={handleNext}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default HistoryLog;