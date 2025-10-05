import type { CountryHolidays } from "../data/holidays_v2/types";
import type { CalendarEvent } from "../types";

export function convertEvents(allHolidays: CountryHolidays[]): CalendarEvent[] {
    return allHolidays.flatMap(data => data.holidays.map(h => ({
        ...h,
        kind: "publicHoliday" as const,
        country: data.countryName,
        countryCode: data.countryCode,
    })));
}
