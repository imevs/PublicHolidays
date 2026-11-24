import type { CountryCode, CountryName } from "../data/countryNames.ts";
import type { CountryHolidays } from "../data/holidays_v2/types.ts";
import type { CalendarEvent } from "../types/index.ts";
import type { DateString } from "./UTCDate.ts";

export function expandDateRange(startStr: string, endStr: string): DateString[] {
    const days: DateString[] = [];
    const [sy, sm, sd] = startStr.split("-").map(Number);
    const [ey, em, ed] = endStr.split("-").map(Number);
    let curr = Date.UTC(sy, sm - 1, sd);
    const end = Date.UTC(ey, em - 1, ed);
    let count = 0;
    while (curr <= end && count < 366) {
        const d = new Date(curr);
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, "0");
        const day = String(d.getUTCDate()).padStart(2, "0");
        days.push(`${y}-${m}-${day}` as DateString);
        curr += 24 * 60 * 60 * 1000;
        count++;
    }
    return days;
}

export function convertEvents(allHolidays: CountryHolidays[]): CalendarEvent[] {
    return allHolidays.flatMap(data => data.holidays.flatMap(h => {
        const startDate = h.date.split("T")[0] as DateString;
        const rawEnd = h.endDate ? (h.endDate.split("T")[0] as DateString) : undefined;
        if (rawEnd && rawEnd > startDate) {
            const days = expandDateRange(startDate, rawEnd);
            return days.map((d, i) => ({
                ...h,
                date: d,
                endDate: rawEnd as DateString,
                rangeStart: startDate,
                isRange: true,
                rangePosition: days.length === 1 ? "single" : i === 0 ? "start" : i === days.length - 1 ? "end" : "middle",
                kind: "publicHoliday" as const,
                country: data.countryName as CountryName,
                countryCode: data.countryCode as CountryCode,
            }));
        }
        return [{
            ...h,
            date: startDate,
            ...(h.endDate ? { endDate: h.endDate.split("T")[0] as DateString } : {}),
            kind: "publicHoliday" as const,
            country: data.countryName as CountryName,
            countryCode: data.countryCode as CountryCode,
        }] as CalendarEvent[];
    }));
}
