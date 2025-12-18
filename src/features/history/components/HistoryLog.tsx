'use client';

import { useEffect, useState, useCallback, type FC } from 'react';
import { History as HistoryIcon, Server, Database, Zap, RefreshCcw, Loader2, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { DBService } from '@/shared/services/dbService';
import { HistoryItem } from '@/shared/types';

// 🔥 Helper: Get local date string (YYYY-MM-DD)
const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 🔥 Helper: Group entries by date (using LOCAL timezone)
const groupByDate = (entries: HistoryItem[]): Map<string, HistoryItem[]> => {
  const groups = new Map<string, HistoryItem[]>();

  entries.forEach(entry => {
    // Use local date, not UTC
    const dateKey = getLocalDateString(new Date(entry.timestamp));
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(entry);
  });

  return groups;
};

// 🔥 Helper: Format date to Indonesian
const formatDateIndonesian = (dateKey: string): string => {
  const date = new Date(dateKey);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

// 🔥 Component: Date Group Header
const DateGroupHeader: FC<{ dateKey: string; count: number }> = ({ dateKey, count }) => (
  <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-50 to-slate-50 px-4 py-3 border-b border-blue-100 flex items-center justify-between">
    <div className="flex items-center gap-2">
      <Calendar size={16} className="text-blue-600" />
      <span className="font-bold text-slate-800">{formatDateIndonesian(dateKey)}</span>
    </div>
    <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded-full border border-slate-200">
      {count} aktivitas
    </span>
  </div>
);

// 🔥 Component: Single History Row
const HistoryRow: FC<{ item: HistoryItem }> = ({ item }) => (
  <tr className="hover:bg-slate-50 transition-colors">
    <td className="p-4 text-center">
      <div className={`inline-flex p-2 rounded-lg ${item.source === 'API' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
        {item.source === 'API' ? <Server size={16} /> : <Database size={16} />}
      </div>
    </td>
    <td className="p-4">
      <span className="font-semibold text-slate-900 text-sm">{item.feature}</span>
    </td>
    <td className="p-4">
      <p className="text-slate-600 text-sm truncate max-w-[250px]" title={item.details}>
        {item.details}
      </p>
    </td>
    <td className="p-4">
      {item.source === 'API' && item.tokens ? (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
          <Zap size={10} className="fill-current" /> {item.tokens}
        </span>
      ) : (
        <span className="text-slate-400 text-xs">-</span>
      )}
    </td>
    <td className="p-4 text-right">
      <span className="text-slate-500 text-xs md:text-sm font-mono">
        {item.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
    </td>
  </tr>
);

// 🔥 Component: Pagination Controls
const PaginationControls: FC<{
  currentPage: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPageChange: (page: number) => void;
  disabled: boolean;
}> = ({ currentPage, totalPages, hasPrev, hasNext, onPageChange, disabled }) => {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-1">
      {/* Prev Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPrev || disabled}
        className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-sm font-medium text-slate-600"
      >
        <ChevronLeft size={16} /> Prev
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1 mx-2">
        {getPageNumbers().map((page, idx) => (
          page === '...' ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">...</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              disabled={disabled || page === currentPage}
              className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${page === currentPage
                ? 'bg-blue-600 text-white shadow-md'
                : 'border border-slate-300 hover:bg-slate-50 text-slate-600'
                } disabled:cursor-not-allowed`}
            >
              {page}
            </button>
          )
        ))}
      </div>

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNext || disabled}
        className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-sm font-medium text-slate-600"
      >
        Next <ChevronRight size={16} />
      </button>
    </div>
  );
};

// --- MAIN COMPONENT ---
const HistoryLog: FC = () => {
  const [logs, setLogs] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasPrev: false,
    hasNext: false
  });

  const fetchPage = useCallback(async (page: number, isRefresh: boolean = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await DBService.getHistory(page);
      setLogs(data.entries);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Failed to load history", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchPage(page);
    }
  };

  // Group logs by date
  const groupedLogs = groupByDate(logs);
  const sortedDateKeys = Array.from(groupedLogs.keys()).sort((a, b) => b.localeCompare(a));

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
            <div className="flex items-center gap-1 text-slate-600">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div> API
            </div>
            <div className="flex items-center gap-1 text-slate-600">
              <div className="w-3 h-3 rounded-full bg-green-500"></div> Cache
            </div>
          </div>
          <button
            onClick={() => fetchPage(pagination.currentPage, true)}
            disabled={isRefreshing}
            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all active:scale-95 border border-slate-200"
          >
            <RefreshCcw size={18} className={isRefreshing ? "animate-spin text-blue-600" : ""} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col justify-center items-center gap-3">
            <Loader2 className="animate-spin" />
            <p>Mengambil data dari server...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            Belum ada data riwayat.
          </div>
        ) : (
          <>
            {/* Loading Overlay */}
            {loading && (
              <div className="p-4 text-center bg-blue-50 border-b border-blue-100">
                <span className="inline-flex items-center gap-2 text-blue-600 text-sm font-medium">
                  <Loader2 size={14} className="animate-spin" /> Memuat halaman...
                </span>
              </div>
            )}

            {/* Date-Grouped Table */}
            {sortedDateKeys.map(dateKey => {
              const entries = groupedLogs.get(dateKey)!;
              return (
                <div key={dateKey}>
                  <DateGroupHeader dateKey={dateKey} count={entries.length} />
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
                        {entries.map(item => (
                          <HistoryRow key={item.id} item={item} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}

            {/* Pagination Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/50">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-slate-500">
                  Halaman <span className="font-semibold">{pagination.currentPage}</span> dari{' '}
                  <span className="font-semibold">{pagination.totalPages}</span>
                  {pagination.totalCount > 0 && (
                    <span className="text-slate-400 ml-2">({pagination.totalCount} aktivitas total)</span>
                  )}
                </p>
                <PaginationControls
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  hasPrev={pagination.hasPrev}
                  hasNext={pagination.hasNext}
                  onPageChange={handlePageChange}
                  disabled={loading}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HistoryLog;