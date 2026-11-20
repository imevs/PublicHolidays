import { render, screen, fireEvent, act, renderHook, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

jest.mock("react-router", () => ({
    useNavigate: () => jest.fn(),
}));
jest.mock("../components/CalendarGrid/UsePrevious.tsx", () => ({
    usePrevious: () => null,
}));

import { countryTimeZones, countryOffsets, getLocalTime } from "../utils/timeZones.ts";
import { countryNames, type CountryCode } from "../data/countryNames.ts";
import { getLink } from "../data/holidays_descriptions/getLink.ts";
import { descriptions } from "../data/holidays_descriptions/all.ts";
import CalendarGrid from "../components/CalendarGrid/CalendarGrid.tsx";
import Controls from "../components/Controls/Controls.tsx";
import EventPopup from "../components/EventPopup/EventPopup.tsx";
import { EventListInput } from "../components/EventListInput/EventListInput.tsx";
import { ActionButtons } from "../components/EventsList/EventsListActionButtons.tsx";
import * as notificationsModule from "../notifications/notifications.ts";
import { UTCDate } from "../utils/UTCDate.ts";
import type { CalendarDay, CalendarEvent } from "../types/index.ts";
import { buildHolidaysIndex, getHolidaysForDate, useCalendar } from "../hooks/useCalendar.ts";
import { allHolidays } from "../data/holidays_v2/index.ts";
import { convertEvents } from "../utils/convertEvents.ts";
import { transformNationalHolidays } from "../utils/filterNationalHolidays.cjs";
import { Holidays } from "../Holidays.tsx";
import {
    startNotificationsCommand,
    stopNotificationsCommand,
    getNotificationsStatusCommand,
    notificationsWereSet,
} from "../notifications/types.ts";

describe("timeZones", () => {
    it("provides valid non-empty IANA timezones and offsets for all countries", () => {
        const codes = Object.keys(countryNames) as CountryCode[];
        for (const code of codes) {
            expect(countryTimeZones[code]).toBeTruthy();
            expect(countryOffsets[code]).toBeTruthy();
            expect(getLocalTime(code)).toBeTruthy();
        }
    });

    it("getLocalTime returns empty string for unknown country code without throwing", () => {
        expect(getLocalTime("XX" as CountryCode)).toBe("");
    });
});

describe("getLink", () => {
    it("falls back to Google search URL when country has no description entry and date is omitted", () => {
        const url = getLink(undefined, "United States", "public holidays", descriptions);
        expect(url).toBe("https://www.google.com/search?q=public%20holidays%20United%20States");
    });

    it("falls back to Google search URL when country has no description entry and date is provided", () => {
        const url = getLink("2025-07-04", "United States", "Independence Day", descriptions);
        expect(url).toBe("https://www.google.com/search?q=Independence%20Day%20United%20States");
    });
});

describe("CalendarGrid YearView zero-padding", () => {
    it("matches single-digit days like 2025-01-01 in YearView", () => {
        const origScrollIntoView = HTMLElement.prototype.scrollIntoView;
        HTMLElement.prototype.scrollIntoView = jest.fn();

        const jan1 = new UTCDate("2025-01-01");
        const selectedYearDays: CalendarDay[] = [
            {
                date: jan1,
                dayNumber: 1,
                isSideMonth: false,
                isCurrentMonth: true,
                isCurrentYear: true,
                isToday: false,
                isWeekend: false,
                events: [
                    {
                        kind: "publicHoliday",
                        date: "2025-01-01",
                        name: "New Year's Day",
                        localName: "Jaungada diena",
                        country: "Latvia",
                        countryCode: "LV",
                        type: ["National holiday"],
                    },
                ],
            },
        ];

        try {
            render(
                <CalendarGrid
                    selectedYearDays={selectedYearDays}
                    selectedMonthDays={[]}
                    currentDate={jan1}
                    mode="year"
                    countryData={{}}
                    onModeChange={jest.fn()}
                />
            );

            // Flag indicator for LV should appear on Jan 1 cell in YearView
            expect(screen.getByText("🇱🇻")).toBeInTheDocument();
        } finally {
            HTMLElement.prototype.scrollIntoView = origScrollIntoView;
        }
    });
});

describe("Controls date overflow", () => {
    it("does not overflow Feb 29 to March when changing year to a non-leap year", () => {
        const onDateChange = jest.fn();
        render(
            <Controls
                selectedDate={new UTCDate("2024-02-29")}
                onDateChange={onDateChange}
                onNavigateMonth={jest.fn()}
            />
        );

        const selects = screen.getAllByRole("combobox");
        const yearSelect = selects[0];
        const nextYear = String(new UTCDate().getFullYear());
        fireEvent.change(yearSelect, { target: { value: nextYear } });

        expect(onDateChange).toHaveBeenCalledTimes(1);
        const updated: UTCDate = onDateChange.mock.calls[0][0];
        expect(updated.getMonth()).toBe(1); // February, not March
        expect(updated.getDate()).toBe(1);
    });

    it("does not overflow Jan 31 to March when selecting February", () => {
        const onDateChange = jest.fn();
        render(
            <Controls
                selectedDate={new UTCDate("2025-01-31")}
                onDateChange={onDateChange}
                onNavigateMonth={jest.fn()}
            />
        );

        const selects = screen.getAllByRole("combobox");
        const monthSelect = selects[1];
        fireEvent.change(monthSelect, { target: { value: "1" } }); // February

        expect(onDateChange).toHaveBeenCalledTimes(1);
        const updated: UTCDate = onDateChange.mock.calls[0][0];
        expect(updated.getMonth()).toBe(1); // February, not March
        expect(updated.getDate()).toBe(1);
    });
});

describe("EventPopup", () => {
    it("strips and replaces skin-tone emojis like 👴🏼 cleanly and saves once on Enter", () => {
        const onNewEvent = jest.fn();
        render(<EventPopup initialDate="2025-05-10" onNewEvent={onNewEvent} />);

        const input = screen.getByLabelText("Name") as HTMLInputElement;
        fireEvent.click(screen.getByText("👴🏼"));
        expect(input.value).toBe("👴🏼 ");

        fireEvent.change(input, { target: { value: "👴🏼 Grandpa Day" } });
        // Replace with another emoji: should strip 👴🏼 completely without leaving skin-tone modifier or duplicating
        fireEvent.click(screen.getByText("🎂"));
        expect(input.value).toBe("🎂 Grandpa Day");

        // Switch back to 👴🏼 and submit via Enter inside input
        fireEvent.click(screen.getByText("👴🏼"));
        expect(input.value).toBe("👴🏼 Grandpa Day");

        fireEvent.keyDown(input, { key: "Enter" });

        expect(onNewEvent).toHaveBeenCalledTimes(1);
        expect(onNewEvent).toHaveBeenCalledWith({
            date: "05-10",
            name: "Grandpa Day",
            icon: "👴🏼",
            localName: "",
            kind: "other",
        });
    });

    it("cancels on Escape", () => {
        const onNewEvent = jest.fn();
        render(<EventPopup initialDate="2025-05-10" onNewEvent={onNewEvent} />);

        fireEvent.keyDown(document, { key: "Escape" });
        expect(onNewEvent).toHaveBeenCalledTimes(1);
        expect(onNewEvent).toHaveBeenCalledWith(null);
    });
});

describe("EventListInput", () => {
    it("disconnects ResizeObserver on unmount and validates impossible dates properly", () => {
        const disconnect = jest.fn();
        const observe = jest.fn();
        const OriginalResizeObserver = globalThis.ResizeObserver;
        globalThis.ResizeObserver = jest.fn().mockImplementation(() => ({
            observe,
            unobserve: jest.fn(),
            disconnect,
        }));

        try {
            const setHolidaysData = jest.fn();
            const text = [
                "2025-02-31 🎂 Impossible",
                "2025-02-29 🎂 NonLeap",
                "2025-13-01 🎂 BadMonth",
                "02-30 🎂 BadRecurring",
                "02-29 🎂 LeapRecurring",
                "2024-02-29 🎂 LeapDay",
            ].join("\n");

            const { unmount } = render(
                <EventListInput
                    dataText={text}
                    setDataText={jest.fn()}
                    setHolidaysData={setHolidaysData}
                />
            );

            expect(observe).toHaveBeenCalledTimes(1);
            const parsedEvents = setHolidaysData.mock.calls[setHolidaysData.mock.calls.length - 1][0];
            const names = parsedEvents.map((e: { name: string }) => e.name);
            expect(names).not.toContain("Impossible");
            expect(names).not.toContain("NonLeap");
            expect(names).not.toContain("BadMonth");
            expect(names).not.toContain("BadRecurring");
            expect(names).toContain("LeapRecurring");
            expect(names).toContain("LeapDay");

            unmount();
            expect(disconnect).toHaveBeenCalledTimes(1);
        } finally {
            globalThis.ResizeObserver = OriginalResizeObserver;
        }
    });
});

describe("notifications and EventsListActionButtons", () => {
    it("falls back to registration.active when controller is null and avoids duplicate message listeners", async () => {
        const postMessage = jest.fn();
        const addEventListener = jest.fn();
        const register = jest.fn().mockResolvedValue(undefined);
        const activeSW = { postMessage } as unknown as ServiceWorker;

        Object.defineProperty(navigator, "serviceWorker", {
            configurable: true,
            value: {
                controller: null,
                register,
                ready: Promise.resolve({ active: activeSW }),
                addEventListener,
            },
        });
        Object.defineProperty(window, "Notification", {
            configurable: true,
            value: {
                permission: "granted",
                requestPermission: jest.fn().mockResolvedValue("granted"),
            },
        });

        await jest.isolateModulesAsync(async () => {
            const { initServiceWorker, registerNotifications } = await import("../notifications/notifications.ts");
            const cb1 = jest.fn();
            const cb2 = jest.fn();

            const sw1 = await initServiceWorker(cb1);
            const sw2 = await initServiceWorker(cb2);

            expect(sw1).toBe(activeSW);
            expect(sw2).toBe(activeSW);
            expect(addEventListener).toHaveBeenCalledTimes(1);

            await registerNotifications(
                [{ date: "2026-11-21", name: "Holiday", localName: "Holiday", country: "Latvia", countryCode: "LV" }],
                false,
                cb2
            );
            expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({
                type: startNotificationsCommand,
            }));
        });
    });

    it("ActionButtons getNotifications reads latest selectedYearDays instead of stale initial array", async () => {
        const OriginalResizeObserver = globalThis.ResizeObserver;
        globalThis.ResizeObserver = jest.fn().mockImplementation(() => ({
            observe: jest.fn(),
            unobserve: jest.fn(),
            disconnect: jest.fn(),
        }));
        const registerSpy = jest.spyOn(notificationsModule, "registerNotifications").mockResolvedValue(undefined);
        Object.defineProperty(notificationsModule, "hasServiceWorker", {
            configurable: true,
            value: true,
        });

        const dayWithHoliday: CalendarDay = {
            date: new UTCDate("2025-11-18"),
            dayNumber: 18,
            isSideMonth: false,
            isCurrentMonth: true,
            isCurrentYear: true,
            isToday: false,
            isWeekend: false,
            events: [
                {
                    kind: "publicHoliday",
                    date: "2025-11-18",
                    name: "Proclamation Day",
                    localName: "Latvijas Republikas proklamēšanas diena",
                    country: "Latvia",
                    countryCode: "LV",
                    type: ["National holiday"],
                },
            ],
        };

        try {
            const { rerender } = render(
                <ActionButtons selectedYearDays={[]} viewMode="year" toggleMode={jest.fn()} />
            );

            rerender(
                <ActionButtons selectedYearDays={[dayWithHoliday]} viewMode="year" toggleMode={jest.fn()} />
            );

            await act(async () => {
                fireEvent.click(screen.getByText("Get notifications"));
                await Promise.resolve();
            });

            expect(registerSpy).toHaveBeenLastCalledWith(
                dayWithHoliday.events,
                false,
                expect.any(Function)
            );
        } finally {
            registerSpy.mockRestore();
            globalThis.ResizeObserver = OriginalResizeObserver;
        }
    });
});

