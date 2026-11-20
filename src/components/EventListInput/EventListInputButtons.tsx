import React, { useCallback, useEffect, useRef, useState } from "react";
import { exportCalendarToFile, parseICS } from "../../utils/generateICS.ts";
import { getFlagEmoji } from "../../utils/countryFlags.ts";
import type { CalendarEvent } from "../../types/index.ts";
import styles from "./EventListInputButtons.module.css";
import { useSearchParams } from "react-router";

interface EventListInputButtonsProps {
    setDataText: (text: string) => void;
    setHolidaysData: (data: CalendarEvent[]) => void;
    holidaysParsed: CalendarEvent[];
}
const proxy = "https://api.codetabs.com/v1/proxy/?quest=";

function loadExternalCalendar(url: string): Promise<string> {
    return fetch(proxy + encodeURIComponent(url))
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            return res.text();
        })
        .catch(e => {
            console.error(e);
            return "";
        });
}

function isCalendarStateHash(hash: string): boolean {
    const cleanHash = hash.replace(/^#/, "");
    if (!cleanHash) {
        return true;
    }
    const hashParams = new URLSearchParams(cleanHash);
    return (
        /^(date|countries|mode|all)=/.test(cleanHash)
        || hashParams.has("date")
        || hashParams.has("countries")
        || hashParams.has("mode")
        || hashParams.has("all")
    );
}

export const EventListInputButtons: React.FC<EventListInputButtonsProps> = ({
    setDataText,
    setHolidaysData,
    holidaysParsed,
}) => {
    const [searchParams] = useSearchParams();
    const icsLinkRef = useRef<HTMLInputElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [icsUrl, setIcsUrl] = useState("");

    const handleICS = useCallback((text: string) => {
        if (!text || !text.includes("BEGIN:VCALENDAR")) {
            return;
        }
        const parsed = parseICS(text);
        setHolidaysData(parsed);
        const lines = parsed.map(ev =>
            `${ev.date} ${ev.kind === "other" ? ev.icon : getFlagEmoji(ev.countryCode)} ${ev.name}`
        ).join("\n");
        setDataText(lines);
    }, [setDataText, setHolidaysData]);

    useEffect(() => {
        const ics = searchParams?.get("ics");
        if (ics) {
            const hash = window.location.hash;
            const rawUrl = isCalendarStateHash(hash) ? ics : ics + hash;
            const url = encodeURI(rawUrl).replace(/#/g, "%23").replace(/@/g, "%40");
            setIcsUrl(rawUrl);
            loadExternalCalendar(url).then(handleICS);
        }
    }, []);

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
            loadExternalCalendar(url).then(handleICS);
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
                    type="url"
                    onChange={e => setIcsUrl(e.target.value)}
                    placeholder="Add link to .ICS file"
                />
                <button onClick={loadCalendar}>Load ICS</button>
            </div>
            <button onClick={() => fileInputRef.current?.click()}>Import .ics</button>
            <input
                ref={fileInputRef}
                type="file"
                accept=".ics,text/calendar"
                style={{ display: "none" }}
                onChange={handleImportFile}
            />
            <button onClick={exportCalendar}>Save to .ics</button>
        </div>
    );
};
