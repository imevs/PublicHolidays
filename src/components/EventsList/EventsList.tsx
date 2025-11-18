import { CalendarDay as CalendarDayType } from "../../types";
import { formatDateToReadable } from "../../utils/dateUtils";

import styles from "./EventsList.module.css";
import { getFlagEmoji } from "../../utils/countryFlags";
import type { UTCDate } from "../../utils/UTCDate";
import { getLink } from "../../data/holidays_descriptions/getLink";
import type { Description } from "../../data/holidays_descriptions/all";

export type EventsListProps = {
    selectedYearDays: CalendarDayType[];
    currentDate: UTCDate;
    mode: "month" | "year";
    countryData: Record<string, Description>;
}

export function EventsList({
    selectedYearDays,
    currentDate,
    mode,
    countryData,
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
                                    <span>{getFlagEmoji(event.countryCode)}&nbsp;</span>
                                    <strong>{event.country}&nbsp;</strong>
                                    <a target="_blank" href={getLink(event.date, event.country, event.name, countryData)}>{event.name}</a>
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