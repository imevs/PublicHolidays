import { CalendarDay as CalendarDayType } from "../../types";
import { formatDateString, getDayName } from "../../utils/dateUtils";

import styles from "./EventsList.module.css";
import { getFlagEmoji } from "../../utils/countryFlags";
import { useCallback } from "react";
import { exportCalendarToFile } from "../EventListInput/generateICS";
import type { UTCDate } from "../../utils/UTCDate";

export type EventsListProps = {
    selectedYearDays: CalendarDayType[];
    currentDate: UTCDate;
    mode: "month" | "year";
}

export function EventsList({
    selectedYearDays,
    currentDate,
    mode,
}: EventsListProps) {
    const editEvents = useCallback(() => {
        let dataText = "";
        (selectedYearDays ?? [])
            .filter(day => day.events.length)
            .map((date) => {
                date.events.forEach(event => {
                    dataText += event.kind === "publicHoliday"
                        ? formatDateString(date.date) + " " +
                        getFlagEmoji(event.countryCode) + " " +
                        event.country + ": " + event.name + "\n"
                        : "";
                });
            });
        localStorage.setItem("holidaysData", dataText);
        document.location = "/PublicHolidays/Events";
    }, [selectedYearDays]);

    const exportCalendar = useCallback(() => {
        const data = selectedYearDays.map(d => d.events).flat();
        exportCalendarToFile(data);
    }, [selectedYearDays]);

    return <div className={styles.eventsList}>
        <button className={styles.actionButton} onClick={exportCalendar}>Export to .ics</button>
        <button className={styles.actionButton} onClick={editEvents} style={{ right: 120 }}>Edit events</button>
        <h2 style={{ marginBottom: 15 }}>
            Events list
        </h2>
        {selectedYearDays
            .filter(day => mode === "month" ? day.date.getUTCMonth() === currentDate.getUTCMonth() : true)
            .filter(day => day.events.length)
            .map(date => (
                <div className={styles.dateEvents}>
                    {date.events.map(event => (
                        event.kind === "publicHoliday"
                            ? <div className={styles.events}>
                                {formatDateString(date.date)} ({getDayName(date.date)}) {getFlagEmoji(event.countryCode)} {event.country}: {event.name}
                            </div>
                            : <div className={styles.events}>
                                {formatDateString(date.date)} {event.icon} {event.name}
                            </div>
                    ))}
                </div>
            ))
        }
    </div>;
}