import type { CountryCode, CountryName } from "../data/countryNames.ts";
import type { CountryHolidays } from "../data/holidays_v2/types.ts";
import type { CalendarEvent } from "../types/index.ts";
import type { DateString } from "./UTCDate.ts";

export function convertEvents(allHolidays: CountryHolidays[]): CalendarEvent[] {
    return allHolidays.flatMap(data => data.holidays.map(h => ({
        ...h,
        date: h.date.split("T")[0] as DateString, // "2025-06-21T04:42:15+02:00"
        kind: "publicHoliday" as const,
        country: data.countryName as CountryName,
        countryCode: data.countryCode as CountryCode,
    })));
}
