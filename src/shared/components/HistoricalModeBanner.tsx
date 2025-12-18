'use client';

import { FC } from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import { useTemporal } from '@/shared/contexts/TemporalContext';

interface HistoricalModeBannerProps {
    className?: string;
}

export const HistoricalModeBanner: FC<HistoricalModeBannerProps> = ({ className = '' }) => {
    const { isHistoricalMode, selectedPeriod, resetToCurrentPeriod, formatPeriod } = useTemporal();

    if (!isHistoricalMode) return null;

    return (
        <div className={`bg-amber-50 border border-amber-200 rounded-xl p-4 ${className}`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                        <Clock size={20} className="text-amber-600" />
                    </div>
                    <div>
                        <p className="font-semibold text-amber-800">
                            Mode Riwayat — {formatPeriod(selectedPeriod)}
                        </p>
                        <p className="text-sm text-amber-600">
                            Aktivitas belajar hanya dapat dilakukan pada periode saat ini
                        </p>
                    </div>
                </div>
                <button
                    onClick={resetToCurrentPeriod}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors whitespace-nowrap"
                >
                    Kembali ke Sekarang <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );
};

export default HistoricalModeBanner;
