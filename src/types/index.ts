import type { CountryCode, CountryName } from "../data/countryNames";
import { UTCDate } from "../utils/UTCDate";

export interface CalendarDay {
    date: UTCDate;
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
    kind: "publicHoliday";
    type: string[] | undefined;
    country: CountryName;
    countryCode: CountryCode;
}

export interface OtherEvent {
    date: string;
    name: string;
    icon: string;
    localName: string;
    kind: "other";
}