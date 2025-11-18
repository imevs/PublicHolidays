import { CalendarDay as CalendarDayType } from "../../types";
import { formatDateToReadable } from "../../utils/dateUtils";

import styles from "./EventsList.module.css";
import { getFlagEmoji } from "../../utils/countryFlags";
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
    return <div className={styles.eventsList}>
        <div className={styles.eventsWrapper}>
            {selectedYearDays
                .filter(day => mode === "month" ? day.date.getMonth() === currentDate.getMonth() : true)
                .filter(day => day.events.length)
                .map(date => (
                    <div className={styles.dateEvents} key={date.date.valueOf()}>
                        <div className={styles.eventsDate}>
                            <b>{formatDateToReadable(date.date)}</b>
                        </div>
                        {date.events.map(event => (
                            event.kind === "publicHoliday"
                                ? <div className={styles.events} key={event.name + event.countryCode}>
                                    {getFlagEmoji(event.countryCode)} {event.country}: {event.name}
                                </div>
                                : <div className={styles.events} key={event.name}>
                                    {event.icon} {event.name}
                                </div>
                        ))}
                    </div>
                ))
            }
        </div>
    </div>;
}