import { useCallback, useEffect, useRef, useState } from "react";

import { CalendarEvent } from "../../types";
import styles from "./EventListInput.module.css";
import { exportCalendarToFile, parseICS } from "../../utils/generateICS";
import { getFlagEmoji } from "../../utils/countryFlags";
import type { DateString } from "../../utils/UTCDate";

const yearsRange = [2023, 2024, 2025, 2026, 2027];

function parseData(input: string): CalendarEvent[] {
    return input.split("\n")
        .map(s => s.trim())
        .filter(s => s.length)
        .flatMap(s => {
            const parts = s.split(" ");
            const [date, icon, ...name] = parts;
            const description = isIcon(icon) ? name.join(" ") : icon + " " + name.join(" ");
            return date.split("-").length === 3 ? {
                name: description,
                icon: isIcon(icon) ? icon : "",
                date: date as DateString,
                kind: "other" as const,
                localName: description,
            } : yearsRange.map(year => ({
                name: description,
                icon: isIcon(icon) ? icon : "",
                date: `${year}-${date}`,
                kind: "other" as const,
                localName: description,
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

function validateLine(line: string): { valid: boolean; error?: string } {
    const trimmed = line.trim();
    if (!trimmed) { return { valid: false, error: "Empty line" }; }

    const parts = trimmed.split(/\s+/);
    if (parts.length < 2) { return { valid: false, error: "Expect at least date and name" }; }

    const date = parts[0];
    const dateRegex = /^(\d{4}-)?\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) { return { valid: false, error: "Date must be YYYY-MM-DD or MM-DD" }; }

    const d = new Date(date);
    if (Number.isNaN(d.getTime())) { return { valid: false, error: "Invalid date" }; }
    return { valid: true };
}

export function EventListInput(props: {
    dataText: string;
    setDataText(text: string): void;
    setHolidaysData: (data: CalendarEvent[]) => void
}) {
    const textRef = useRef<HTMLTextAreaElement | null>(null);
    const iconsRef = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [holidaysParsed, setHolidays] = useState<CalendarEvent[]>([]);
    const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const text = String(reader.result || "");
            const parsed = parseICS(text);
            // set local state and notify parent
            setHolidays(parsed);
            props.setHolidaysData(parsed);
            // update textarea so user sees imported events in the same format
            const lines = parsed.map(ev =>
                `${ev.date} ${ev.kind === "other" ? ev.icon : getFlagEmoji(ev.countryCode)} ${ev.name}`,
            ).join("\n");
            props.setDataText(lines);
            // clear the input so same file can be re-imported if needed
            if (fileInputRef.current) fileInputRef.current.value = "";
        };
        reader.readAsText(file);
    };

    useEffect(() => {
        const lines = props.dataText.split("\n").map(l => l.trim()).filter(l => l.length);
        const validLines = lines.filter(l => validateLine(l).valid).join("\n");
        props.setHolidaysData(parseData(validLines));
        setHolidays(parseData(validLines));
    }, [props.dataText]);

    useEffect(() => {
        if (textRef.current) {
            new ResizeObserver(() => {
                if (iconsRef.current) {
                    iconsRef.current.style.height = textRef.current?.clientHeight + "px";
                }
            }).observe(textRef.current);
        }
    }, [textRef.current]);

    const exportCalendar = useCallback(() => {
        exportCalendarToFile(holidaysParsed);
    }, [holidaysParsed]);

    return <div className={styles.container}>
        <div style={{ paddingBottom: 5, textAlign: "end" }}>
            <button onClick={exportCalendar}>Save to .ics</button>
            <button onClick={() => fileInputRef.current?.click()} style={{ marginLeft: 8 }}>Import .ics</button>
            <input ref={fileInputRef} type="file" accept=".ics,text/calendar" style={{ display: "none" }} onChange={handleImportFile} />
        </div>

        <label htmlFor="events-data" className={styles.label}>
            Calendar events. Format: <code>YYYY-MM-DD [icon] event name</code>.
        </label>

        <div className={styles.wrapper}>
            <div ref={iconsRef} className={styles.icons}>
                {props.dataText.split("\n").map((line, idx) => {
                    const result = validateLine(line);
                    return (
                        <div
                            key={idx}
                            data-tooltip={result.valid ? undefined : (result.error || "Invalid")}
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