import { useEffect, useRef } from "react";

import { CalendarEvent } from "../../types/index.ts";
import styles from "./EventListInput.module.css";
import { useTranslation } from "../../i18n/useTranslation.ts";
import { validateEventLine, parseCustomEvents } from "../../utils/customEventDSL.ts";

export function EventListInput(props: {
    dataText: string;
    setDataText(text: string): void;
    setHolidaysData: (data: CalendarEvent[]) => void;
    referenceYear?: number;
}) {
    const { t } = useTranslation();
    const textRef = useRef<HTMLTextAreaElement | null>(null);
    const iconsRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const lines = props.dataText.split("\n").map(l => l.trim()).filter(l => l.length);
        const validLines = lines.filter(l => validateEventLine(l).valid).join("\n");
        props.setHolidaysData(parseCustomEvents(validLines, props.referenceYear));
    }, [props.dataText, props.referenceYear]);

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
                    const result = validateEventLine(line);
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
