import { useNavigate } from "react-router";
import { useCallback } from "react";

import { CalendarDay as CalendarDayType } from "../../types";
import { formatDateString, formatDateToReadable } from "../../utils/dateUtils";

import styles from "./EventsList.module.css";
import { getFlagEmoji } from "../../utils/countryFlags";
import { exportCalendarToFile } from "../../utils/generateICS";
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
    const navigate = useNavigate()

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
        navigate("/PublicHolidays/EditEvents");
    }, [selectedYearDays]);

    const exportCalendar = useCallback(() => {
        const data = selectedYearDays.map(d => d.events).flat();
        exportCalendarToFile(data);
    }, [selectedYearDays]);

    return <div className={styles.eventsList}>
        <button className={styles.actionButton} onClick={exportCalendar}>Export to .ics</button>
        <button className={styles.actionButton} onClick={editEvents} style={{ right: 120 }}>Edit events</button>
        {selectedYearDays
            .filter(day => mode === "month" ? day.date.getMonth() === currentDate.getMonth() : true)
            .filter(day => day.events.length)
            .map(date => (
                <div className={styles.dateEvents}>
                    <div className={styles.eventsDate}>
                        <b>{formatDateToReadable(date.date)}</b>
                    </div>
                    {date.events.map(event => (
                        event.kind === "publicHoliday"
                            ? <div className={styles.events}>
                                {getFlagEmoji(event.countryCode)} {event.country}: {event.name}
                            </div>
                            : <div className={styles.events}>
                                {event.icon} {event.name}
                            </div>
                    ))}
                </div>
            ))
        }
    </div>;
}