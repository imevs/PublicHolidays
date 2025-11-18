import React, { useRef, useState, useCallback } from "react";
import { exportCalendarToFile, parseICS } from "../../utils/generateICS";
import { getFlagEmoji } from "../../utils/countryFlags";
import type { CalendarEvent } from "../../types";
import styles from "./EventListInputButtons.module.css";

interface EventListInputButtonsProps {
    setDataText: (text: string) => void;
    setHolidaysData: (data: CalendarEvent[]) => void;
    holidaysParsed: CalendarEvent[];
}

export const EventListInputButtons: React.FC<EventListInputButtonsProps> = ({
    setDataText,
    setHolidaysData,
    holidaysParsed,
}) => {
    const icsLinkRef = useRef<HTMLInputElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [icsUrl, setIcsUrl] = useState("");

    const handleICS = useCallback((text: string) => {
        const parsed = parseICS(text);
        setHolidaysData(parsed);
        const lines = parsed.map(ev =>
            `${ev.date} ${ev.kind === "other" ? ev.icon : getFlagEmoji(ev.countryCode)} ${ev.name}`
        ).join("\n");
        setDataText(lines);
    }, [setDataText, setHolidaysData]);

    const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            handleICS(String(reader.result || ""));
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        };
        reader.readAsText(file);
    };

    const loadCalendar = useCallback(() => {
        const url = icsLinkRef.current?.value || icsUrl;
        if (url) {
            const proxy = "https://api.codetabs.com/v1/proxy/?quest=";
            fetch(proxy + encodeURIComponent(url)).then(res => res.text()).then(data => {
                handleICS(data);
            }).catch(e => {
                console.error(e);
            });
        }
    }, [icsUrl, handleICS]);

    const exportCalendar = useCallback(() => {
        exportCalendarToFile(holidaysParsed);
    }, [holidaysParsed]);

    return (
        <div className={styles.controls}>
            <div className={styles.controlsGroup}>
                <input
                    ref={icsLinkRef}
                    value={icsUrl}
                    onChange={e => setIcsUrl(e.target.value)}
                    placeholder="Add link to .ICS file"
                />
                <button onClick={loadCalendar}>Load ICS</button>
            </div>
            <button onClick={exportCalendar}>Save to .ics</button>
            <button onClick={() => fileInputRef.current?.click()}>Import .ics</button>
            <input
                ref={fileInputRef}
                type="file"
                accept=".ics,text/calendar"
                style={{ display: "none" }}
                onChange={handleImportFile}
            />
        </div>
    );
};