describe("Service Worker (SW.ts)", () => {
    it("uses countryCodes & eventData[0].date on notificationclick, tracks active status with periodicSync, and formats notification title", async () => {
        const listeners: Record<string, (e: unknown) => void> = {};
        const openWindow = jest.fn().mockResolvedValue(undefined);
        const showNotification = jest.fn().mockResolvedValue(undefined);
        const clientPostMessage = jest.fn();
        const periodicRegister = jest.fn().mockResolvedValue(undefined);
        const periodicUnregister = jest.fn().mockResolvedValue(undefined);

        const g = globalThis as Record<string, unknown>;
        const prevSelf = g.self;

        g.self = {
            skipWaiting: jest.fn(),
            setInterval: globalThis.setInterval.bind(globalThis),
            addEventListener: (type: string, cb: (e: unknown) => void) => {
                listeners[type] = cb;
            },
            registration: {
                periodicSync: {
                    register: periodicRegister,
                    unregister: periodicUnregister,
                },
                showNotification,
            },
            clients: {
                claim: jest.fn(),
                matchAll: jest.fn().mockResolvedValue([{ postMessage: clientPostMessage }]),
                openWindow,
            },
        };

        try {
            await jest.isolateModulesAsync(async () => {
                await import("../assets/SW.ts");

                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const tomorrowString = tomorrow.toLocaleDateString("en-CA", {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                });

                const dtoList = [
                    {
                        date: tomorrowString,
                        name: "Test Holiday",
                        localName: "Test Holiday",
                        country: "Latvia",
                        countryCode: "LV",
                    },
                    {
                        date: tomorrowString,
                        name: "Another Holiday",
                        localName: "Another Holiday",
                        country: "Germany",
                        countryCode: "DE",
                    },
                ];

                // 1. Register notifications via periodicSync
                const waitPromises: Promise<unknown>[] = [];
                listeners["message"]({
                    data: { type: startNotificationsCommand, events: dtoList },
                    waitUntil: (p: Promise<unknown>) => waitPromises.push(p),
                });
                await Promise.all(waitPromises);
                expect(periodicRegister).toHaveBeenCalledWith("holiday-check", expect.any(Object));

                // 2. Check status: must be true even though periodicSync succeeded (interval === 0)
                listeners["message"]({ data: { type: getNotificationsStatusCommand } });
                await Promise.resolve();
                expect(clientPostMessage).toHaveBeenLastCalledWith({
                    type: notificationsWereSet,
                    status: true,
                });

                // 3. Trigger periodicsync to check notification title formatting
                const syncPromises: Promise<unknown>[] = [];
                listeners["periodicsync"]({
                    tag: "holiday-check",
                    waitUntil: (p: Promise<unknown>) => syncPromises.push(p),
                });
                await Promise.all(syncPromises);
                expect(showNotification).toHaveBeenCalledWith(
                    `It's a holiday tomorrow ${tomorrowString}! 🙌`,
                    expect.any(Object)
                );

                // 4. Trigger notificationclick
                const clickPromises: Promise<unknown>[] = [];
                listeners["notificationclick"]({
                    notification: { close: jest.fn(), data: dtoList },
                    waitUntil: (p: Promise<unknown>) => clickPromises.push(p),
                });
                await Promise.all(clickPromises);
                expect(openWindow).toHaveBeenCalledWith(
                    `/PublicHolidays/main/Holidays#countries=LV,DE&mode=month&date=${tomorrowString}`
                );

                // 5. Stop notifications and verify status becomes false
                const stopPromises: Promise<unknown>[] = [];
                listeners["message"]({
                    data: { type: stopNotificationsCommand },
                    waitUntil: (p: Promise<unknown>) => stopPromises.push(p),
                });
                await Promise.all(stopPromises);
                listeners["message"]({ data: { type: getNotificationsStatusCommand } });
                await Promise.resolve();
                expect(clientPostMessage).toHaveBeenLastCalledWith({
                    type: notificationsWereSet,
                    status: false,
                });
            });
        } finally {
            g.self = prevSelf;
        }
    });
});

