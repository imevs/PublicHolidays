import { allHolidays as holidaysData } from "../data/holidays_v2";
import type { CountryName } from "../data/holidays_descriptions/all";

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

export type CountryCode = keyof typeof holidaysData;
