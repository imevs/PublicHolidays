import { CalendarDay as CalendarDayType } from "../../types";
import { formatDateString, getDayName } from "../../utils/dateUtils";

import styles from "./EventsList.module.css";
import { getFlagEmoji } from "../../utils/countryFlags";
import { useCallback } from "react";

export type EventsListProps = {
    selectedYearDays: CalendarDayType[];
    currentDate: Date;
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
                date.events.map(event => {
                    dataText += event.kind === "publicHoliday"
                        ? formatDateString(date.date) + " " +
                        getFlagEmoji(event.countryCode) + " " +
                        event.country + ": " + event.name + "\n"
                        : "";
                });
            });
        localStorage.setItem("holidaysData", dataText);
    }, [selectedYearDays]);
    return <div className={styles.eventsList}>
        <h2 style={{ marginBottom: 15 }} onClick={editEvents}>
            <a href="./Events">
                Edit events list
            </a>
        </h2>
        {selectedYearDays
            .filter(day => mode === "month" ? day.date.getUTCMonth() === currentDate.getUTCMonth() : true)
            .filter(day => day.events.length)
            .map(date => (<div className={styles.dateEvents}>
                {
                    date.events.map(event => (
                        event.kind === "publicHoliday"
                            ? <div className={styles.events}>
                                {formatDateString(date.date)} ({getDayName(date.date)}) {getFlagEmoji(event.countryCode)} {event.country}: {event.name}
                            </div>
                            : <div className={styles.events}>
                                {formatDateString(date.date)} {event.icon} {event.name}
                            </div>
                    ))
                }
            </div>))
        }
    </div>;
}