import type { CountryHolidays } from "../data/holidays_v2/types";
import type { CalendarEvent } from "../types";
import type { DateString } from "./UTCDate";

export function convertEvents(allHolidays: CountryHolidays[]): CalendarEvent[] {
    return allHolidays.flatMap(data => data.holidays.map(h => ({
        ...h,
        date: h.date.split("T")[0] as DateString, // "2025-06-21T04:42:15+02:00"
        kind: "publicHoliday" as const,
        country: data.countryName,
        countryCode: data.countryCode,
    })));
}