describe("Performance & Bundle optimizations (Section 3)", () => {
    it("buildHolidaysIndex and getHolidaysForDate index by date and country in O(1) lookup", () => {
        const events: CalendarEvent[] = [
            {
                kind: "publicHoliday",
                date: "2025-01-01",
                name: "LV New Year",
                localName: "Jaunais gads",
                country: "Latvia",
                countryCode: "LV",
                type: ["National holiday"],
            },
            {
                kind: "publicHoliday",
                date: "2025-01-01",
                name: "DE New Year",
                localName: "Neujahr",
                country: "Germany",
                countryCode: "DE",
                type: ["National holiday"],
            },
            {
                kind: "publicHoliday",
                date: "2025-01-01",
                name: "Non-National Observance",
                localName: "Observance",
                country: "Latvia",
                countryCode: "LV",
                type: ["Observance"],
            },
            {
                kind: "other",
                date: "2025-01-01",
                name: "Custom Party",
                localName: "Custom Party",
                icon: "🎉",
            },
        ];

        const index = buildHolidaysIndex(events);
        const jan1 = new UTCDate("2025-01-01");

        // Returns other events first, then national holidays in selectedCountries order
        const result = getHolidaysForDate(jan1, index, ["DE", "LV"]);
        expect(result.map(e => e.name)).toEqual([
            "Custom Party",
            "DE New Year",
            "LV New Year",
        ]);

        // Unselected countries and non-national holidays are excluded
        const lvOnly = getHolidaysForDate(jan1, index, ["LV"]);
        expect(lvOnly.map(e => e.name)).toEqual(["Custom Party", "LV New Year"]);

        // Dates without events return empty array
        expect(getHolidaysForDate(new UTCDate("2025-01-02"), index, ["DE", "LV"])).toEqual([]);
    });

    it("useCalendar computes exact month grids (4, 5, and 6 weeks) and handles multi-country lookups fast", () => {
        const allEvents = convertEvents(Object.values(allHolidays));

        // 4-week month: Feb 2021 starts on Monday and has 28 days
        window.location.hash = "date=2021-02-01&countries=LV";
        const { result: feb2021 } = renderHook(() => useCalendar(allEvents));
        expect(feb2021.current.selectedMonthDays).toHaveLength(28);
        expect(feb2021.current.selectedMonthDays.every(d => d.isCurrentMonth)).toBe(true);

        // 5-week month: Jan 2025 starts on Wednesday (2 leading days + 31 + 2 trailing = 35)
        window.location.hash = "date=2025-01-01&countries=LV";
        const { result: jan2025 } = renderHook(() => useCalendar(allEvents));
        expect(jan2025.current.selectedMonthDays).toHaveLength(35);
        expect(jan2025.current.selectedMonthDays.every(d => d.isSideMonth || d.isCurrentMonth)).toBe(true);

        // 6-week month: June 2025 starts on Sunday (6 leading + 30 + 6 trailing = 42)
        window.location.hash = "date=2025-06-01&countries=LV,DE,US,GB,FR";
        const start = performance.now();
        const { result: jun2025 } = renderHook(() => useCalendar(allEvents));
        const elapsedMs = performance.now() - start;

        expect(jun2025.current.selectedMonthDays).toHaveLength(42);
        expect(jun2025.current.selectedYearDays).toHaveLength(373);
        expect(elapsedMs).toBeLessThan(1000);
        window.location.hash = "";
    });

    it("CalendarGrid YearView popup displays publicHoliday and other events via O(1) lookup", () => {
        const origScrollIntoView = HTMLElement.prototype.scrollIntoView;
        HTMLElement.prototype.scrollIntoView = jest.fn();

        const may1 = new UTCDate("2025-05-01");
        const selectedYearDays: CalendarDay[] = [
            {
                date: may1,
                dayNumber: 1,
                isSideMonth: false,
                isCurrentMonth: true,
                isCurrentYear: true,
                isToday: false,
                isWeekend: false,
                events: [
                    {
                        kind: "publicHoliday",
                        date: "2025-05-01",
                        name: "Labour Day",
                        localName: "Darba svētki",
                        country: "Latvia",
                        countryCode: "LV",
                        type: ["National holiday"],
                    },
                    {
                        kind: "other",
                        date: "2025-05-01",
                        name: "Spring Picnic",
                        localName: "Spring Picnic",
                        icon: "🧺",
                    },
                ],
            },
        ];

        try {
            render(
                <CalendarGrid
                    selectedYearDays={selectedYearDays}
                    selectedMonthDays={[]}
                    currentDate={may1}
                    mode="year"
                    countryData={{}}
                    onModeChange={jest.fn()}
                />
            );

            fireEvent.click(screen.getByText("🇱🇻").closest("[data-month=\"5\"]")!);

            expect(screen.getByText("Events on 2025-05-01")).toBeInTheDocument();
            expect(screen.getByText("Labour Day")).toBeInTheDocument();
            expect(screen.getByText("Spring Picnic")).toBeInTheDocument();
        } finally {
            HTMLElement.prototype.scrollIntoView = origScrollIntoView;
        }
    });

    it("Holidays loads allHolidays from index and switches countries cleanly", async () => {
        const origScrollIntoView = HTMLElement.prototype.scrollIntoView;
        HTMLElement.prototype.scrollIntoView = jest.fn();
        const origResizeObserver = globalThis.ResizeObserver;
        globalThis.ResizeObserver = jest.fn().mockImplementation(() => ({
            observe: jest.fn(),
            unobserve: jest.fn(),
            disconnect: jest.fn(),
        }));

        window.location.hash = "date=2025-01-01&countries=LV";

        try {
            render(<Holidays />);

            // Initially loads allHolidays and displays Latvia ("LV")
            await waitFor(() => {
                expect(screen.getAllByText("New Year's Day").length).toBeGreaterThan(0);
            });
            expect(screen.queryByText("Day of German Unity")).not.toBeInTheDocument();

            // Add Germany via hashchange
            await act(async () => {
                window.location.hash = "date=2025-01-01&countries=LV,DE";
                window.dispatchEvent(new HashChangeEvent("hashchange"));
            });

            await waitFor(() => {
                expect(screen.getAllByText("Day of German Unity").length).toBeGreaterThan(0);
            });
            expect(screen.getAllByText("Republic of Latvia Proclamation Day")).toHaveLength(1);

            // Switch to Germany only
            await act(async () => {
                window.location.hash = "date=2025-01-01&countries=DE";
                window.dispatchEvent(new HashChangeEvent("hashchange"));
            });

            await waitFor(() => {
                expect(screen.queryByText("Republic of Latvia Proclamation Day")).not.toBeInTheDocument();
            });
            expect(screen.getAllByText("Day of German Unity").length).toBeGreaterThan(0);
        } finally {
            window.location.hash = "";
            HTMLElement.prototype.scrollIntoView = origScrollIntoView;
            globalThis.ResizeObserver = origResizeObserver;
        }
    });

    it("transformNationalHolidays filters country holiday files to only National holiday entries", () => {
        const sampleModule = [
            "import type { CountryHolidays } from \"./types\";",
            "",
            "export const holidays_US: CountryHolidays = {",
            "    countryCode: \"US\",",
            "    countryName: \"United States\",",
            "    holidays: [",
            "        {",
            "            \"date\": \"2025-01-01\",",
            "            \"localName\": \"New Year's Day\",",
            "            \"name\": \"New Year's Day\",",
            "            \"type\": [\"National holiday\"]",
            "        },",
            "        {",
            "            \"date\": \"2025-01-01\",",
            "            \"localName\": \"Local New Year\",",
            "            \"name\": \"Local New Year\",",
            "            \"type\": [\"Local holiday\"]",
            "        },",
            "        {",
            "            \"date\": \"2025-12-25\",",
            "            \"localName\": \"Christmas $100\",",
            "            \"name\": \"Christmas Day\",",
            "            \"type\": [\"National holiday\", \"Christian\"]",
            "        },",
            "        {",
            "            \"date\": \"2025-02-14\",",
            "            \"localName\": \"Valentine's Day\",",
            "            \"name\": \"Valentine's Day\"",
            "        }",
            "    ]",
            "} as const;",
        ].join("\n");

        // Ignores non-country files
        expect(transformNationalHolidays(sampleModule, "/app/src/data/holidays_v2/index.ts")).toBeNull();
        expect(transformNationalHolidays(sampleModule, "/app/src/data/holidays_v2/types.ts")).toBeNull();
        expect(transformNationalHolidays(sampleModule, "/app/src/utils/other.ts")).toBeNull();

        // Filters POSIX and Windows country file paths
        const posixResult = transformNationalHolidays(sampleModule, "/app/src/data/holidays_v2/US.ts");
        expect(posixResult).not.toBeNull();
        expect(posixResult?.map).toBeNull();
        expect(posixResult?.code).toContain("\"New Year's Day\"");
        expect(posixResult?.code).toContain("\"Christmas $100\"");
        expect(posixResult?.code).not.toContain("\"Local New Year\"");
        expect(posixResult?.code).not.toContain("\"Valentine's Day\"");
        expect(posixResult?.code).toMatch(/\} as const;$/);

        const winResult = transformNationalHolidays(sampleModule, "C:\\repo\\src\\data\\holidays_v2\\US.ts");
        expect(winResult).toEqual(posixResult);
    });
});
