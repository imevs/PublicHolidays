import { useEffect, useRef } from "react";

import { CalendarEvent } from "../../types/index.ts";
import styles from "./EventListInput.module.css";
import type { DateString } from "../../utils/UTCDate.ts";
import { getDaysInMonth } from "../../utils/dateUtils.ts";
import type { ValidationErrorKey } from "../../i18n/types.ts";
import { useTranslation } from "../../i18n/useTranslation.ts";

const yearsRange = [2023, 2024, 2025, 2026, 2027];
const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

function parseData(input: string): CalendarEvent[] {
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

function isIcon(symbol: string): boolean {
    if (!symbol) return false;

    if (symbol.length === 1) return true;

    // Use regex to match common emoji ranges
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/u;
    return emojiRegex.test(symbol);
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

function validateLine(line: string): { valid: boolean; errorKey?: ValidationErrorKey } {
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

export function EventListInput(props: {
    dataText: string;
    setDataText(text: string): void;
    setHolidaysData: (data: CalendarEvent[]) => void
}) {
    const { t } = useTranslation();
    const textRef = useRef<HTMLTextAreaElement | null>(null);
    const iconsRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const lines = props.dataText.split("\n").map(l => l.trim()).filter(l => l.length);
        const validLines = lines.filter(l => validateLine(l).valid).join("\n");
        props.setHolidaysData(parseData(validLines));
    }, [props.dataText]);

    useEffect(() => {
        const textarea = textRef.current;
        if (!textarea || typeof ResizeObserver === "undefined") {
            return;
        }
        const observer = new ResizeObserver(() => {
            if (iconsRef.current) {
                iconsRef.current.style.height = textarea.clientHeight + "px";
            }
        });
        observer.observe(textarea);
        return () => observer.disconnect();
    }, []);

    return <div className={styles.container}>
        <label htmlFor="events-data" className={styles.label}>
            {t.eventListInput.formatPrefix}{" "}
            <code>{t.eventListInput.formatSingleExample}</code>{" "}
            {t.eventListInput.formatOr}{" "}
            <code>{t.eventListInput.formatRangeExample}</code>.
        </label>

        <div className={styles.wrapper}>
            <div ref={iconsRef} className={styles.icons}>
                {props.dataText.split("\n").map((line, idx) => {
                    const result = validateLine(line);
                    const errorText = result.errorKey
                        ? t.eventListInput.errors[result.errorKey]
                        : t.eventListInput.errors.invalid;
                    return (
                        <div
                            key={idx}
                            data-tooltip={result.valid ? undefined : errorText}
                            className={styles.lineRow}
                        >
                            <span className={`${styles.indicator} ${result.valid ? "" : styles.indicatorInvalid}`}>
                                {result.valid ? "" : "!"}
                            </span>
                        </div>
                    );
                })}
            </div>

            <textarea
                id="events-data"
                ref={textRef}
                value={props.dataText}
                onChange={(e) => props.setDataText(e.target.value)}
                onScroll={(event) => {
                    if (iconsRef.current) {
                        iconsRef.current.scrollTop = (event.target as Element).scrollTop;
                    }
                }}
                className={styles.textarea}
            />
        </div>
    </div>
}