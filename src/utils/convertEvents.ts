import type { CountryHolidays } from "../data/holidays_v2/types";
import type { CalendarEvent } from "../types";

export function convertEvents(allHolidays: CountryHolidays[]): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    allHolidays.map(data => {
        events.push(...data.holidays.map(h => ({
            ...h,
            kind: "publicHoliday" as const,
            country: data.countryName,
            countryCode: data.countryCode,
        })));
    });
    return events;
}
