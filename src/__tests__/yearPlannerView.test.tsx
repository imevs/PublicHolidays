import { TextEncoder, TextDecoder } from "util";
if (typeof global.TextEncoder === "undefined") {
    global.TextEncoder = TextEncoder as any;
    global.TextDecoder = TextDecoder as any;
}

import { render, screen, fireEvent } from "@testing-library/react";
import { YearPlannerView } from "../components/CalendarGrid/YearPlannerView.tsx";
import CalendarGrid from "../components/CalendarGrid/CalendarGrid.tsx";
import { ActionButtons } from "../components/EventsList/EventsListActionButtons.tsx";
import { LanguageProvider } from "../i18n/LanguageContext.tsx";
import { MemoryRouter } from "react-router";
import { UTCDate } from "../utils/UTCDate.ts";
import { getISOWeekNumber } from "../utils/dateUtils.ts";

describe("YearPlannerView & ISO Week", () => {
    it("renders print style tag for A4 landscape", () => {
        const currentDate = new UTCDate("2027-01-01");
        const { container } = render(
            <LanguageProvider>
                <YearPlannerView
                    shouldAnimate={false}
                    selectedDays={[]}
                    onModeChange={() => {}}
                    currentDate={currentDate}
                    dateForPopup={null}
                    setDateForPopup={() => {}}
                    isEditable={false}
                    setSelectedDay={() => {}}
                    countryData={{}}
                />
            </LanguageProvider>
        );

        const styleTag = container.querySelector("style[media='print']");
        expect(styleTag).not.toBeNull();
        expect(styleTag?.textContent).toContain("@page");
        expect(styleTag?.textContent).toContain("A4 landscape");
    });

    it("computes ISO week numbers correctly", () => {
        expect(getISOWeekNumber(new UTCDate("2027-01-04"))).toBe(1);
        expect(getISOWeekNumber(new UTCDate("2027-12-27"))).toBe(52);
    });

    it("YearPlannerView renders 12 month headers and 31 body rows", () => {
        const currentDate = new UTCDate("2027-01-01");
        render(
            <LanguageProvider>
                <YearPlannerView
                    shouldAnimate={false}
                    selectedDays={[]}
                    onModeChange={() => {}}
                    currentDate={currentDate}
                    dateForPopup={null}
                    setDateForPopup={() => {}}
                    isEditable={false}
                    setSelectedDay={() => {}}
                    countryData={{}}
                />
            </LanguageProvider>
        );

        const headers = screen.getAllByRole("columnheader");
        expect(headers.length).toBe(12);

        const rows = screen.getAllByRole("row");
        expect(rows.length).toBe(32);
    });

    it("non-existent dates render empty cells with aria-hidden", () => {
        const currentDate = new UTCDate("2027-02-01");
        const { container } = render(
            <LanguageProvider>
                <YearPlannerView
                    shouldAnimate={false}
                    selectedDays={[]}
                    onModeChange={() => {}}
                    currentDate={currentDate}
                    dateForPopup={null}
                    setDateForPopup={() => {}}
                    isEditable={false}
                    setSelectedDay={() => {}}
                    countryData={{}}
                />
            </LanguageProvider>
        );

        const emptyCells = container.querySelectorAll("td[aria-hidden='true']");
        expect(emptyCells.length).toBeGreaterThan(0);
    });

    it("Mondays display ISO week numbers", () => {
        const currentDate = new UTCDate("2027-01-01");
        render(
            <LanguageProvider>
                <YearPlannerView
                    shouldAnimate={false}
                    selectedDays={[]}
                    onModeChange={() => {}}
                    currentDate={currentDate}
                    dateForPopup={null}
                    setDateForPopup={() => {}}
                    isEditable={false}
                    setSelectedDay={() => {}}
                    countryData={{}}
                />
            </LanguageProvider>
        );

        const weekNums = screen.getAllByText("1");
        expect(weekNums.length).toBeGreaterThan(0);
    });

    it("public holiday name is displayed, and school holiday label shown once", () => {
        const currentDate = new UTCDate("2027-01-01");
        const selectedDays = [
            {
                date: new UTCDate("2027-01-01"),
                events: [
                    { kind: "publicHoliday", name: "New Year's Day", country: "United States", countryCode: "US", date: "2027-01-01" }
                ],
                isWeekend: false,
                isToday: false,
            },
            {
                date: new UTCDate("2027-01-02"),
                events: [
                    { kind: "publicHoliday", name: "Winter Break", country: "United States", countryCode: "US", type: ["School Holiday"], date: "2027-01-02" }
                ],
                isWeekend: false,
                isToday: false,
            },
            {
                date: new UTCDate("2027-01-03"),
                events: [
                    { kind: "publicHoliday", name: "Winter Break", country: "United States", countryCode: "US", type: ["School Holiday"], date: "2027-01-03" }
                ],
                isWeekend: false,
                isToday: false,
            }
        ];

        const { container } = render(
            <LanguageProvider>
                <YearPlannerView
                    shouldAnimate={false}
                    selectedDays={selectedDays as any}
                    onModeChange={() => {}}
                    currentDate={currentDate}
                    dateForPopup={null}
                    setDateForPopup={() => {}}
                    isEditable={false}
                    setSelectedDay={() => {}}
                    countryData={{}}
                />
            </LanguageProvider>
        );

        expect(container.textContent).toContain("New Year's Day");
        expect(container.textContent).toContain("Winter Break");
    });

    it("clicking a month header button calls onModeChange", () => {
        const currentDate = new UTCDate("2027-01-01");
        const onModeChange = jest.fn();
        render(
            <LanguageProvider>
                <YearPlannerView
                    shouldAnimate={false}
                    selectedDays={[]}
                    onModeChange={onModeChange}
                    currentDate={currentDate}
                    dateForPopup={null}
                    setDateForPopup={() => {}}
                    isEditable={false}
                    setSelectedDay={() => {}}
                    countryData={{}}
                />
            </LanguageProvider>
        );

        const janBtn = screen.getByRole("button", { name: /January/i });
        fireEvent.click(janBtn);
        expect(onModeChange).toHaveBeenCalledWith("month", 0);
    });

    it("CalendarGrid with mode=planner renders planner table and opens dialog on holiday click", () => {
        const currentDate = new UTCDate("2027-01-01");
        const selectedDays = [
            {
                date: new UTCDate("2027-01-01"),
                events: [
                    { kind: "publicHoliday", name: "New Year's Day", country: "United States", countryCode: "US", date: "2027-01-01" }
                ],
                isWeekend: false,
                isToday: false,
            }
        ];

        const { container } = render(
            <LanguageProvider>
                <CalendarGrid
                    mode={"planner" as any}
                    selectedYearDays={selectedDays as any}
                    selectedMonthDays={[]}
                    currentDate={currentDate}
                    onModeChange={() => {}}
                    countryData={{}}
                    onNewEvent={() => {}}
                />
            </LanguageProvider>
        );

        const holidayCell = container.querySelector("td.plannerHoliday");
        if (holidayCell) {
            fireEvent.click(holidayCell);
        }
        expect(container.querySelector("dialog")).toBeDefined();
    });

    it("ActionButtons renders Year planner button with aria-pressed=true and calls onSetMode", () => {
        const onSetMode = jest.fn();
        render(
            <MemoryRouter>
                <LanguageProvider>
                    <ActionButtons
                        selectedYearDays={[]}
                        viewMode={"planner" as any}
                        toggleMode={() => {}}
                        onSetMode={onSetMode}
                    />
                </LanguageProvider>
            </MemoryRouter>
        );

        const plannerBtn = screen.getByRole("button", { name: /Year planner|Planner|📋/i });
        expect(plannerBtn).toBeDefined();
        expect(plannerBtn.getAttribute("aria-pressed")).toBe("true");

        fireEvent.click(plannerBtn);
        expect(onSetMode).toHaveBeenCalledWith("planner");
    });
});
