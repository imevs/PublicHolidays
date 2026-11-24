import { CalendarDay as CalendarDayType } from "../../types/index.ts";
import { formatDateToReadable } from "../../utils/dateUtils.ts";

import styles from "./EventsList.module.css";
import { getFlagEmoji } from "../../utils/countryFlags.ts";
import type { UTCDate } from "../../utils/UTCDate.ts";
import { getLink } from "../../data/holidays_descriptions/getLink.ts";
import type { Description } from "../../data/holidays_descriptions/all.ts";
import { useTranslation } from "../../i18n/useTranslation.ts";
import { getLocalizedHolidayName } from "../../i18n/holidayNames.ts";

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
    const { intlLocale, getCountryName, language } = useTranslation();
    const seenRanges = new Set<string>();

    const filteredDays = selectedYearDays
        .filter(day => mode === "month" ? day.date.getMonth() === currentDate.getMonth() : true)
        .map(day => {
            const filteredEvents = day.events.filter(event => {
                if (event.isRange && event.rangeStart && event.endDate) {
                    const key = `${event.kind}-${event.kind === "publicHoliday" ? event.countryCode : ""}-${event.name}-${event.rangeStart}-${event.endDate}`;
                    if (seenRanges.has(key)) {
                        return false;
                    }
                    seenRanges.add(key);
                }
                return true;
            });
            return { ...day, events: filteredEvents };
        })
        .filter(day => day.events.length > 0);

    return <div className={styles.eventsList}>
        <div className={styles.eventsWrapper}>
            {filteredDays
                .map(date => (
                    <div className={styles.dateEvents} key={date.date.valueOf()}>
                        <div className={styles.eventsDate}>
                            <b>{formatDateToReadable(date.date, intlLocale)}</b>
                        </div>
                        {date.events.map(event => (
                            event.kind === "publicHoliday"
                                ? <div className={styles.events} key={event.name + event.countryCode + (event.rangeStart ?? event.date)}>
                                    <span>{getFlagEmoji(event.countryCode)}&nbsp;</span>
                                    <strong>{getCountryName(event.countryCode, event.country)}&nbsp;</strong>
                                    <a target="_blank" href={getLink(event.date, event.country, event.name, countryData)}>{getLocalizedHolidayName(event.name, event.countryCode, language)}</a>
                                    {event.isRange && event.rangeStart && event.endDate && (
                                        <span> ({event.rangeStart} → {event.endDate})</span>
                                    )}
                                </div>
                                : <div className={styles.events} key={event.name + (event.rangeStart ?? event.date)}>
                                    {event.icon} {event.name}
                                    {event.isRange && event.rangeStart && event.endDate && (
                                        <span> ({event.rangeStart} → {event.endDate})</span>
                                    )}
                                </div>
                        ))}
                    </div>
                ))
            }
        </div>
    </div>;
}