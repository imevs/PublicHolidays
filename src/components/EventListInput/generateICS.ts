import type { CalendarEvent } from "../../types";
import { getFlagEmoji } from "../../utils/countryFlags";
import { formatDateString } from "../../utils/dateUtils";
import { countryTimeZones } from "../../utils/timeZones";
import type { CountryCode } from "../../data/countryNames";
import { UTCDate } from "../../utils/UTCDate";

function formatDateToYYYYMMDD(d: UTCDate) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}${m}${day}`;
}

function formatDateTimeUTC(d: UTCDate) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${y}${m}${day}T${hh}${mm}${ss}Z`;
}

function escapeICSText(input = "") {
    return input
        .replace(/\\/g, "\\\\")
        .replace(/\n/g, "\\n")
        .replace(/,/g, "\\,")
        .replace(/;/g, "\\;");
}

export function buildICS(events: CalendarEvent[]) {
    const lines: string[] = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//holiday-calendar-full//EN",
    ];

    const now = new UTCDate();
    const dtstamp = formatDateTimeUTC(now);

    for (const ev of events) {
        // parse date and build all-day event (DTSTART;VALUE=DATE and DTEND next day)
        const d = new UTCDate(`${ev.date}T00:00:00.000Z`);
        const dtstart = formatDateToYYYYMMDD(d);
        const dNext = new UTCDate(d);
        dNext.setDate(dNext.getDate() + 1);
        const dtend = formatDateToYYYYMMDD(dNext);

        const description = escapeICSText(ev.localName || ev.name || "");
        const uid = `${ev.date}-${Math.random().toString(36).slice(2, 10)}@holiday-calendar`;
        const icon = ev.kind === "other"
            ? (ev.icon ? ev.icon + " " : "")
            : getFlagEmoji(ev.countryCode) + " ";
        const summary = escapeICSText(`${icon}${ev.name}`);

        lines.push("BEGIN:VEVENT");
        lines.push(`UID:${uid}`);
        lines.push(`DTSTAMP:${dtstamp}`);
        lines.push(`CREATED:${dtstamp}`);
        const timezone = ev.kind === "publicHoliday" ? `TZID=${countryTimeZones[ev.countryCode]};` : "";
        lines.push(`DTSTART;${timezone}VALUE=DATE:${dtstart}`);
        lines.push(`DTEND;${timezone}VALUE=DATE:${dtend}`);
        lines.push(`SUMMARY:${summary}`);
        if (description) {
            lines.push(`DESCRIPTION:${description}`);
        }
        lines.push("TRANSP:TRANSPARENT");
        lines.push("END:VEVENT");
    }

    lines.push("END:VCALENDAR");
    // ICS spec prefers CRLF line endings
    return lines.join("\r\n");
}

export function exportCalendarToFile(holidaysParsed: CalendarEvent[])  {
    const data = buildICS(holidaysParsed);
    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "calendar_events.ics";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

const unescapeValue = (v: string) =>
    v
        .replace(/\\\\/g, "\\")
        .replace(/\\n/gi, "\n")
        .replace(/\\,/g, ",")
        .replace(/\\;/g, ";");

export function parseICS(raw: string): CalendarEvent[] {
    // normalize newlines
    let s = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    // unfold folded lines per RFC: lines starting with space or tab are continuations -> remove the newline and the leading space/tab
    s = s.replace(/\n[ \t]/g, "");

    const lines = s.split("\n");

    const events: CalendarEvent[] = [];
    let current: Partial<CalendarEvent> | null = null;
    let lastProp: string | null = null;

    for (const line of lines) {
        const trimmed = line.replace(/\r$/, "");

        if (trimmed === "BEGIN:VEVENT") {
            current = {};
            lastProp = null;
            continue;
        }
        if (trimmed === "END:VEVENT") {
            if (current) {
                if (current.kind === "other") {
                    events.push({
                        date: current.date || "",
                        name: current.name || "",
                        localName: current.localName ?? "",
                        kind: "other",
                        icon: current.icon ?? "",
                    });
                } else {
                    events.push({
                        date: current.date || "",
                        name: current.name || "",
                        localName: current.localName ?? "",
                        kind: "publicHoliday",
                        countryCode: "AL",
                        country: "Sweden",
                        type: undefined,
                    });
                }
            }
            current = null;
            lastProp = null;
            continue;
        }

        if (!current) continue;

        const colonIdx = trimmed.indexOf(":");
        if (colonIdx === -1) {
            // line without ":" -> treat as raw continuation (insert newline then text) for last property
            if (lastProp === "SUMMARY") {
                current.name = (current.name || "") + "\n" + trimmed;
            } else if (lastProp === "DESCRIPTION") {
                current.localName = (current.localName || "") + "\n" + trimmed;
            }
            continue;
        }

        const keyParts = trimmed.substring(0, colonIdx).split(";");
        const valuePart = trimmed.substring(colonIdx + 1);

        const propName = keyParts[0].toUpperCase();

        if (propName === "DTSTART") {
            const TZID = keyParts.map(p => p.split("=")).find(([k]) => k === "TZID" )?.[1];
            if (TZID) {
                const countryCode = (Object.entries(countryTimeZones) as [CountryCode, string][])
                    .find(([, zone]) => zone === TZID)?.[0];
                if (countryCode) {
                    current.kind = "other";
                    if (current.kind === "other") {
                        current.icon = getFlagEmoji(countryCode);
                    } else if (current.kind === "publicHoliday") {
                        current.countryCode = countryCode;
                    }
                }
            }
            const dateRaw = valuePart.trim();
            const ymd = dateRaw.slice(0, 8);
            if (/^\d{8}$/.test(ymd)) {
                current.date = `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
            } else {
                // fallback: try to parse as Date (handles datetimes with timezone)
                const parsed = new UTCDate(dateRaw);
                if (!isNaN(parsed.getTime())) {
                    current.date = formatDateString(parsed);
                }
            }
        } else if (propName === "SUMMARY") {
            current.name = unescapeValue(valuePart);
        } else if (propName === "DESCRIPTION") {
            current.localName = unescapeValue(valuePart);
        }
        lastProp = propName;
    }

    return events;
}

