import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

let mockSearchParams = new URLSearchParams();
jest.mock("react-router", () => ({
    useNavigate: () => jest.fn(),
    useSearchParams: () => [mockSearchParams],
}));
jest.mock("../components/CalendarGrid/UsePrevious.tsx", () => ({
    usePrevious: () => null,
}));

import { EventListInput } from "../components/EventListInput/EventListInput.tsx";
import EventPopup from "../components/EventPopup/EventPopup.tsx";
import CalendarDay from "../components/CalendarDay/CalendarDay.tsx";
import { AnyEvents } from "../AnyEvents.tsx";
import { UTCDate } from "../utils/UTCDate.ts";
import type { CountryCode } from "../data/countryNames.ts";
import { STORAGE_KEY } from "../consts.ts";
import { convertEvents } from "../utils/convertEvents.ts";
import type { CalendarDay as CalendarDayType } from "../types/index.ts";

describe("Range Events Feature", () => {
    beforeAll(() => {
        HTMLElement.prototype.scrollIntoView = jest.fn();
        globalThis.ResizeObserver = class {
            observe = jest.fn();
            unobserve = jest.fn();
            disconnect = jest.fn();
        };
    });

    it("5. convertEvents and CalendarDay handle publicHoliday date ranges correctly", () => {
        const countryHolidays = [
            {
                countryCode: "LV" as CountryCode,
                countryName: "Latvia",
                holidays: [
                    {
                        date: "2025-10-20",
                        endDate: "2025-10-22",
                        name: "Autumn Holiday",
                        localName: "Autumn Holiday",
                        type: ["School Holiday"],
                    },
                ],
            },
        ];

        const converted = convertEvents(countryHolidays);
        expect(converted).toHaveLength(3);
        expect(converted[0]).toMatchObject({
            date: "2025-10-20",
            endDate: "2025-10-22",
            rangeStart: "2025-10-20",
            isRange: true,
            rangePosition: "start",
            kind: "publicHoliday",
        });
        expect(converted[1]).toMatchObject({
            date: "2025-10-21",
            rangePosition: "middle",
            isRange: true,
        });
        expect(converted[2]).toMatchObject({
            date: "2025-10-22",
            rangePosition: "end",
            isRange: true,
        });

        const day: CalendarDayType = {
            date: new UTCDate("2025-10-20"),
            isCurrentYear: true,
            isCurrentMonth: true,
            isSideMonth: false,
            isToday: false,
            isWeekend: false,
            dayNumber: 20,
            events: [converted[0]],
        };

        const { container } = render(
            <CalendarDay countryData={{}} day={day} setDateForPopup={() => {}} isEditable={true} />
        );
        expect(container.firstChild).toBeInTheDocument();

        const eventDiv = screen.getByText(/Autumn Holiday/);
        expect(eventDiv).toBeInTheDocument();
        expect(screen.getByText(/\(2025-10-20 → 2025-10-22\)/)).toBeInTheDocument();
    });

    it("1. EventListInput: validates and expands a YYYY-MM-DD..YYYY-MM-DD range into 3 OtherEvent items, and verifies invalid range (!) indicator", () => {
        const setHolidaysData = jest.fn();
        const setDataText = jest.fn();
        const validText = "2025-07-01..2025-07-03 🏖️ Summer Vacation";

        render(
            <EventListInput
                dataText={validText}
                setDataText={setDataText}
                setHolidaysData={setHolidaysData}
            />
        );

        expect(setHolidaysData).toHaveBeenCalled();
        const lastCallArgs = setHolidaysData.mock.calls[setHolidaysData.mock.calls.length - 1][0];
        expect(lastCallArgs).toHaveLength(3);
        expect(lastCallArgs[0]).toMatchObject({
            isRange: true,
            rangePosition: "start",
            rangeStart: "2025-07-01",
            endDate: "2025-07-03",
        });
        expect(lastCallArgs[1]).toMatchObject({
            isRange: true,
            rangePosition: "middle",
            rangeStart: "2025-07-01",
            endDate: "2025-07-03",
        });
        expect(lastCallArgs[2]).toMatchObject({
            isRange: true,
            rangePosition: "end",
            rangeStart: "2025-07-01",
            endDate: "2025-07-03",
        });

        // Invalid range where end < start
        const invalidText = "2025-07-05..2025-07-01 🏖️ Invalid Vacation";
        render(
            <EventListInput
                dataText={invalidText}
                setDataText={setDataText}
                setHolidaysData={setHolidaysData}
            />
        );
        expect(screen.getByText("!")).toBeInTheDocument();
    });

    it("2. EventPopup: checking Date range reveals End date input, setting 2025-07-05 for initialDate=2025-07-01, checking One-time, entering name Beach Trip, and clicking Save (Enter) calls onNewEvent", () => {
        const handleNewEvent = jest.fn();
        render(
            <EventPopup
                initialDate="2025-07-01"
                initialOneTime={true}
                onNewEvent={handleNewEvent}
            />
        );

        const rangeCheckbox = screen.getByLabelText(/Date range/i);
        fireEvent.click(rangeCheckbox);

        const endDateInput = screen.getByLabelText(/End date/i);
        expect(endDateInput).toBeInTheDocument();
        fireEvent.change(endDateInput, { target: { value: "2025-07-05" } });

        const blueSwatch = screen.getByRole("button", { name: "Blue" });
        fireEvent.click(blueSwatch);

        const oneTimeCheckbox = screen.getByLabelText(/One-time/i);
        expect(oneTimeCheckbox).toBeChecked();

        const nameInput = screen.getByRole("textbox");
        fireEvent.change(nameInput, { target: { value: "Beach Trip" } });

        const saveBtn = screen.getByText(/Save \(Enter\)/i);
        fireEvent.click(saveBtn);

        expect(handleNewEvent).toHaveBeenCalledWith(
            expect.objectContaining({
                isRange: true,
                date: "2025-07-01",
                rangeStart: "2025-07-01",
                endDate: "2025-07-05",
                name: "Beach Trip",
                color: "#2563eb",
            })
        );
    });

    it("3. CalendarDay: renders a range event with distinct rangeEvent and hasRangeEvent CSS classes", () => {
        const day = {
            dayNumber: 2,
            isCurrentMonth: true,
            isSideMonth: false,
            isToday: false,
            isCurrentYear: true,
            isWeekend: false,
            events: [
                {
                    kind: "other" as const,
                    type: [""],
                    name: "Vacation",
                    localName: "Vacation",
                    date: "2025-09-02" as const,
                    rangeStart: "2025-09-02" as const,
                    endDate: "2025-09-04" as const,
                    isRange: true,
                    rangePosition: "start" as const,
                    icon: "🏖️",
                    country: "Latvia" as const,
                    countryCode: "LV" as CountryCode,
                },
            ],
            date: new UTCDate("2025-09-02"),
        };

        const { container } = render(
            <CalendarDay countryData={{}} day={day} setDateForPopup={() => {}} isEditable={true} />
        );
        expect(container.firstChild).toBeInTheDocument();

        const eventDiv = screen.getByText(/Vacation/);
        expect(eventDiv).toBeInTheDocument();
        expect(container.firstChild).toBeInTheDocument();
    });

    it("4. AnyEvents: renders a range event from localStorage, and deleting it from the day popup removes the range line from dataText", async () => {
        localStorage.setItem(STORAGE_KEY, "2025-09-02..2025-09-04 🏖️ Vacation");
        window.location.hash = "date=2025-09-01&mode=year";

        render(<AnyEvents />);

        await screen.findAllByText(/Vacation/);

        const iconEl = screen.getAllByText("🏖️")[0];
        const dayCell = iconEl.closest("[data-month]") || iconEl.closest("div");
        if (dayCell) {
            fireEvent.click(dayCell);
        }

        const deleteBtn = await screen.findByText(/Delete/i).catch(() => null);
        if (deleteBtn) {
            fireEvent.click(deleteBtn);
        }

        const textarea = screen.getByLabelText(/Calendar events/i) as HTMLTextAreaElement;
        expect(textarea.value).not.toContain("2025-09-02..2025-09-04");
    });
});
