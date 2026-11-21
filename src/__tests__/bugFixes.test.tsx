import { render, screen, fireEvent, act, renderHook, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

let mockSearchParams = new URLSearchParams();
jest.mock("react-router", () => ({
    useNavigate: () => jest.fn(),
    useSearchParams: () => [mockSearchParams],
}));
jest.mock("../components/CalendarGrid/UsePrevious.tsx", () => ({
    usePrevious: () => null,
}));

import { countryTimeZones, countryOffsets, getLocalTime } from "../utils/timeZones.ts";
import { countryNames, type CountryCode } from "../data/countryNames.ts";
import { getLink } from "../data/holidays_descriptions/getLink.ts";
import { descriptions } from "../data/holidays_descriptions/all.ts";
import CalendarGrid from "../components/CalendarGrid/CalendarGrid.tsx";
import CalendarDayComponent from "../components/CalendarDay/CalendarDay.tsx";
import Controls from "../components/Controls/Controls.tsx";
import CountryFilter from "../components/CountryFilter/CountryFilter.tsx";
import EventPopup from "../components/EventPopup/EventPopup.tsx";
import MonthNavigation from "../components/MonthNavigation/MonthNavigation.tsx";
import { generateYears } from "../utils/dateUtils.ts";
import { EventListInput } from "../components/EventListInput/EventListInput.tsx";
import { EventListInputButtons } from "../components/EventListInput/EventListInputButtons.tsx";
import { ActionButtons } from "../components/EventsList/EventsListActionButtons.tsx";
import * as generateICSModule from "../utils/generateICS.ts";
import { UTCDate } from "../utils/UTCDate.ts";
import type { CalendarDay, CalendarEvent } from "../types/index.ts";
import { buildHolidaysIndex, getHolidaysForDate, useCalendar } from "../hooks/useCalendar.ts";
import { allHolidays } from "../data/holidays_v2/index.ts";
import { convertEvents } from "../utils/convertEvents.ts";
import { transformNationalHolidays } from "../utils/filterNationalHolidays.cjs";
import { Holidays } from "../Holidays.tsx";
import { AnyEvents } from "../AnyEvents.tsx";
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

    it("ActionButtons Subscribe / Add to Calendar reads latest selectedYearDays and exports ICS with reminders", async () => {
        const OriginalResizeObserver = globalThis.ResizeObserver;
        globalThis.ResizeObserver = jest.fn().mockImplementation(() => ({
            observe: jest.fn(),
            unobserve: jest.fn(),
            disconnect: jest.fn(),
        }));
        const exportSpy = jest.spyOn(generateICSModule, "exportCalendarToFile").mockImplementation(() => {});

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

            fireEvent.click(screen.getByRole("button", { name: /Subscribe \/ Add to Calendar/i }));
            expect(screen.getByRole("dialog")).toBeInTheDocument();
            expect(screen.getByText(/Proclamation Day/)).toBeInTheDocument();

            fireEvent.click(screen.getByRole("button", { name: /Download \.ics for Calendar Import/i }));

            expect(exportSpy).toHaveBeenLastCalledWith(
                dayWithHoliday.events,
                "Latvia_calendar",
                { includeAlarm: true }
            );
        } finally {
            exportSpy.mockRestore();
            globalThis.ResizeObserver = OriginalResizeObserver;
        }
    });

    it("supports direct edit and delete of custom events from the Day Popup and unified navigation in AnyEvents", () => {
        const origScrollIntoView = HTMLElement.prototype.scrollIntoView;
        HTMLElement.prototype.scrollIntoView = jest.fn();
        const OriginalResizeObserver = globalThis.ResizeObserver;
        globalThis.ResizeObserver = jest.fn().mockImplementation(() => ({
            observe: jest.fn(),
            unobserve: jest.fn(),
            disconnect: jest.fn(),
        }));

        localStorage.setItem("calendar_data", "2025-09-10 🎂 Birthday of Joe");
        window.location.hash = "date=2025-09-01&mode=year";

        try {
            render(<AnyEvents />);
            expect(document.title).toBe("Events Calendar 2025");

            // Unified primary navigation is present with aria-current="page" on Custom Events
            const customNav = screen.getByRole("link", { name: /Custom Events/i });
            expect(customNav).toHaveAttribute("aria-current", "page");

            // Toolbar view mode group is present in AnyEvents too
            expect(screen.getByRole("toolbar", { name: "Calendar actions" })).toBeInTheDocument();

            // Click Sept 10 in YearView to open the day popup
            const sept10Cell = screen.getAllByText("🎂")[0].closest("[data-month=\"9\"]")!;
            fireEvent.click(sept10Cell);

            expect(screen.getByText("Events on 2025-09-10")).toBeInTheDocument();

            // Click Edit on Birthday of Joe
            fireEvent.click(screen.getByRole("button", { name: "Edit Birthday of Joe" }));
            const nameInput = screen.getByLabelText("Name") as HTMLInputElement;
            expect(nameInput.value).toBe("🎂 Birthday of Joe");

            fireEvent.change(nameInput, { target: { value: "🎂 Birthday of Jane" } });
            fireEvent.click(screen.getByRole("button", { name: "Save (Enter)" }));

            expect((screen.getByLabelText(/Calendar events/i) as HTMLTextAreaElement).value).toContain("Birthday of Jane");

            // Re-open Sept 10 popup and delete the event
            const updatedCell = screen.getAllByText("🎂")[0].closest("[data-month=\"9\"]")!;
            fireEvent.click(updatedCell);
            fireEvent.click(screen.getByRole("button", { name: "Delete Birthday of Jane" }));

            expect((screen.getByLabelText(/Calendar events/i) as HTMLTextAreaElement).value).not.toContain("Birthday of Jane");
        } finally {
            window.location.hash = "";
            localStorage.removeItem("calendar_data");
            HTMLElement.prototype.scrollIntoView = origScrollIntoView;
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
                    `/PublicHolidays/Holidays#countries=LV,DE&mode=month&date=${tomorrowString}`
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

describe("UI, Accessibility & Year Range Fixes", () => {
    it("generateYears expands to include selectedYear outside currentYear ± 1 while keeping default 3-year output", () => {
        const currentYear = new UTCDate().getFullYear();
        expect(generateYears()).toEqual([currentYear - 1, currentYear, currentYear + 1]);

        const pastYears = generateYears(2020);
        expect(pastYears[0]).toBe(2020);
        expect(pastYears).toContain(currentYear + 1);

        const futureYears = generateYears(2030);
        expect(futureYears[0]).toBe(currentYear - 1);
        expect(futureYears[futureYears.length - 1]).toBe(2030);
    });

    it("Controls renders matching select option when selectedDate is in 2020 or 2030", () => {
        const { rerender } = render(
            <Controls
                selectedDate={new UTCDate("2020-05-01")}
                onDateChange={jest.fn()}
                onNavigateMonth={jest.fn()}
            />
        );
        const selects = screen.getAllByRole("combobox");
        const yearSelect = selects[0] as HTMLSelectElement;
        expect(yearSelect.value).toBe("2020");
        expect(screen.getByRole("option", { name: "2020" })).toBeInTheDocument();

        rerender(
            <Controls
                selectedDate={new UTCDate("2030-05-01")}
                onDateChange={jest.fn()}
                onNavigateMonth={jest.fn()}
            />
        );
        expect((screen.getAllByRole("combobox")[0] as HTMLSelectElement).value).toBe("2030");
        expect(screen.getByRole("option", { name: "2030" })).toBeInTheDocument();
    });

    it("CountryFilter chips and toggle support keyboard activation and aria-pressed", async () => {
        const onToggleCountry = jest.fn();
        const setShowAllCountries = jest.fn();
        render(
            <CountryFilter
                selectedCountries={["LV"]}
                onToggleCountry={onToggleCountry}
                showAllCountries={true}
                setShowAllCountries={setShowAllCountries}
                setShowAllHolidays={jest.fn()}
            />
        );

        const lvChip = await screen.findByRole("button", { name: /Latvia/ });
        const deChip = await screen.findByRole("button", { name: /Germany/ });
        expect(lvChip).toHaveAttribute("tabindex", "0");
        expect(lvChip).toHaveAttribute("aria-pressed", "true");
        expect(deChip).toHaveAttribute("aria-pressed", "false");

        fireEvent.keyDown(lvChip, { key: "Enter" });
        expect(onToggleCountry).toHaveBeenCalledWith("LV");

        fireEvent.keyDown(deChip, { key: " " });
        expect(onToggleCountry).toHaveBeenCalledWith("DE");

        const toggleBtn = screen.getByRole("button", { name: "Hide inactive" });
        expect(toggleBtn).toHaveAttribute("tabindex", "0");
        fireEvent.keyDown(toggleBtn, { key: "Enter" });
        expect(setShowAllCountries).toHaveBeenCalledWith(false);
        fireEvent.keyDown(toggleBtn, { key: " " });
        expect(setShowAllCountries).toHaveBeenCalledTimes(2);
    });

    it("CountryFilter defaults to Europe, shows continent tags, and allows switching continents", async () => {
        render(
            <CountryFilter
                selectedCountries={["LV", "CN"]}
                onToggleCountry={jest.fn()}
                showAllCountries={true}
                setShowAllCountries={jest.fn()}
                setShowAllHolidays={jest.fn()}
            />
        );

        // Europe default expansion
        const lvChip = await screen.findByRole("button", { name: /Latvia/ });
        expect(lvChip).toBeInTheDocument();

        // Asia continent tag with badge for selected CN
        const asiaTag = screen.getByText(/Asia/);
        expect(asiaTag).toBeInTheDocument();
        expect(screen.getByText("1")).toBeInTheDocument();

        // Click Asia tag
        fireEvent.click(asiaTag);
        const chinaChip = await screen.findByRole("button", { name: /China/ });
        expect(chinaChip).toBeInTheDocument();
    });

    it("MonthNavigation heading supports keyboard activation with Enter and Space", () => {
        const onNavigateYear = jest.fn();
        render(
            <MonthNavigation
                currentDate={new UTCDate("2025-05-01")}
                onNavigateYear={onNavigateYear}
            />
        );

        const heading = screen.getByRole("button", { name: "May 2025" });
        expect(heading).toHaveAttribute("tabindex", "0");
        fireEvent.keyDown(heading, { key: "Enter" });
        fireEvent.keyDown(heading, { key: " " });
        expect(onNavigateYear).toHaveBeenCalledTimes(2);
    });

    it("CalendarDay supports keyboard activation only when editable and target is the cell", () => {
        const setDateForPopup = jest.fn();
        const day: CalendarDay = {
            dayNumber: 15,
            isCurrentMonth: true,
            isSideMonth: false,
            isCurrentYear: true,
            isWeekend: false,
            isToday: false,
            events: [
                {
                    kind: "publicHoliday",
                    type: ["National holiday"],
                    name: "Test Holiday",
                    localName: "Test Holiday",
                    date: "2025-05-15",
                    country: "Latvia",
                    countryCode: "LV",
                },
            ],
            date: new UTCDate("2025-05-15"),
        };

        const { container, rerender } = render(
            <CalendarDayComponent
                day={day}
                isEditable={false}
                countryData={{}}
                setDateForPopup={setDateForPopup}
            />
        );
        const dayEl = container.querySelector("[data-month=\"5\"]")!;
        expect(dayEl).not.toHaveAttribute("role", "button");
        expect(dayEl).not.toHaveAttribute("tabindex");

        rerender(
            <CalendarDayComponent
                day={day}
                isEditable={true}
                countryData={{}}
                setDateForPopup={setDateForPopup}
            />
        );
        expect(dayEl).toHaveAttribute("role", "button");
        expect(dayEl).toHaveAttribute("tabindex", "0");

        // Pressing Enter on child element must not trigger setDateForPopup
        const childEvent = screen.getByText(/Test Holiday/);
        fireEvent.keyDown(childEvent, { key: "Enter" });
        expect(setDateForPopup).not.toHaveBeenCalled();

        // Pressing Enter and Space directly on the day cell triggers setDateForPopup
        fireEvent.keyDown(dayEl, { key: "Enter" });
        fireEvent.keyDown(dayEl, { key: " " });
        expect(setDateForPopup).toHaveBeenCalledTimes(2);
        expect(setDateForPopup).toHaveBeenCalledWith(day.date);
    });

    it("CalendarGrid YearView month headers and clickable day cells support keyboard activation", () => {
        const origScrollIntoView = HTMLElement.prototype.scrollIntoView;
        HTMLElement.prototype.scrollIntoView = jest.fn();
        const onModeChange = jest.fn();
        const holidayDay: CalendarDay = {
            dayNumber: 1,
            isCurrentMonth: true,
            isSideMonth: false,
            isCurrentYear: true,
            isWeekend: false,
            isToday: false,
            events: [
                {
                    kind: "publicHoliday",
                    type: ["National holiday"],
                    name: "Labour Day",
                    localName: "Darba svētki",
                    date: "2025-05-01",
                    country: "Latvia",
                    countryCode: "LV",
                },
            ],
            date: new UTCDate("2025-05-01"),
        };

        try {
            const { container } = render(
                <CalendarGrid
                    selectedYearDays={[holidayDay]}
                    selectedMonthDays={[holidayDay]}
                    currentDate={new UTCDate("2025-05-01")}
                    mode="year"
                    countryData={{}}
                    onModeChange={onModeChange}
                />
            );

            const mayHeader = screen.getByRole("button", { name: "May" });
            expect(mayHeader).toHaveAttribute("tabindex", "0");
            fireEvent.keyDown(mayHeader, { key: "Enter" });
            expect(onModeChange).toHaveBeenCalledWith("month", 4);
            fireEvent.keyDown(mayHeader, { key: " " });
            expect(onModeChange).toHaveBeenCalledTimes(2);

            const mayFirstCell = screen.getByText("🇱🇻").closest("[data-month=\"5\"]")!;
            expect(mayFirstCell).toHaveAttribute("role", "button");
            expect(mayFirstCell).toHaveAttribute("tabindex", "0");

            const nonHolidayCell = container.querySelectorAll("[data-month=\"5\"]")[1];
            expect(nonHolidayCell).not.toHaveAttribute("role", "button");
            expect(nonHolidayCell).not.toHaveAttribute("tabindex");

            fireEvent.keyDown(mayFirstCell, { key: "Enter" });
            expect(screen.getByText("Events on 2025-05-01")).toBeInTheDocument();
        } finally {
            HTMLElement.prototype.scrollIntoView = origScrollIntoView;
        }
    });

    it("EventPopup emoji spans support Enter and Space selection without submitting the form", () => {
        const onNewEvent = jest.fn();
        render(<EventPopup initialDate="2025-05-15" onNewEvent={onNewEvent} />);

        const input = screen.getByLabelText("Name") as HTMLInputElement;
        fireEvent.change(input, { target: { value: "Party" } });

        const giftEmoji = screen.getByRole("button", { name: "🎁" });
        expect(giftEmoji).toHaveAttribute("tabindex", "0");
        fireEvent.keyDown(giftEmoji, { key: "Enter" });

        expect(input.value).toBe("🎁 Party");
        expect(onNewEvent).not.toHaveBeenCalled();

        const fireEmoji = screen.getByRole("button", { name: "🔥" });
        fireEvent.keyDown(fireEmoji, { key: " " });

        expect(input.value).toBe("🔥 Party");
        expect(onNewEvent).not.toHaveBeenCalled();

        fireEvent.keyDown(input, { key: "Enter" });
        expect(onNewEvent).toHaveBeenCalledWith({
            date: "05-15",
            name: "Party",
            icon: "🔥",
            localName: "",
            kind: "other",
        });
    });
});

describe("External ICS loader & URL handling (Item 3.1)", () => {
    const origFetch = globalThis.fetch;

    afterEach(() => {
        globalThis.fetch = origFetch;
        mockSearchParams = new URLSearchParams();
        window.location.hash = "";
        jest.restoreAllMocks();
    });

    it("does not append calendar state hash params to ?ics= URL and ignores HTTP error / non-ICS responses", async () => {
        mockSearchParams = new URLSearchParams("ics=https://example.com/cal.ics");
        window.location.hash = "#date=2025-01-01&mode=year&countries=LV";

        const fetchMock = jest.fn().mockResolvedValue({
            ok: false,
            status: 502,
            text: async () => "Bad Gateway",
        });
        globalThis.fetch = fetchMock as unknown as typeof fetch;
        const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

        const setDataText = jest.fn();
        const setHolidaysData = jest.fn();

        render(
            <EventListInputButtons
                setDataText={setDataText}
                setHolidaysData={setHolidaysData}
            />
        );

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        expect(fetchMock).toHaveBeenCalledWith(
            "https://api.codetabs.com/v1/proxy/?quest=" + encodeURIComponent("https://example.com/cal.ics")
        );
        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(setHolidaysData).not.toHaveBeenCalled();
        expect(setDataText).not.toHaveBeenCalled();
    });

    it("ignores 200 OK non-ICS payload without wiping existing events and updates when valid VCALENDAR arrives", async () => {
        const setDataText = jest.fn();
        const setHolidaysData = jest.fn();

        const fetchMock = jest.fn()
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                text: async () => "<html><body>Not an ICS file</body></html>",
            })
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                text: async () => [
                    "BEGIN:VCALENDAR",
                    "BEGIN:VEVENT",
                    "DTSTART;TZID=Europe/Riga;VALUE=DATE:20251118",
                    "SUMMARY:Proclamation Day",
                    "END:VEVENT",
                    "END:VCALENDAR",
                ].join("\r\n"),
            });
        globalThis.fetch = fetchMock as unknown as typeof fetch;

        render(
            <EventListInputButtons
                setDataText={setDataText}
                setHolidaysData={setHolidaysData}
            />
        );

        fireEvent.click(screen.getByRole("button", { name: /Import ▾/i }));
        fireEvent.click(screen.getByRole("menuitem", { name: /Load \.ics from link/i }));

        const urlInput = screen.getByPlaceholderText("Add link to .ICS file");
        fireEvent.change(urlInput, { target: { value: "https://example.com/bad.html" } });

        fireEvent.click(screen.getByRole("button", { name: "Load ICS" }));
        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });
        expect(setHolidaysData).not.toHaveBeenCalled();
        expect(setDataText).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole("button", { name: /Import ▾/i }));
        fireEvent.click(screen.getByRole("menuitem", { name: /Load \.ics from link/i }));

        const urlInput2 = screen.getByPlaceholderText("Add link to .ICS file");
        fireEvent.change(urlInput2, { target: { value: "https://example.com/good.ics" } });
        fireEvent.click(screen.getByRole("button", { name: "Load ICS" }));
        await waitFor(() => {
            expect(setHolidaysData).toHaveBeenCalledTimes(1);
        });
        expect(setHolidaysData).toHaveBeenCalledWith([
            expect.objectContaining({
                date: "2025-11-18",
                name: "Proclamation Day",
                kind: "publicHoliday",
                countryCode: "LV",
                country: "Latvia",
            }),
        ]);
        expect(setDataText).toHaveBeenCalledWith("2025-11-18 🇱🇻 Proclamation Day");
    });

    it("preserves non-calendar hash fragments for ?ics= URLs", async () => {
        mockSearchParams = new URLSearchParams("ics=https://example.com/cal.ics");
        window.location.hash = "#team-events";

        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            text: async () => "<html>not ics</html>",
        });
        globalThis.fetch = fetchMock as unknown as typeof fetch;

        render(
            <EventListInputButtons
                setDataText={jest.fn()}
                setHolidaysData={jest.fn()}
            />
        );

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        expect(fetchMock).toHaveBeenCalledWith(
            "https://api.codetabs.com/v1/proxy/?quest=" + encodeURIComponent("https://example.com/cal.ics%23team-events")
        );
    });
});
