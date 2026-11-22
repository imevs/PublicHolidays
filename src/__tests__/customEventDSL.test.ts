import {
    getYearsRange,
    parseCustomEvents,
    doesLineMatchEvent,
    formatEventLine,
    validateEventLine,
} from "../utils/customEventDSL.ts";
import type { OtherEvent } from "../types/index.ts";

describe("customEventDSL", () => {
    it("getYearsRange returns correct years around reference year", () => {
        expect(getYearsRange(2028)).toEqual([2026, 2027, 2028, 2029, 2030]);
        expect(getYearsRange(2025)).toEqual([2023, 2024, 2025, 2026, 2027]);
    });

    it("parseCustomEvents parses events correctly with reference year", () => {
        const input = "09-10 🎂 Birthday";
        const events = parseCustomEvents(input, 2028);
        expect(events.length).toBe(5);
        expect(events[2].date).toBe("2028-09-10");
        expect(events[2].name).toBe("Birthday");
    });

    it("doesLineMatchEvent and formatEventLine work correctly", () => {
        const event: OtherEvent = {
            kind: "other",
            date: "2025-06-01",
            name: "Vacation",
            icon: "🏖️",
            isRange: false,
            localName: "Vacation",
        };
        const line = formatEventLine(event);
        expect(line).toBe("2025-06-01 🏖️ Vacation");
        expect(doesLineMatchEvent("2025-06-01 🏖️ Vacation", event)).toBe(true);
    });

    it("validateEventLine validates correct and incorrect lines", () => {
        expect(validateEventLine("2025-06-01 🏖️ Vacation").valid).toBe(true);
        expect(validateEventLine("invalid").valid).toBe(false);
    });
});
