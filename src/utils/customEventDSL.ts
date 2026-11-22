import { CalendarEvent, OtherEvent } from "../types/index.ts";
import type { DateString } from "./UTCDate.ts";
import { getDaysInMonth } from "./dateUtils.ts";
import type { ValidationErrorKey } from "../i18n/types.ts";

export const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

export function isIcon(symbol: string): boolean {
    if (!symbol) return false;
    if (symbol.length === 1) return true;
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/u;
    return emojiRegex.test(symbol);
}

export function getYearsRange(referenceYear?: number): number[] {
    const year = referenceYear ?? new Date().getUTCFullYear();
    return [year - 2, year - 1, year, year + 1, year + 2];
}

function isValidSingleDate(date: string): boolean {
    const dateRegex = /^(\d{4}-)?\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;

    const parts = date.split("-").map(Number);
    const hasYear = parts.length === 3;
    const year = hasYear ? parts[0] : 2024;
    const month = hasYear ? parts[1] : parts[0];
    const day = hasYear ? parts[2] : parts[1];

    return month >= 1 && month <= 12 && day >= 1 && day <= getDaysInMonth(year, month - 1);
}

function expandDateRange(startStr: string, endStr: string): DateString[] {
    const days: DateString[] = [];
    let curr = new Date(startStr + "T12:00:00Z");
    const end = new Date(endStr + "T12:00:00Z");
    if (curr.getTime() > end.getTime()) return days;
    let count = 0;
    while (curr.getTime() <= end.getTime() && count < 366) {
        const y = curr.getUTCFullYear();
        const m = String(curr.getUTCMonth() + 1).padStart(2, "0");
        const d = String(curr.getUTCDate()).padStart(2, "0");
        days.push(`${y}-${m}-${d}` as DateString);
        curr.setUTCDate(curr.getUTCDate() + 1);
        count++;
    }
    return days;
}

export function validateEventLine(line: string): { valid: boolean; errorKey?: ValidationErrorKey } {
    const trimmed = line.trim();
    if (!trimmed) { return { valid: false, errorKey: "emptyLine" }; }

    const parts = trimmed.split(/\s+/);
    if (parts.length < 2) { return { valid: false, errorKey: "expectDateAndName" }; }

    const date = parts[0];
    if (HEX_COLOR_REGEX.test(parts[1])) {
        if (parts.length < 3) {
            return { valid: false, errorKey: "expectDateColorAndName" };
        }
    }

    if (date.includes("..")) {
        const rangeParts = date.split("..");
        if (rangeParts.length !== 2) return { valid: false, errorKey: "invalidDateRangeFormat" };
        const [startStr, endStr] = rangeParts;
        if (!isValidSingleDate(startStr) || !isValidSingleDate(endStr)) {
            return { valid: false, errorKey: "invalidDateInRange" };
        }
        const startHasYear = startStr.split("-").length === 3;
        const endHasYear = endStr.split("-").length === 3;
        if (startHasYear !== endHasYear) {
            return { valid: false, errorKey: "dateRangeFormatMismatch" };
        }
        const compStart = startHasYear ? startStr : `2024-${startStr}`;
        const compEnd = endHasYear ? endStr : `2024-${endStr}`;
        if (compStart > compEnd) {
            return { valid: false, errorKey: "startAfterEnd" };
        }
        return { valid: true };
    }

    if (!isValidSingleDate(date)) {
        return { valid: false, errorKey: "invalidDate" };
    }
    return { valid: true };
}

