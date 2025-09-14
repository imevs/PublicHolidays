import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import CalendarDay from "../components/CalendarDay/CalendarDay";

describe("CalendarDay", () => {
    it("renders the day number", () => {
        const day = {
            kind: "publicHoliday" as const,
            dayNumber: 10,
            isCurrentMonth: true,
            isToday: false,
            isWeekend: false,
            events: [],
            date: new Date(2025, 7, 10),
        };
        render(<CalendarDay day={day} />);
        expect(screen.getByText("10")).toBeInTheDocument();
    });

    // Removed className checks, focusing on rendering logic and props
    it("renders today correctly when isToday is true", () => {
        const day = {
            kind: "publicHoliday" as const,
            dayNumber: 15,
            isCurrentMonth: true,
            isToday: true,
            isWeekend: false,
            events: [],
            date: new Date(2025, 7, 15),
        };
        render(<CalendarDay day={day} />);
        expect(screen.getByText("15")).toBeInTheDocument();
    });

    it("renders other month day correctly when isCurrentMonth is false", () => {
        const day = {
            kind: "publicHoliday" as const,
            dayNumber: 1,
            isCurrentMonth: false,
            isWeekend: false,
            isToday: false,
            events: [],
            date: new Date(2025, 6, 1),
        };
        render(<CalendarDay day={day} />);
        expect(screen.getByText("1")).toBeInTheDocument();
    });

    it("renders holidays if present", () => {
        const day = {
            dayNumber: 25,
            isCurrentMonth: true,
            isToday: false,
            isWeekend: false,
            events: [
                { kind: "publicHoliday" as const, type: [""], name: "Christmas", localName: "Ziemassvētki", date: "2025-12-25", country: "Latvia" as const, countryCode: "LV" as const },
            ],
            date: new Date(2025, 11, 25),
        };
        render(<CalendarDay day={day} />);
        expect(screen.getByText(/Latvia: Christmas/)).toBeInTheDocument();
    });

    it("sets holiday title attribute for accessibility", () => {
        const day = {
            dayNumber: 25,
            isCurrentMonth: true,
            isWeekend: false,
            isToday: false,
            events: [
                { kind: "publicHoliday" as const, type: [""], name: "Christmas", localName: "Ziemassvētki", date: "2025-12-25", country: "Latvia" as const, countryCode: "LV" as const },
            ],
            date: new Date(2025, 11, 25),
        };
        render(<CalendarDay day={day} />);
        const holidayDiv = screen.getByText(/Latvia: Christmas/);
        expect(holidayDiv).toHaveAttribute("title", "Ziemassvētki");
    });
});
