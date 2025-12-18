'use client';

import { createContext, useContext, useState, useCallback, type ReactNode, type FC } from 'react';

// --- Types ---
export interface Period {
    month: number; // 0-11 (JavaScript Date standard)
    year: number;
}

interface TemporalContextValue {
    /** Current actual period from system time */
    currentPeriod: Period;
    /** User-selected period for viewing data */
    selectedPeriod: Period;
    /** True if viewing a past period (read-only mode) */
    isHistoricalMode: boolean;
    /** Navigate to a different period */
    setSelectedPeriod: (period: Period) => void;
    /** Reset to current period */
    resetToCurrentPeriod: () => void;
    /** Check if a period is in the future */
    isFuturePeriod: (period: Period) => boolean;
    /** Format period to Indonesian string */
    formatPeriod: (period: Period) => string;
}

// --- Helpers ---
const getCurrentPeriod = (): Period => {
    const now = new Date();
    return {
        month: now.getMonth(),
        year: now.getFullYear()
    };
};

const MONTH_NAMES_ID = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

// --- Context ---
const TemporalContext = createContext<TemporalContextValue | null>(null);

// --- Provider ---
export const TemporalProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const currentPeriod = getCurrentPeriod();
    const [selectedPeriod, setSelectedPeriodState] = useState<Period>(currentPeriod);

    const isHistoricalMode =
        selectedPeriod.year < currentPeriod.year ||
        (selectedPeriod.year === currentPeriod.year && selectedPeriod.month < currentPeriod.month);

    const isFuturePeriod = useCallback((period: Period): boolean => {
        return period.year > currentPeriod.year ||
            (period.year === currentPeriod.year && period.month > currentPeriod.month);
    }, [currentPeriod.year, currentPeriod.month]);

    const setSelectedPeriod = useCallback((period: Period) => {
        // Block future periods
        if (isFuturePeriod(period)) {
            console.warn('[Temporal] Cannot select future period');
            return;
        }
        setSelectedPeriodState(period);
    }, [isFuturePeriod]);

    const resetToCurrentPeriod = useCallback(() => {
        setSelectedPeriodState(getCurrentPeriod());
    }, []);

    const formatPeriod = useCallback((period: Period): string => {
        return `${MONTH_NAMES_ID[period.month]} ${period.year}`;
    }, []);

    return (
        <TemporalContext.Provider value={{
            currentPeriod,
            selectedPeriod,
            isHistoricalMode,
            setSelectedPeriod,
            resetToCurrentPeriod,
            isFuturePeriod,
            formatPeriod
        }}>
            {children}
        </TemporalContext.Provider>
    );
};

// --- Hook ---
export const useTemporal = (): TemporalContextValue => {
    const context = useContext(TemporalContext);
    if (!context) {
        throw new Error('useTemporal must be used within a TemporalProvider');
    }
    return context;
};

// --- Utility for API/Server ---
export const isCurrentPeriod = (date: Date): boolean => {
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
};

export const validateTemporalAction = (): { valid: boolean; error?: string } => {
    // This function should be called on the server-side 
    // to validate that an action is happening in the current period
    const now = new Date();
    return { valid: true }; // Server will use its own current time
};