export function parseCustomEvents(input: string, referenceYear?: number): CalendarEvent[] {
    const yearsRange = getYearsRange(referenceYear);
    return input.split("\n")
        .map(s => s.trim())
        .filter(s => s.length)
        .flatMap(s => {
            const parts = s.split(" ");
            const [date, second, ...rest] = parts;
            let color: string | undefined;
            let icon: string;
            let nameParts: string[];

            if (HEX_COLOR_REGEX.test(second)) {
                color = second;
                icon = rest[0] ?? "";
                nameParts = rest.slice(1);
            } else {
                color = undefined;
                icon = second ?? "";
                nameParts = rest;
            }

            const hasIcon = isIcon(icon);
            const iconStr = hasIcon ? icon : "";
            const description = hasIcon ? nameParts.join(" ") : [icon, ...nameParts].filter(Boolean).join(" ");

            const colorProps = color ? { color } : {};

            if (date.includes("..")) {
                const [startStr, endStr] = date.split("..");
                const hasYear = startStr.split("-").length === 3;
                if (hasYear) {
                    const days = expandDateRange(startStr, endStr);
                    return days.map((d, i) => ({
                        name: description,
                        icon: iconStr,
                        date: d,
                        rangeStart: startStr as DateString,
                        endDate: endStr as DateString,
                        isRange: true,
                        rangePosition: days.length === 1 ? "single" : i === 0 ? "start" : i === days.length - 1 ? "end" : "middle",
                        kind: "other" as const,
                        localName: description,
                        ...colorProps,
                    }));
                } else {
                    return yearsRange.flatMap(year => {
                        const days = expandDateRange(`${year}-${startStr}`, `${year}-${endStr}`);
                        return days.map((d, i) => ({
                            name: description,
                            icon: iconStr,
                            date: d,
                            rangeStart: startStr as DateString,
                            endDate: endStr as DateString,
                            isRange: true,
                            rangePosition: days.length === 1 ? "single" : i === 0 ? "start" : i === days.length - 1 ? "end" : "middle",
                            kind: "other" as const,
                            localName: description,
                            ...colorProps,
                        }));
                    });
                }
            }

            return date.split("-").length === 3 ? {
                name: description,
                icon: iconStr,
                date: date as DateString,
                kind: "other" as const,
                localName: description,
                ...colorProps,
            } : yearsRange.map(year => ({
                name: description,
                icon: iconStr,
                date: `${year}-${date}`,
                kind: "other" as const,
                localName: description,
                ...colorProps,
            }));
        });
}

export function doesLineMatchEvent(line: string, target: OtherEvent): boolean {
    const trimmed = line.trim();
    if (!trimmed) return false;
    const [dateToken, second, ...rest] = trimmed.split(" ");
    const hasColor = HEX_COLOR_REGEX.test(second);
    const lineColor = hasColor ? second : undefined;
    const iconToken = hasColor ? rest[0] : second;
    const nameTokens = hasColor ? rest.slice(1) : rest;

    const hasIcon = isIcon(iconToken);
    const lineIcon = hasIcon ? iconToken : "";
    const lineName = hasIcon ? nameTokens.join(" ") : [iconToken, ...nameTokens].join(" ");
    const [lineStart, lineEnd] = dateToken.split("..");

    const colorMatches = lineColor === target.color || (!lineColor && !target.color);

    if (target.isRange && target.endDate) {
        const targetStart = target.rangeStart ?? target.date;
        const startMatches = lineStart === targetStart || lineStart === targetStart.substring(5);
        const endMatches = Boolean(lineEnd) && (lineEnd === target.endDate || lineEnd === target.endDate.substring(5));
        return startMatches && endMatches && colorMatches && lineIcon === target.icon && lineName === target.name;
    }
    const dateMatches = dateToken === target.date || dateToken === target.date.substring(5);
    return !lineEnd && dateMatches && colorMatches && lineIcon === target.icon && lineName === target.name;
}

export function formatEventLine(ev: OtherEvent): string {
    const start = ev.rangeStart ?? ev.date;
    const datePart = ev.isRange && ev.endDate && ev.endDate !== start ? `${start}..${ev.endDate}` : ev.date;
    return [datePart, ev.isRange && ev.color ? ev.color : "", ev.icon, ev.name].filter(Boolean).join(" ");
}
