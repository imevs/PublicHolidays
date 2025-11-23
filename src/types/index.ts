import type { CountryCode, CountryName } from "../data/countryNames";
import { type DateString, UTCDate } from "../utils/UTCDate";

export interface CalendarDay {
    date: UTCDate;
    isCurrentYear: boolean;
    isCurrentMonth: boolean;
    isSideMonth: boolean;
    isToday: boolean;
    isWeekend: boolean;
    events: CalendarEvent[];
    dayNumber: number;
}

export type CalendarEvent = HolidayWithCountry | OtherEvent;

export interface HolidayWithCountry {
    date: DateString;
    name: string;
    localName: string;
    kind: "publicHoliday";
    type: string[] | undefined;
    country: CountryName;
    countryCode: CountryCode;
}

export interface OtherEvent {
    date: DateString;
    name: string;
    icon: string;
    localName: string;
    kind: "other";
}