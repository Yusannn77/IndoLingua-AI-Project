/**
 * Temporal Validator
 * Utility functions for validating temporal actions (server-side)
 */

export interface TemporalValidation {
    valid: boolean;
    error?: string;
    currentPeriod: { month: number; year: number };
}

/**
 * Check if a date is within the current period (month & year)
 */
export function isCurrentPeriod(date: Date): boolean {
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

/**
 * Get current period from server time
 */
export function getCurrentPeriod(): { month: number; year: number } {
    const now = new Date();
    return {
        month: now.getMonth(),
        year: now.getFullYear()
    };
}

/**
 * Validate that an action is happening in the current period
 * Use this in API routes before processing learning activities
 */
export function validateTemporalAction(): TemporalValidation {
    const currentPeriod = getCurrentPeriod();
    return {
        valid: true,
        currentPeriod
    };
}

/**
 * Reject helper for temporal validation errors
 */
export function createTemporalError(attemptedPeriod: { month: number; year: number }): TemporalValidation {
    const currentPeriod = getCurrentPeriod();
    return {
        valid: false,
        error: `Aktivitas belajar hanya dapat dilakukan pada periode saat ini (${getMonthName(currentPeriod.month)} ${currentPeriod.year}). Anda mencoba mengakses ${getMonthName(attemptedPeriod.month)} ${attemptedPeriod.year}.`,
        currentPeriod
    };
}

/**
 * Check if requested period matches current period
 */
export function isPeriodCurrent(month: number, year: number): boolean {
    const current = getCurrentPeriod();
    return month === current.month && year === current.year;
}

const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function getMonthName(month: number): string {
    return MONTH_NAMES[month] || 'Unknown';
}
