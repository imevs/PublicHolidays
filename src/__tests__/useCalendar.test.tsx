import * as timezone_mock from "timezone-mock";
timezone_mock.register("US/Eastern");

import { renderHook, act } from "@testing-library/react";
import { useCalendar } from "../hooks/useCalendar";
import { allHolidays } from "../data/holidays_v2";
import { convertEvents } from "../utils/convertEvents";

describe("useCalendar", () => {
    beforeEach(() => {
        window.location.hash = "";
    });

    it("returns current date and selected countries", () => {
        const { result } = renderHook(() => useCalendar(convertEvents(Object.values(allHolidays))));
        expect(result.current.currentDate).toBeInstanceOf(Date);
        expect(Array.isArray(result.current.selectedCountries)).toBe(true);
        expect(result.current.selectedCountries.length).toBeGreaterThan(0);
    });

    it("updates the current date when handleDateChange is called", () => {
        const { result } = renderHook(() => useCalendar(convertEvents(Object.values(allHolidays))));
        const newDate = new Date("2025-12-25");

        act(() => {
            result.current.handleDateChange(newDate);
        });

        expect(result.current.currentDate.toISOString()).toEqual(newDate.toISOString());
        expect(window.location.hash).toContain("date=2025-12-25");
    });

    it("toggles countries using toggleCountry", () => {
        const { result } = renderHook(() => useCalendar(convertEvents(Object.values(allHolidays))));
        act(() => {
            result.current.toggleCountry("DE");
        });
        expect(result.current.selectedCountries).toContain("DE");
        act(() => {
            result.current.toggleCountry("DE");
        });
        expect(result.current.selectedCountries).not.toContain("DE");
    });

    it("navigates months using navigateMonth", () => {
        const { result } = renderHook(() => useCalendar(convertEvents(Object.values(allHolidays))));
        const initialMonth = result.current.currentDate.getUTCMonth();
        act(() => {
            result.current.navigateMonth(initialMonth + 1); // Navigate to the next month
        });
        expect(result.current.currentDate.getUTCMonth()).toBe((initialMonth + 1) % 12);
    });

    it("calendarDays returns 42 days", () => {
        const { result } = renderHook(() => useCalendar(convertEvents(Object.values(allHolidays))));
        expect(Array.isArray(result.current.selectedMonthDays)).toBe(true);
        expect(result.current.selectedMonthDays).toHaveLength(42);
    });

    it("calendarDays for fixed currentDate contains correct holidays", async () => {
        window.location.hash = "date=2025-01-01&countries=LV";
        const { result } = renderHook(() => useCalendar(convertEvents(Object.values(allHolidays))));
        await Promise.resolve();
        const currentDate = result.current.currentDate;
        expect(currentDate.getUTCFullYear()).toBe(2025);
        expect(currentDate.getUTCMonth()).toBe(0);
        expect(currentDate.getUTCDate()).toBe(1);
        const matchingDay = result.current.selectedMonthDays.find(day =>
            day.date.getFullYear() === currentDate.getFullYear() &&
            day.date.getMonth() === currentDate.getMonth() &&
            day.date.getDate() === currentDate.getDate()
        );
        expect(matchingDay).toBeDefined();
        const expectedHolidays = [
            {
                country: "Latvia",
                countryCode: "LV",
                date: "2025-01-01",
                "localName": "New Year’s Day is the first day of the year, or January 1, in the Gregorian calendar.",
                "name": "New Year's Day",
                "primary_type": "National holiday",
                "type": [
                    "National holiday"
                ]
            }
        ];
        expect(matchingDay?.events).toEqual(expectedHolidays);
    });

    it("all calendarDays for November have correct holidays for selected country", () => {
        const countryHolidays = allHolidays["LV"].holidays;
        window.location.hash = "date=2025-11-01&countries=LV"; // November 2025, Latvia
        const { result } = renderHook(() => useCalendar(convertEvents(Object.values(allHolidays))));
        const novemberDays = result.current.selectedMonthDays.filter(day => day.date.getMonth() === 10); // November is month 10
        expect(novemberDays.length).toBeGreaterThan(0);
        for (const day of novemberDays) {
            const dateStr = day.date.toISOString().split("T")[0];
            const expectedHolidays = countryHolidays
                .filter((holiday) => holiday.date === dateStr)
                .map((holiday) => ({
                    ...holiday,
                    country: allHolidays["LV"].countryName,
                    countryCode: "LV",
                }));
            expect(day.events).toEqual(expectedHolidays);
        }
    });

    it("check current date time zone is US/Eastern", () => {
        const date = new Date("2025-01-01");
        expect(date.getTimezoneOffset()).toBe(300); // EST timezone offset
        expect(date.toISOString()).toBe("2025-01-01T00:00:00.000Z"); // 5 hours ahead of UTC
        expect(date.getUTCFullYear()).toBe(2025);
    });
});
