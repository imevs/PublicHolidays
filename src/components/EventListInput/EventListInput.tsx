import { useCallback, useEffect, useRef, useState } from "react";

import { CalendarEvent } from "../../types";
import styles from "./EventListInput.module.css";
import { exportCalendarToFile } from "./generateICS";

function parseData(input: string): CalendarEvent[] {
    return input.split("\n")
        .map(s => s.trim())
        .filter(s => s.length)
        .map(s => {
            const parts = s.split(" ");
            const [date, icon, ...name] = parts;
            const description = isIcon(icon) ? name.join(" ") : icon + " " + name.join(" ");
            return {
                name: description,
                icon: isIcon(icon) ? icon : "",
                date: date,
                kind: "other" as const,
                localName: description,
            };
        });
}

function isIcon(symbol: string): boolean {
    if (!symbol) return false;

    if (symbol.length === 1) return true;

    // Use regex to match common emoji ranges
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/u;
    return emojiRegex.test(symbol);
}

const defaultData = `
2025-09-10 🎂 Birthday of Joe
2025-09-19 🎂 Birthday of Chuck
2025-09-27 🎂 Birthday of Dima
`;

function validateLine(line: string): { valid: boolean; error?: string } {
    const trimmed = line.trim();
    if (!trimmed) return { valid: false, error: "Empty line" };

    const parts = trimmed.split(/\s+/);
    if (parts.length < 2) return { valid: false, error: "Expect at least date and name" };

    const date = parts[0];
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return { valid: false, error: "Date must be YYYY-MM-DD" };

    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return { valid: false, error: "Invalid date" };
    return { valid: true };
}

export function EventListInput(props: {
    setHolidaysData: (data: CalendarEvent[]) => void
}) {
    const textRef = useRef<HTMLTextAreaElement | null>(null);
    const iconsRef = useRef<HTMLDivElement | null>(null);
    const [dataText, setDataText] = useState<string>(defaultData.trim());
    const [holidaysParsed, setHolidays] = useState<CalendarEvent[]>([]);
    const lines = dataText.split("\n");

    useEffect(() => {
        const data = localStorage.getItem("holidaysData");
        if (data) {
            setDataText(data);
        }
    }, []);

    useEffect(() => {
        const lines = dataText.split("\n").map(l => l.trim()).filter(l => l.length);
        const validLines = lines.filter(l => validateLine(l).valid).join("\n");
        props.setHolidaysData(parseData(validLines));
        setHolidays(parseData(validLines));
        localStorage.setItem("holidaysData", dataText);
    }, [dataText]);

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
        <label htmlFor="events-data" className={styles.label}>
            Calendar events. Format: <code>YYYY-MM-DD [icon] event name</code>.
        </label>
        <button onClick={exportCalendar} style={{ position: "absolute", right: 0, top: 0 }}>Save to .ics</button>

        <div className={styles.wrapper}>
            <div ref={iconsRef} className={styles.icons}>
                {lines.map((line, idx) => {
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
                value={dataText}
                onChange={(e) => setDataText(e.target.value)}
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