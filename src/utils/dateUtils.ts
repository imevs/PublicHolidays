import { type DateString, UTCDate } from "./UTCDate";
import { dateLocale } from "../consts";

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

export const generateYears = (): number[] => {
    const currentYear = new UTCDate().getFullYear();
    return Array.from({ length: 3 }, (_, i) => currentYear - 1 + i);
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
    return date1.toDateString() === date2.toDateString();
};

export const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
};

export const getMonthName = (month: number): string => {
    return new Date(0, month).toLocaleString(dateLocale, { month: "long" });
};

export const getNextMonth = (num: number): number => {
    return (num + 1) % 12;
};

const dateFormatter = new Intl.DateTimeFormat(dateLocale, {
    month: "long",
    day: "numeric",
});

const weekdayFormatter = new Intl.DateTimeFormat(dateLocale, {
    weekday: "long",
});

export function formatDateToReadable(date: UTCDate) {
    const formattedDate = dateFormatter.format(date.valueOf());
    const weekday = weekdayFormatter.format(date.valueOf());

    return `${formattedDate} (${weekday})`;
}

export function isWeekend(day: number | string) {
    return [DayIndexes.Saturday, DayIndexes.Sunday, "Sun", "Sat"].includes(day)
}