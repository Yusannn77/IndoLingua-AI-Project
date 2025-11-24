'use client';

import { useEffect, useState, useCallback, type FC } from 'react';
import { History as HistoryIcon, Server, Database, ChevronLeft, ChevronRight, Zap, RefreshCcw } from 'lucide-react';
import { DBService } from '@/services/dbService';
import { HistoryItem } from '@/types';

const ITEMS_PER_PAGE = 8;

const HistoryLog: FC = () => {
  const [logs, setLogs] = useState<HistoryItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 1. Pindahkan logic fetch keluar useEffect agar bisa dipanggil ulang
  const fetchLogs = useCallback(async () => {
    // Jika dipanggil manual (via tombol), set loading state kecil
    if (logs.length > 0) setIsRefreshing(true);
    else setLoading(true);

    try {
      const data = await DBService.getHistory();
      setLogs(data);
    } catch (error) {
      console.error("Failed to load history", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [logs.length]);

  // 2. Panggil sekali saja saat mount (Hapus setInterval)
  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = Math.ceil(logs.length / ITEMS_PER_PAGE);
  const currentLogs = logs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <HistoryIcon className="text-blue-600" /> Riwayat Request
                </h2>
                <p className="text-slate-500 text-sm mt-1">Pantau penggunaan token AI & aktivitas Database.</p>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-4 text-sm mr-4">
                    <div className="flex items-center gap-1 text-slate-600"><div className="w-3 h-3 rounded-full bg-amber-500"></div> API</div>
                    <div className="flex items-center gap-1 text-slate-600"><div className="w-3 h-3 rounded-full bg-green-500"></div> Cache</div>
                </div>
                
                {/* TOMBOL REFRESH MANUAL */}
                <button 
                  onClick={fetchLogs} 
                  disabled={isRefreshing}
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all active:scale-95 border border-slate-200"
                  title="Refresh Data"
                >
                  <RefreshCcw size={18} className={isRefreshing ? "animate-spin text-blue-600" : ""} />
                </button>
            </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {loading && logs.length === 0 ? (
               <div className="p-12 text-center text-slate-400 flex flex-col justify-center items-center gap-3">
                 <Loader2 className="animate-spin" />
                 <p>Mengambil data dari server...</p>
               </div>
            ) : (
              <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                      <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 tracking-wider">
                              <th className="p-4 font-semibold w-16 text-center">Source</th>
                              <th className="p-4 font-semibold">Fitur</th>
                              <th className="p-4 font-semibold">Detail Aktivitas</th>
                              <th className="p-4 font-semibold w-32">Token Used</th>
                              <th className="p-4 font-semibold w-48 text-right">Waktu</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {currentLogs.length === 0 ? (
                              <tr><td colSpan={5} className="p-8 text-center text-slate-500">Belum ada data riwayat.</td></tr>
                          ) : (
                              currentLogs.map((item) => (
                                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                      <td className="p-4 text-center">
                                          <div className={`inline-flex p-2 rounded-lg ${item.source === 'API' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                                              {item.source === 'API' ? <Server size={16} /> : <Database size={16} />}
                                          </div>
                                      </td>
                                      <td className="p-4"><span className="font-semibold text-slate-900 text-sm">{item.feature}</span></td>
                                      <td className="p-4"><p className="text-slate-600 text-sm truncate max-w-[250px]" title={item.details}>{item.details}</p></td>
                                      <td className="p-4">
                                          {item.source === 'API' && item.tokens ? (
                                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                                  <Zap size={10} className="fill-current" /> {item.tokens}
                                              </span>
                                          ) : <span className="text-slate-400 text-xs">-</span>}
                                      </td>
                                      <td className="p-4 text-right">
                                          <span className="text-slate-500 text-xs md:text-sm font-mono">
                                              {new Date(item.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                          </span>
                                      </td>
                                  </tr>
                              ))
                          )}
                      </tbody>
                  </table>
              </div>
            )}

            {!loading && logs.length > 0 && (
                <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
                    <p className="text-sm text-slate-500">
                        <span className="font-medium">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> - <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, logs.length)}</span> dari {logs.length}
                    </p>
                    <div className="flex gap-2">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg border border-slate-300 hover:bg-white disabled:opacity-50"><ChevronLeft size={16} /></button>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-slate-300 hover:bg-white disabled:opacity-50"><ChevronRight size={16} /></button>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

// Helper component for loading state (supaya tidak perlu import Loader2 dari lucide kalau belum ada)
const Loader2 = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export default HistoryLog;