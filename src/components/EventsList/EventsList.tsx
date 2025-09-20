import { CalendarDay as CalendarDayType } from "../../types";
import { formatDateString } from "../../utils/dateUtils";

import styles from "./EventsList.module.css";
import { getFlagEmoji } from "../../utils/countryFlags";

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
    return <div className={styles.eventsList}>{
        selectedYearDays
            .filter(day => mode === "month" ? day.date.getUTCMonth() === currentDate.getUTCMonth() : true)
            .filter(day => day.events.length)
            .map(date => (<div className={styles.dateEvents}>
                {
                    date.events.map(event => (
                        event.kind === "publicHoliday"
                            ? <div className={styles.events}>
                                {formatDateString(date.date)} {getFlagEmoji(event.countryCode)} {event.country}: {event.name}
                            </div>
                            : <div className={styles.events}>
                                {formatDateString(date.date)} {event.icon} {event.name}
                            </div>
                    ))
                }
            </div>))
    }</div>;
}