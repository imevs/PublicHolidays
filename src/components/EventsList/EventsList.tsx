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

    return <div className={styles.eventsList}>
        <div className={styles.eventsWrapper}>
            {selectedYearDays
                .filter(day => mode === "month" ? day.date.getMonth() === currentDate.getMonth() : true)
                .filter(day => day.events.length)
                .map(date => (
                    <div className={styles.dateEvents} key={date.date.valueOf()}>
                        <div className={styles.eventsDate}>
                            <b>{formatDateToReadable(date.date, intlLocale)}</b>
                        </div>
                        {date.events.map(event => (
                            event.kind === "publicHoliday"
                                ? <div className={styles.events} key={event.name + event.countryCode}>
                                    <span>{getFlagEmoji(event.countryCode)}&nbsp;</span>
                                    <strong>{getCountryName(event.countryCode, event.country)}&nbsp;</strong>
                                    <a target="_blank" href={getLink(event.date, event.country, event.name, countryData)}>{getLocalizedHolidayName(event.name, event.countryCode, language)}</a>
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