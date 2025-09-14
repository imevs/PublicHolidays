import type { CountryCode, CountryName } from "../data/countryNames";

export interface CalendarDay {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    isWeekend: boolean;
    events: CalendarEvent[];
    dayNumber: number;
}

export type CalendarEvent = HolidayWithCountry | OtherEvent;

export interface HolidayWithCountry {
    date: string;
    name: string;
    localName: string;
    type: "publicHoliday";
    country: CountryName;
    countryCode: CountryCode;
}

export interface OtherEvent {
    date: string;
    name: string;
    localName: string;
    type: "other";
}