'use client';

import { useState, useEffect, type FC } from 'react';
import {
    TrendingUp, TrendingDown, Minus, BookOpen, Zap, Calendar,
    Activity, Brain, Target, Clock, Loader2, FileQuestion
} from 'lucide-react';
import { useTemporal } from '@/shared/contexts/TemporalContext';
import { DBService } from '@/shared/services/dbService';

// --- Types ---
interface ProgressMetrics {
    wordsAdded: number;
    cardsMastered: number;
    cardsReviewed: number;
    storyAttempts: number;
    storyAvgScore: number;
    storyBestScore: number;
    tokensUsed: number;
    aiRequests: number;
    activeDays: number;
    totalSessions: number;
    mostProductiveDay: string | null;
    mostActiveHour: string | null;
}

interface ProgressData {
    current: ProgressMetrics;
    previous: ProgressMetrics | null;
    period: { month: number; year: number };
}

// --- Helper Components ---
const TrendIndicator: FC<{ current: number; previous: number | null; suffix?: string }> = ({
    current, previous, suffix = ''
}) => {
    if (previous === null) return <span className="text-xs text-slate-400">Data pertama</span>;

    const diff = current - previous;
    const percentChange = previous > 0 ? Math.round((diff / previous) * 100) : (current > 0 ? 100 : 0);

    if (diff > 0) {
        return (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <TrendingUp size={12} /> +{percentChange}%{suffix}
            </span>
        );
    } else if (diff < 0) {
        return (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                <TrendingDown size={12} /> {percentChange}%{suffix}
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            <Minus size={12} /> Stagnan
        </span>
    );
};

const MetricCard: FC<{
    icon: React.ReactNode;
    label: string;
    value: number | string;
    previous?: number | null;
    colorClass: string;
    suffix?: string;
}> = ({ icon, label, value, previous, colorClass, suffix }) => (
    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-3">
            <div className={`p-2 rounded-lg ${colorClass}`}>{icon}</div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
        </div>
        <div className="flex items-end justify-between">
            <span className="text-2xl font-bold text-slate-900">
                {typeof value === 'number' ? value.toLocaleString() : value}
                {suffix && <span className="text-sm font-normal text-slate-400 ml-1">{suffix}</span>}
            </span>
            {previous !== undefined && <TrendIndicator current={typeof value === 'number' ? value : 0} previous={previous} />}
        </div>
    </div>
);

const ComparisonRow: FC<{
    label: string;
    current: number;
    previous: number | null;
    unit?: string;
}> = ({ label, current, previous, unit = '' }) => {
    const diff = previous !== null ? current - previous : null;

    return (
        <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
            <span className="text-sm text-slate-600">{label}</span>
            <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-900">{current.toLocaleString()}{unit}</span>
                {diff !== null && (
                    <span className={`text-xs font-medium ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-600' : 'text-slate-400'}`}>
                        {diff > 0 ? '+' : ''}{diff.toLocaleString()}{unit}
                    </span>
                )}
            </div>
        </div>
    );
};

// --- Main Component ---
const ProgressTemporal: FC = () => {
    const { selectedPeriod, isHistoricalMode, formatPeriod } = useTemporal();
    const [data, setData] = useState<ProgressData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProgress = async () => {
            setLoading(true);
            setError(null);

            try {
                const result = await DBService.getProgress(selectedPeriod.month, selectedPeriod.year);
                if (!result) {
                    setError('Gagal memuat data progres');
                } else {
                    setData(result);
                }
            } catch (err) {
                console.error('Progress fetch error:', err);
                setError('Gagal memuat data progres');
            } finally {
                setLoading(false);
            }
        };

        fetchProgress();
    }, [selectedPeriod.month, selectedPeriod.year]);

    // Loading state
    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-8">
                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                    <Loader2 size={32} className="animate-spin mb-3" />
                    <p>Memuat Progress Temporal...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="bg-white rounded-2xl border border-red-200 p-8">
                <div className="flex flex-col items-center justify-center py-8 text-red-500">
                    <FileQuestion size={32} className="mb-3" />
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    // Empty state
    if (!data || (data.current.totalSessions === 0 && data.current.wordsAdded === 0)) {
        return (
            <div className={`bg-white rounded-2xl border p-8 ${isHistoricalMode ? 'border-amber-200' : 'border-slate-200'}`}>
                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                    <Calendar size={40} className="mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold text-slate-600 mb-2">Belum Ada Data</h3>
                    <p className="text-sm text-center max-w-sm">
                        {isHistoricalMode
                            ? `Tidak ada aktivitas belajar tercatat pada ${formatPeriod(selectedPeriod)}.`
                            : 'Mulai belajar untuk melihat progres Anda di sini!'}
                    </p>
                </div>
            </div>
        );
    }

    const { current, previous } = data;

    return (
        <div className={`bg-white rounded-2xl border shadow-sm p-6 space-y-6 ${isHistoricalMode ? 'border-amber-200' : 'border-slate-200'}`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Activity className={isHistoricalMode ? 'text-amber-500' : 'text-blue-600'} size={22} />
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Progress Temporal</h3>
                        <p className="text-xs text-slate-500">{formatPeriod(selectedPeriod)}</p>
                    </div>
                </div>
                {isHistoricalMode && (
                    <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full font-medium">
                        Mode Riwayat
                    </span>
                )}
            </div>

            {/* Section 1: Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                    icon={<Brain size={18} className="text-purple-600" />}
                    label="Kata Dikuasai"
                    value={current.cardsMastered}
                    previous={previous?.cardsMastered}
                    colorClass="bg-purple-100"
                />
                <MetricCard
                    icon={<Zap size={18} className="text-amber-600" />}
                    label="Token AI"
                    value={current.tokensUsed}
                    previous={previous?.tokensUsed}
                    colorClass="bg-amber-100"
                />
                <MetricCard
                    icon={<Calendar size={18} className="text-blue-600" />}
                    label="Hari Aktif"
                    value={current.activeDays}
                    previous={previous?.activeDays}
                    colorClass="bg-blue-100"
                    suffix="hari"
                />
                <MetricCard
                    icon={<Target size={18} className="text-emerald-600" />}
                    label="Total Sesi"
                    value={current.totalSessions}
                    previous={previous?.totalSessions}
                    colorClass="bg-emerald-100"
                />
            </div>

            {/* Section 2: Month-over-Month Comparison */}
            {previous && (
                <div className="bg-slate-50 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <TrendingUp size={16} /> Perbandingan dengan Bulan Sebelumnya
                    </h4>
                    <div className="space-y-1">
                        <ComparisonRow label="Kata Baru" current={current.wordsAdded} previous={previous.wordsAdded} />
                        <ComparisonRow label="Flashcard Direview" current={current.cardsReviewed} previous={previous.cardsReviewed} />
                        <ComparisonRow label="Story Attempts" current={current.storyAttempts} previous={previous.storyAttempts} />
                        <ComparisonRow label="Rata-rata Skor Story" current={current.storyAvgScore} previous={previous.storyAvgScore} />
                    </div>
                </div>
            )}

            {/* Section 3: Learning Patterns */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Clock size={16} /> Pola & Konsistensi Belajar
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3">
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Hari Aktif</p>
                        <p className="text-xl font-bold text-slate-800">{current.activeDays} <span className="text-sm font-normal">hari</span></p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3">
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Hari Paling Produktif</p>
                        <p className="text-lg font-bold text-slate-800">{current.mostProductiveDay || '-'}</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3">
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Waktu Favorit</p>
                        <p className="text-lg font-bold text-slate-800">{current.mostActiveHour || '-'}</p>
                    </div>
                </div>
            </div>

            {/* Section 4: Insight (Optional) */}
            {(current.storyBestScore > 0 || current.cardsMastered > 0) && (
                <div className="bg-slate-800 text-white rounded-xl p-4">
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <BookOpen size={16} /> Insight
                    </h4>
                    <div className="space-y-2 text-sm text-slate-300">
                        {current.cardsMastered > 0 && (
                            <p>🎯 Anda menguasai <span className="text-emerald-400 font-semibold">{current.cardsMastered}</span> kata baru bulan ini!</p>
                        )}
                        {current.storyBestScore > 0 && (
                            <p>⭐ Skor tertinggi Story Lab: <span className="text-amber-400 font-semibold">{current.storyBestScore}/10</span></p>
                        )}
                        {previous && current.activeDays > previous.activeDays && (
                            <p>📈 Konsistensi meningkat! Anda belajar <span className="text-blue-400 font-semibold">{current.activeDays - previous.activeDays}</span> hari lebih banyak dari bulan lalu.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProgressTemporal;
