'use client';

import { useState, useRef, useEffect, type FC } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Lock } from 'lucide-react';
import { useTemporal, type Period } from '@/shared/contexts/TemporalContext';

const MONTH_NAMES_SHORT = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

const MONTH_NAMES_FULL = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

interface MonthYearSelectorProps {
    className?: string;
}

export const MonthYearSelector: FC<MonthYearSelectorProps> = ({ className = '' }) => {
    const { currentPeriod, selectedPeriod, setSelectedPeriod, isHistoricalMode, isFuturePeriod } = useTemporal();
    const [isOpen, setIsOpen] = useState(false);
    const [viewYear, setViewYear] = useState(selectedPeriod.year);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMonthSelect = (month: number) => {
        const period: Period = { month, year: viewYear };
        if (!isFuturePeriod(period)) {
            setSelectedPeriod(period);
            setIsOpen(false);
        }
    };

    const handlePrevYear = () => {
        setViewYear(prev => prev - 1);
    };

    const handleNextYear = () => {
        // Don't allow viewing future years beyond current
        if (viewYear < currentPeriod.year) {
            setViewYear(prev => prev + 1);
        }
    };

    const isCurrentMonth = (month: number): boolean => {
        return month === currentPeriod.month && viewYear === currentPeriod.year;
    };

    const isSelectedMonth = (month: number): boolean => {
        return month === selectedPeriod.month && viewYear === selectedPeriod.year;
    };

    const isFutureMonth = (month: number): boolean => {
        return isFuturePeriod({ month, year: viewYear });
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm transition-all ${isHistoricalMode
                        ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
            >
                <Calendar size={16} className={isHistoricalMode ? 'text-amber-500' : 'text-blue-500'} />
                <span className="text-sm font-medium">
                    {MONTH_NAMES_FULL[selectedPeriod.month]} {selectedPeriod.year}
                </span>
                {isHistoricalMode && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-amber-200 text-amber-800 rounded font-bold uppercase">
                        Riwayat
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50 w-72 animate-fade-in">
                    {/* Year Navigation */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={handlePrevYear}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span className="font-bold text-slate-800">{viewYear}</span>
                        <button
                            onClick={handleNextYear}
                            disabled={viewYear >= currentPeriod.year}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    {/* Month Grid */}
                    <div className="grid grid-cols-4 gap-2">
                        {MONTH_NAMES_SHORT.map((name, idx) => {
                            const isFuture = isFutureMonth(idx);
                            const isCurrent = isCurrentMonth(idx);
                            const isSelected = isSelectedMonth(idx);

                            return (
                                <button
                                    key={name}
                                    onClick={() => handleMonthSelect(idx)}
                                    disabled={isFuture}
                                    className={`relative px-2 py-2 rounded-lg text-xs font-medium transition-all ${isSelected
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : isCurrent
                                                ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                                                : isFuture
                                                    ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                        }`}
                                >
                                    {name}
                                    {isFuture && (
                                        <Lock size={10} className="absolute top-1 right-1 text-slate-300" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Current Period Button */}
                    {isHistoricalMode && (
                        <button
                            onClick={() => {
                                setSelectedPeriod(currentPeriod);
                                setViewYear(currentPeriod.year);
                                setIsOpen(false);
                            }}
                            className="w-full mt-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                            Kembali ke Bulan Ini
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default MonthYearSelector;
