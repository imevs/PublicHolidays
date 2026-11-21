import type { CountryCode, CountryName } from "../data/countryNames.ts";
import { type DateString, UTCDate } from "../utils/UTCDate.ts";

export interface CalendarDay {
    date: UTCDate;
    isCurrentYear: boolean;
    isCurrentMonth: boolean;
    isSideMonth: boolean;
    isToday: boolean;
    isWeekend: boolean;
    isLongHoliday?: boolean;
    events: CalendarEvent[];
    dayNumber: number;
}

export type CalendarEvent = HolidayWithCountry | OtherEvent;

export interface HolidayWithCountry {
    date: DateString;
    name: string;
    localName: string;
    kind: "publicHoliday";
    type?: string[];
    country: CountryName;
    countryCode: CountryCode;
}

export interface OtherEvent {
    date: DateString;
    endDate?: DateString;
    rangeStart?: DateString;
    isRange?: boolean;
    rangePosition?: "start" | "middle" | "end" | "single";
    name: string;
    icon: string;
    localName: string;
    kind: "other";
    color?: string;
}