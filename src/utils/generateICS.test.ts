import { buildICS, parseICS } from "./generateICS";
import * as assert from "node:assert";

describe("generateICS", () => {
    describe("parseICS", () => {
        it("parses all-day DTSTART and unescapes SUMMARY/DESCRIPTION", () => {
            const ics = [
                "BEGIN:VCALENDAR",
                "BEGIN:VEVENT",
                "DTSTART;VALUE=DATE:20230704",
                "SUMMARY:A\\,B\\;C\\\\D",
                "E",
                "DESCRIPTION:L1\\,L2\\;L3\\\\L4",
                "L5",
                "END:VEVENT",
                "END:VCALENDAR",
            ].join("\r\n");

            const evs = parseICS(ics);

            expect(evs).toHaveLength(1);
            const ev = evs[0];
            expect(ev.date).toBe("2023-07-04");
            expect(ev.name).toBe("A,B;C\\D\nE");
            expect(ev.localName).toBe("L1,L2;L3\\L4\nL5");
        });

        it("parses icon with flag from DTSTART", () => {
            const ics = [
                "BEGIN:VCALENDAR",
                "BEGIN:VEVENT",
                "DTSTART;TZID=Europe/Riga;VALUE=DATE:20230704",
                "SUMMARY:A\\,B\\;C\\\\D",
                "E",
                "DESCRIPTION:L1\\,L2\\;L3\\\\L4",
                "L5",
                "END:VEVENT",
                "END:VCALENDAR",
            ].join("\r\n");

            const evs = parseICS(ics);

            expect(evs).toHaveLength(1);
            const ev = evs[0];
            expect(ev.kind).toBe("other");
            assert(ev.kind === "other");
            expect(ev.icon).toBe("🇱🇻");
        });

        it("parses UTC and local date-time DTSTART values", () => {
            const ics = [
                "BEGIN:VCALENDAR",
                "BEGIN:VEVENT",
                "DTSTART:20240102T120000Z",
                "SUMMARY:UTC Event",
                "END:VEVENT",
                "BEGIN:VEVENT",
                "DTSTART:20240203T090000",
                "SUMMARY:Local Event",
                "END:VEVENT",
                "END:VCALENDAR",
            ].join("\r\n");

            const evs = parseICS(ics);
            expect(evs).toHaveLength(2);

            expect(evs[0].date).toBe("2024-01-02");
            expect(evs[0].name).toBe("UTC Event");

            expect(evs[1].date).toBe("2024-02-03");
            expect(evs[1].name).toBe("Local Event");
        });

        it("unfolds folded lines (lines starting with a space) for SUMMARY and DESCRIPTION", () => {
            const ics = [
                "BEGIN:VCALENDAR",
                "BEGIN:VEVENT",
                "DTSTART;VALUE=DATE:20250505",
                "SUMMARY:Multi",
                " folded",
                "DESCRIPTION:Part1",
                " part2",
                "END:VEVENT",
                "END:VCALENDAR",
            ].join("\r\n");

            const evs = parseICS(ics);
            expect(evs).toHaveLength(1);
            expect(evs[0].name).toBe("Multifolded");
            expect(evs[0].localName).toBe("Part1part2");
        });
    });

    describe("buildICS", () => {
        it("produces a VCALENDAR with a VEVENT and correct DTSTART/DTEND for all-day event", () => {
            const ev = {
                date: "2025-12-25" as const,
                icon: "🎄",
                name: "Christmas",
                localName: "",
                kind: "other" as const,
            };
            const ics = buildICS([ev]);
            expect(ics.startsWith("BEGIN:VCALENDAR")).toBe(true);
            expect(ics.includes("END:VCALENDAR")).toBe(true);
            expect(ics.includes("BEGIN:VEVENT")).toBe(true);
            expect(ics.includes("END:VEVENT")).toBe(true);

            // DTSTART and DTEND for all-day event: 20251225 and next day 20251226
            expect(ics).toContain("DTSTART;VALUE=DATE:20251225");
            expect(ics).toContain("DTEND;VALUE=DATE:20251226");

            // UID pattern: date-<8 chars>@holiday-calendar
            const uidMatch = ics.match(/UID:(2025-12-25)-([a-z0-9]{8})@holiday-calendar/);
            expect(uidMatch).not.toBeNull();

            // DTSTAMP exists and follows YYYYMMDDTHHMMSSZ
            expect(ics).toMatch(/DTSTAMP:\d{8}T\d{6}Z/);
        });

        it("escapes special characters in SUMMARY and DESCRIPTION", () => {
            const name = "A,B;C\\D\nE";
            const localName = "L1,L2;L3\\L4\nL5";
            const ev = {
                date: "2023-07-04" as const,
                icon: "🏳️",
                name,
                localName,
                kind: "other" as const,
            };
            const ics = buildICS([ev]);

            // SUMMARY should include escaped characters for the combined icon + name
            // icon + name -> "🏳️A,B;C\D\nE" => escaped: "🏳️A\,B\;C\\D\nE" but newlines become \n
            expect(ics).toContain("SUMMARY:");
            // check for escaped comma, semicolon and escaped backslash and \n in SUMMARY
            expect(ics).toMatch(/SUMMARY:.*\\,.*\\;.*\\\\.*\\n.*/);

            // DESCRIPTION should be escaped localName
            expect(ics).toContain("DESCRIPTION:");
            expect(ics).toMatch(/DESCRIPTION:.*\\,.*\\;.*\\\\.*\\n.*/);
        });

        it("uses localName as DESCRIPTION when provided and includes icon in SUMMARY", () => {
            const ev = {
                date: "2024-01-01" as const,
                icon: "✨",
                name: "New Year",
                localName: "Neujahr",
                kind: "other" as const,
            };
            const ics = buildICS([ev]);

            // SUMMARY should contain icon + name (escaped if necessary)
            const summaryLine = ics.split("\r\n").find(l => l.startsWith("SUMMARY:"));
            expect(summaryLine).toBeDefined();
            expect(summaryLine).toContain("✨ New Year");

            // DESCRIPTION should be the localName (escaped)
            const descLine = ics.split("\r\n").find(l => l.startsWith("DESCRIPTION:"));
            expect(descLine).toBeDefined();
            expect(descLine).toContain("Neujahr");
        });
    });
});
