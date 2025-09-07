import type { CountryCode, CountryName } from "../data/countryNames";

export interface Holiday {
    date: string;
    name: string;
    localName: string;
}

export interface CountryHolidays {
    countryCode: string;
    countryName: string;
    years: Record<string, Holiday[]>;
}

export interface CalendarDay {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    isWeekend: boolean;
    holidays: HolidayWithCountry[];
    dayNumber: number;
}

export interface HolidayWithCountry extends Holiday {
    country: CountryName;
    countryCode: CountryCode;
}
