import {
    monthNames,
    dayNames,
    generateYears,
    formatDateString,
    isSameDate,
} from "../utils/dateUtils.ts";
import { UTCDate } from "../utils/UTCDate.ts";

describe("dateUtils", () => {
    it("monthNames contains 12 months", () => {
        expect(monthNames).toHaveLength(12);
        expect(monthNames[0]).toBe("January");
        expect(monthNames[11]).toBe("December");
    });

    it("dayNames contains 7 days", () => {
        expect(dayNames).toHaveLength(7);
        expect(dayNames[6]).toBe("Sun");
        expect(dayNames[5]).toBe("Sat");
    });

    it("generateYears returns 3 years including current", () => {
        const years = generateYears();
        const currentYear = new Date().getFullYear();
        expect(years).toEqual([currentYear - 1, currentYear, currentYear + 1]);
    });

    it("formats a date as YYYY-MM-DD", () => {
        const date = new UTCDate("2025-08-10");
        expect(formatDateString(date)).toBe("2025-08-10");
    });

    it("isSameDate returns true for same date", () => {
        const d1 = new UTCDate("2025-07-10");
        const d2 = new UTCDate("2025-07-10");
        expect(isSameDate(d1, d2)).toBe(true);
    });

    it("isSameDate returns false for different dates", () => {
        const d1 = new UTCDate("2025-07-10");
        const d2 = new UTCDate("2025-07-11");
        expect(isSameDate(d1, d2)).toBe(false);
    });

    it("UTCDate uses UTC consistently for toDateString, isSameDate, isToday, and MM-DD constructor", () => {
        jest.useFakeTimers();
        try {
            // 2027-07-11T01:00:00Z is still July 10 in negative UTC offsets locally,
            // so UTCDate methods must agree on UTC 2027-07-11.
            jest.setSystemTime(new Date("2027-07-11T01:00:00.000Z"));

            const now = new UTCDate();
            const utcDay = new UTCDate("2027-07-11");
            const twoPart = new UTCDate("07-11");

            expect(now.toDateString()).toBe(utcDay.toDateString());
            expect(isSameDate(now, utcDay)).toBe(true);
            expect(utcDay.isToday()).toBe(true);
            expect(twoPart.getFullYear()).toBe(2027);
            expect(twoPart.isToday()).toBe(true);

            // Advancing system time must update isToday() dynamically
            jest.setSystemTime(new Date("2027-07-12T12:00:00.000Z"));
            expect(utcDay.isToday()).toBe(false);
        } finally {
            jest.useRealTimers();
        }
    });
});
