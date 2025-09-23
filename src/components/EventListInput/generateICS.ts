import type { CalendarEvent } from "../../types";
import { getFlagEmoji } from "../../utils/countryFlags";

function formatDateToYYYYMMDD(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}${m}${day}`;
}

function formatDateTimeUTC(d: Date) {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");
    const ss = String(d.getUTCSeconds()).padStart(2, "0");
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

    const now = new Date();
    const dtstamp = formatDateTimeUTC(now);

    for (const ev of events) {
        // parse date and build all-day event (DTSTART;VALUE=DATE and DTEND next day)
        const d = new Date(`${ev.date}T00:00:00`);
        const dtstart = formatDateToYYYYMMDD(d);
        const dNext = new Date(d);
        dNext.setDate(dNext.getDate() + 1);
        const dtend = formatDateToYYYYMMDD(dNext);

        const description = escapeICSText(ev.localName || ev.name || "");
        const uid = `${ev.date}-${Math.random().toString(36).slice(2, 10)}@holiday-calendar`;
        const icon = ev.kind === "other"
            ? (ev.icon ? ev.icon + " " : "")
            : getFlagEmoji(ev.countryCode);
        const summary = escapeICSText(`${icon}${ev.name}`);

        lines.push("BEGIN:VEVENT");
        lines.push(`UID:${uid}`);
        lines.push(`DTSTAMP:${dtstamp}`);
        lines.push(`CREATED:${dtstamp}`);
        lines.push(`DTSTART;VALUE=DATE:${dtstart}`);
        lines.push(`DTEND;VALUE=DATE:${dtend}`);
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
