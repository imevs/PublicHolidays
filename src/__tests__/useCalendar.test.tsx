import * as timezone_mock from "timezone-mock";
timezone_mock.register("US/Eastern");

import { renderHook, act } from "@testing-library/react";
import { useCalendar } from "../hooks/useCalendar.ts";
import { allHolidays } from "../data/holidays_v2/index.ts";
import { convertEvents } from "../utils/convertEvents.ts";
import { UTCDate } from "../utils/UTCDate.ts";
import type { CalendarEvent } from "../types/index.ts";

describe("useCalendar", () => {
    beforeEach(() => {
        window.location.hash = "";
    });

    it("returns current date and selected countries", () => {
        const { result } = renderHook(() => useCalendar(convertEvents(Object.values(allHolidays))));
        expect(result.current.currentDate).toBeInstanceOf(UTCDate);
        expect(Array.isArray(result.current.selectedCountries)).toBe(true);
        expect(result.current.selectedCountries.length).toBeGreaterThan(0);
    });

    it("updates the current date when handleDateChange is called", () => {
        const { result } = renderHook(() => useCalendar(convertEvents(Object.values(allHolidays))));
        const newDate = new UTCDate("2025-12-25");

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
        const initialMonth = result.current.currentDate.getMonth();
        act(() => {
            const res = result.current.navigateMonth(initialMonth + 1); // Navigate to the next month
            expect(res.getMonth()).toBe((initialMonth + 1) % 12);
        });
    });

    it("calendarDays returns 42 days", () => {
        window.location.hash = "date=2025-06-01&countries=LV";
        const { result } = renderHook(() => useCalendar(convertEvents(Object.values(allHolidays))));
        expect(Array.isArray(result.current.selectedMonthDays)).toBe(true);
        expect(result.current.selectedMonthDays).toHaveLength(42);
    });

    it("calendarDays for fixed currentDate contains correct holidays", async () => {
        window.location.hash = "date=2025-01-01&countries=LV";
        const { result } = renderHook(() => useCalendar(convertEvents(Object.values(allHolidays))));
        await Promise.resolve();
        const currentDate = result.current.currentDate;
        expect(currentDate.getFullYear()).toBe(2025);
        expect(currentDate.getMonth()).toBe(0);
        expect(currentDate.getDate()).toBe(1);
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
                "localName": "New Year's Day is the first day of the year, or January 1, in the Gregorian calendar.",
                "name": "New Year's Day",
                "kind": "publicHoliday",
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
                    "kind": "publicHoliday",
                    country: allHolidays["LV"].countryName,
                    countryCode: "LV",
                }));
            expect(day.events).toEqual(expectedHolidays);
        }
    });

    it("manages shouldScrollToMonth state correctly based on initial hash load, user interaction, and skipMonthScroll", () => {
        window.location.hash = "date=2025-05-01";
        const { result, rerender } = renderHook(() => useCalendar(convertEvents(Object.values(allHolidays))));

        expect(result.current.shouldScrollToMonth).toBe(true);

        act(() => {
            result.current.clearShouldScrollToMonth();
        });
        expect(result.current.shouldScrollToMonth).toBe(false);

        act(() => {
            result.current.navigateMonth(5);
        });
        expect(result.current.shouldScrollToMonth).toBe(false);

        sessionStorage.setItem("skipMonthScroll", "1");
        window.location.hash = "date=2025-06-01";
        act(() => {
            sessionStorage.removeItem("skipMonthScroll");
            rerender();
        });
        expect(result.current.shouldScrollToMonth).toBe(false);
        expect(sessionStorage.getItem("skipMonthScroll")).toBeNull();
    });

    it("does not set shouldScrollToMonth on subsequent hashchange events (such as toggling countries or preset hash updates while date= is in the hash)", () => {
        window.location.hash = "date=2025-05-01&countries=LV";
        const { result } = renderHook(() => useCalendar(convertEvents(Object.values(allHolidays))));

        expect(result.current.shouldScrollToMonth).toBe(true);

        act(() => {
            result.current.clearShouldScrollToMonth();
        });
        expect(result.current.shouldScrollToMonth).toBe(false);

        // Simulate subsequent hash change event (e.g. toggling country or preset update) while date= is present
        act(() => {
            window.location.hash = "date=2025-05-01&countries=LV,DE";
            window.dispatchEvent(new HashChangeEvent("hashchange"));
        });

        expect(result.current.shouldScrollToMonth).toBe(false);
    });

    it("check current date time zone is US/Eastern", () => {
        const date = new UTCDate("2025-01-01");
        expect(date.getTimezoneOffset()).toBe(300); // EST timezone offset
        expect(date.toISOString()).toBe("2025-01-01T12:00:00.000Z");
        expect(date.getFullYear()).toBe(2025);
    });

    it("handleModeChange to month on the 31st does not overflow into next month", () => {
        window.location.hash = "date=2025-01-31&countries=LV";
        const { result } = renderHook(() => useCalendar(convertEvents(Object.values(allHolidays))));

        act(() => {
            result.current.handleModeChange("month", 1); // February
        });

        expect(window.location.hash).toContain("mode=month");
        expect(window.location.hash).toContain("date=2025-02-01");
    });

    it("verifies isLongHoliday marks 3+ day holiday stretches and does NOT mark ordinary 2-day Sat+Sun weekends", () => {
        // Let's test with a mock custom event or a known 3+ day stretch or check hook's calculation.
        // Let's create events where Fri + Sat + Sun are holidays or part of a long weekend stretch.
        const customEvents = [
            {
                name: "Friday Off",
                date: "2025-03-21" as const,
                kind: "other" as const,
                isRange: false,
                icon: "🎉",
                localName: "Friday Off",
            }
        ];
        // 2025-03-21 is Friday, 2025-03-22 is Saturday (weekend), 2025-03-23 is Sunday (weekend).
        // Together: Friday (holiday/off), Saturday (weekend), Sunday (weekend) -> 3 consecutive days.
        window.location.hash = "date=2025-03-01&countries=LV";
        const { result } = renderHook(() => useCalendar(convertEvents(Object.values(allHolidays)).concat(customEvents)));

        const marchDays = result.current.selectedMonthDays;
        const friDay = marchDays.find(d => d.date.toISOString().startsWith("2025-03-21"));
        const satDay = marchDays.find(d => d.date.toISOString().startsWith("2025-03-22"));
        const sunDay = marchDays.find(d => d.date.toISOString().startsWith("2025-03-23"));

        expect(friDay?.isLongHoliday).toBe(true);
        expect(satDay?.isLongHoliday).toBe(true);
        expect(sunDay?.isLongHoliday).toBe(true);

        // Ordinary weekend (e.g. following weekend or previous without Friday/Monday holiday)
        // Let's check a purely normal Sat+Sun weekend without adjacent holidays if any, or test standard weekend alone.
        // Wait, standard weekend alone (just Sat+Sun) is 2 days, so it should NOT be marked as isLongHoliday.
        const ordinarySat = marchDays.find(d => d.date.toISOString().startsWith("2025-03-15")); // Saturday
        const ordinarySun = marchDays.find(d => d.date.toISOString().startsWith("2025-03-16")); // Sunday
        // If there are no holidays on 15th and 16th, they are just normal Sat+Sun (2 days).
        expect(ordinarySat?.isLongHoliday).toBeFalsy();
        expect(ordinarySun?.isLongHoliday).toBeFalsy();
    });

    it("verifies previous-month days in selectedMonthDays have isLongHoliday true when a long holiday continues from the previous month", () => {
        // Let's test a holiday on Friday of the previous month (e.g. Feb 28, 2025 is Friday),
        // continuing into Saturday Mar 1 and Sunday Mar 2, 2025.
        // Wait, March 2025 view has padding days from February (including Feb 28).
        // Let's put a custom event or check Jan/Feb.
        // Let's use Feb 28 (Friday) as a holiday, while March 1 is Saturday and March 2 is Sunday.
        const customEvents = [
            {
                name: "Friday Holiday",
                date: "2025-02-28" as const,
                kind: "other" as const,
                isRange: false,
                icon: "🎉",
                localName: "Friday Holiday",
            }
        ];
        window.location.hash = "date=2025-03-01&countries=LV";
        const { result } = renderHook(() => useCalendar(convertEvents(Object.values(allHolidays)).concat(customEvents)));

        const marchMonthDays = result.current.selectedMonthDays;
        const feb28Day = marchMonthDays.find(d => d.date.toISOString().startsWith("2025-02-28"));
        const mar1Day = marchMonthDays.find(d => d.date.toISOString().startsWith("2025-03-01"));
        const mar2Day = marchMonthDays.find(d => d.date.toISOString().startsWith("2025-03-02"));

        expect(feb28Day).toBeDefined();
        expect(feb28Day?.isCurrentMonth).toBe(false);
        expect(feb28Day?.isLongHoliday).toBe(true);
        expect(mar1Day?.isLongHoliday).toBe(true);
        expect(mar2Day?.isLongHoliday).toBe(true);
    });

    it("verifies LV long holiday spanning Dec 31 to Jan 4", () => {
        // For countries=LV, test date=2025-12-01 and date=2026-01-01
        window.location.hash = "date=2025-12-01&countries=LV";
        const { result: result2025, rerender } = renderHook(
            ({ hash }) => {
                window.location.hash = hash;
                return useCalendar(convertEvents(Object.values(allHolidays)));
            },
            { initialProps: { hash: "date=2025-12-01&countries=LV" } }
        );

        const dayDec31_2025 = result2025.current.selectedYearDays.find(d => d.date.toISOString().startsWith("2025-12-31"));
        expect(dayDec31_2025).toBeDefined();
        expect(dayDec31_2025?.isLongHoliday).toBe(true);

        rerender({ hash: "date=2026-01-01&countries=LV" });

        const dayDec31_2026View = result2025.current.selectedYearDays.find(d => d.date.toISOString().startsWith("2025-12-31"));
        expect(dayDec31_2026View).toBeDefined();
        expect(dayDec31_2026View?.events.length).toBeGreaterThan(0);
        expect(dayDec31_2026View?.isLongHoliday).toBe(true);

        for (let day = 1; day <= 4; day++) {
            const dateStr = `2026-01-0${day}`;
            const targetDay = result2025.current.selectedYearDays.find(d => d.date.toISOString().startsWith(dateStr));
            expect(targetDay).toBeDefined();
            expect(targetDay?.isLongHoliday).toBe(true);
        }
    });

    it("verifies LV long holiday spanning 2026-12-31 to 2027-01-03 in both year and month views", () => {
        window.location.hash = "date=2026-12-01&countries=LV";
        const { result } = renderHook(() => useCalendar(convertEvents(Object.values(allHolidays))));

        const targetDates = ["2026-12-31", "2027-01-01", "2027-01-02", "2027-01-03"];
        for (const dateStr of targetDates) {
            const yearDay = result.current.selectedYearDays.find(d => d.date.toISOString().startsWith(dateStr));
            const monthDay = result.current.selectedMonthDays.find(d => d.date.toISOString().startsWith(dateStr));
            expect(yearDay).toBeDefined();
            expect(yearDay?.isLongHoliday).toBe(true);
            expect(monthDay).toBeDefined();
            expect(monthDay?.isLongHoliday).toBe(true);
        }
    });

    it("highlights long holidays with distinct colors per selected country and combines overlapping countries", () => {
        const events = convertEvents([
            {
                countryName: "Latvia",
                countryCode: "LV",
                holidays: [
                    { name: "LV Fri Holiday", localName: "LV Fri Holiday", date: "2025-04-04", type: ["National holiday"] },
                    { name: "Shared Mon Holiday", localName: "Shared Mon Holiday", date: "2025-04-14", type: ["National holiday"] },
                ],
            },
            {
                countryName: "Germany",
                countryCode: "DE",
                holidays: [
                    { name: "DE Mon Holiday", localName: "DE Mon Holiday", date: "2025-04-21", type: ["National holiday"] },
                    { name: "Shared Mon Holiday", localName: "Shared Mon Holiday", date: "2025-04-14", type: ["National holiday"] },
                ],
            },
        ]);

        window.location.hash = "date=2025-04-01&countries=LV,DE";
        const { result } = renderHook(() => useCalendar(events));

        const lvDay = result.current.selectedMonthDays.find(d => d.date.toISOString().startsWith("2025-04-04"));
        const deDay = result.current.selectedMonthDays.find(d => d.date.toISOString().startsWith("2025-04-21"));
        const sharedDay = result.current.selectedMonthDays.find(d => d.date.toISOString().startsWith("2025-04-14"));

        expect(lvDay?.longHolidayCountries).toEqual(["LV"]);
        expect(deDay?.longHolidayCountries).toEqual(["DE"]);
        expect(lvDay?.longHolidayColors).toHaveLength(1);
        expect(deDay?.longHolidayColors).toHaveLength(1);
        expect(lvDay?.longHolidayColors?.[0]).not.toBe(deDay?.longHolidayColors?.[0]);

        expect(sharedDay?.longHolidayCountries).toEqual(["LV", "DE"]);
        expect(sharedDay?.longHolidayColors).toEqual([
            lvDay?.longHolidayColors?.[0],
            deDay?.longHolidayColors?.[0],
        ]);
        expect(lvDay?.longHolidayDetails).toEqual([{ countryCode: "LV", days: 3 }]);
        expect(deDay?.longHolidayDetails).toEqual([{ countryCode: "DE", days: 3 }]);
        expect(sharedDay?.longHolidayDetails).toEqual([{ countryCode: "LV", days: 3 }, { countryCode: "DE", days: 3 }]);
    });

    it("handles school holidays visibility, syncing, and long holiday exclusion", () => {
        const events: CalendarEvent[] = convertEvents([
            {
                countryName: "Latvia",
                countryCode: "LV",
                holidays: [
                    { name: "School Break", localName: "School Break", date: "2025-05-12", type: ["School Holiday"] },
                    { name: "National Day", localName: "National Day", date: "2025-05-13", type: ["National holiday"] },
                ],
            },
        ]);

        window.location.hash = "date=2025-05-01&countries=LV";
        const { result } = renderHook(() => useCalendar(events));

        // Hidden by default
        let day12 = result.current.selectedMonthDays.find(d => d.date.toISOString().startsWith("2025-05-12"));
        expect(day12?.events.some(e => "type" in e && (e.type as string[])?.includes("School Holiday"))).toBe(false);

        // Show school holidays
        act(() => {
            result.current.setShowSchoolHolidays(true);
        });
        expect(window.location.hash).toContain("school=1");
        expect(result.current.showSchoolHolidays).toBe(true);

        day12 = result.current.selectedMonthDays.find(d => d.date.toISOString().startsWith("2025-05-12"));
        expect(day12?.events.some(e => "type" in e && (e.type as string[])?.includes("School Holiday"))).toBe(true);

        // Hide again
        act(() => {
            result.current.setShowSchoolHolidays(false);
        });
        expect(window.location.hash).not.toContain("school=1");
        expect(result.current.showSchoolHolidays).toBe(false);

        // Initial hash load
        window.location.hash = "date=2025-05-01&countries=LV&school=1";
        const { result: result2 } = renderHook(() => useCalendar(events));
        expect(result2.current.showSchoolHolidays).toBe(true);
        const day12_loaded = result2.current.selectedMonthDays.find(d => d.date.toISOString().startsWith("2025-05-12"));
        expect(day12_loaded?.events.some(e => "type" in e && (e.type as string[])?.includes("School Holiday"))).toBe(true);

        // School holidays do not trigger long holiday streaks
        // Create a sequence of 3 school holidays surrounding a weekend or consecutive days
        const schoolStreakEvents: CalendarEvent[] = convertEvents([
            {
                countryName: "Latvia",
                countryCode: "LV",
                holidays: [
                    { name: "S1", localName: "S1", date: "2025-05-05", type: ["School Holiday"] },
                    { name: "S2", localName: "S2", date: "2025-05-06", type: ["School Holiday"] },
                    { name: "S3", localName: "S3", date: "2025-05-07", type: ["School Holiday"] },
                ],
            },
        ]);
        window.location.hash = "date=2025-05-01&countries=LV&school=1";
        const { result: resultStreak } = renderHook(() => useCalendar(schoolStreakEvents));
        const sDays = resultStreak.current.selectedMonthDays.filter(d => ["2025-05-05", "2025-05-06", "2025-05-07"].some(dateStr => d.date.toISOString().startsWith(dateStr)));
        for (const d of sDays) {
            expect(d.isLongHoliday).not.toBe(true);
        }
    });
});
