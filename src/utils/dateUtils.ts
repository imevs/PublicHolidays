import { type DateString, UTCDate } from "./UTCDate.ts";
import { dateLocale } from "../consts.ts";

export const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

export const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const fullDayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const DayIndexes = {
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
    Sunday: 0,
};

/**
 * Generates a sorted, contiguous list of years centered around the current year
 * and expanded to include `selectedYear` when provided.
 */
export const generateYears = (selectedYear?: number): number[] => {
    const currentYear = new UTCDate().getFullYear();
    const hasValidSelected = selectedYear !== undefined && Number.isFinite(selectedYear);
    const startYear = hasValidSelected ? Math.min(currentYear - 1, selectedYear) : currentYear - 1;
    const endYear = hasValidSelected ? Math.max(currentYear + 1, selectedYear) : currentYear + 1;
    return Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
};

export const formatDateString = (date: UTCDate): DateString => {
    return date.toISOString().split("T")[0] as unknown as DateString;
};

export function convertDayToEUFormat(dayOfWeek: number): number {
    return dayOfWeek === DayIndexes.Sunday ? 7 : dayOfWeek;
}

export const getDayName = (date: UTCDate): string => {
    return fullDayNames[convertDayToEUFormat(date.getDay()) - 1]; // array indexing starts from 0
}

export const isSameDate = (date1: UTCDate, date2: UTCDate): boolean => {
    return date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate();
};

export const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
};

export const getMonthName = (month: number, locale: string = dateLocale): string => {
    return new Date(Date.UTC(2025, month, 15)).toLocaleString(locale, {
        month: "long",
        timeZone: "UTC",
    });
};

export const getNextMonth = (num: number): number => {
    return (num + 1) % 12;
};

const dateFormatterCache = new Map<string, Intl.DateTimeFormat>();
const weekdayFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getReadableDateFormatters(locale: string) {
    let dateFmt = dateFormatterCache.get(locale);
    if (!dateFmt) {
        dateFmt = new Intl.DateTimeFormat(locale, {
            month: "long",
            day: "numeric",
            timeZone: "UTC",
        });
        dateFormatterCache.set(locale, dateFmt);
    }

    let weekdayFmt = weekdayFormatterCache.get(locale);
    if (!weekdayFmt) {
        weekdayFmt = new Intl.DateTimeFormat(locale, {
            weekday: "long",
            timeZone: "UTC",
        });
        weekdayFormatterCache.set(locale, weekdayFmt);
    }

    return { dateFmt, weekdayFmt };
}

export function formatDateToReadable(date: UTCDate, locale: string = dateLocale) {
    const { dateFmt, weekdayFmt } = getReadableDateFormatters(locale);
    const formattedDate = dateFmt.format(date.valueOf());
    const weekday = weekdayFmt.format(date.valueOf());

    return `${formattedDate} (${weekday})`;
}

export function isWeekend(day: number | string) {
    return [DayIndexes.Saturday, DayIndexes.Sunday, "Sun", "Sat"].includes(day)
}