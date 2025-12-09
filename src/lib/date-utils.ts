import {
    getISOWeek,
    getISOWeekYear,
    format,
    parseISO,
    setISOWeekYear,
    startOfISOWeek
} from 'date-fns';
import { Period } from '@prisma/client';

/**
 * Returns the current date in ISO format YYYY-MM-DD
 */
export function getIsoDate(date: Date = new Date()): string {
    return format(date, 'yyyy-MM-dd');
}

/**
 * Returns the ISO week number and year.
 * Format: YYYY-Www (e.g., 2023-W43)
 * Uses ISO Week-Numbering Year to match the week.
 */
export function getIsoWeek(date: Date = new Date()): string {
    const week = getISOWeek(date);
    const year = getISOWeekYear(date);
    return `${year}-W${week.toString().padStart(2, '0')}`;
}

/**
 * Returns the current month key.
 * Format: YYYY-MM (e.g., 2023-10)
 */
export function getMonthKey(date: Date = new Date()): string {
    return format(date, 'yyyy-MM');
}

/**
 * Returns the current year key.
 * Format: YYYY (e.g., 2023)
 * Uses ISO Week Year to keep consistency with weekly stats
 */
export function getYearKey(date: Date = new Date()): string {
    return getISOWeekYear(date).toString();
}

/**
 * Helper to get all period keys for a specific date
 */
export function getPeriodKeys(date: Date = new Date()) {
    return {
        daily: getIsoDate(date),
        weekly: getIsoWeek(date),
        monthly: getMonthKey(date),
        yearly: getYearKey(date),
    };
}

/**
 * Helper to parse a Period Key back to a Date object (start of that period)
 * Used by the Sync Worker.
 */
export function parsePeriodKey(period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'ALL_TIME' | Period, key: string): Date {
    const now = new Date();

    try {
        switch (period) {
            case 'DAILY':
                // Key: YYYY-MM-DD
                return parseISO(key);

            case 'WEEKLY':
                // Key: YYYY-Www
                const [yearStr, weekStr] = key.split('-W');
                const year = parseInt(yearStr);
                const week = parseInt(weekStr);

                // Calculate start of ISO week
                const d = new Date(Date.UTC(year, 0, 4));
                const dayNum = d.getUTCDay() || 7;
                d.setUTCDate(d.getUTCDate() + 4 - dayNum);
                const targetThursday = new Date(d.getTime() + (week - 1) * 7 * 86400000);
                targetThursday.setUTCDate(targetThursday.getUTCDate() - 3);
                return targetThursday;

            case 'MONTHLY':
                // Key: YYYY-MM
                return parseISO(`${key}-01`);

            case 'YEARLY':
                // Key: YYYY
                return parseISO(`${key}-01-01`);

            case 'ALL_TIME':
                return new Date('2000-01-01'); // Constant epoch

            default:
                return now;
        }
    } catch (e) {
        console.error(`Failed to parse period key: ${key}`, e);
        return now;
    }
}
