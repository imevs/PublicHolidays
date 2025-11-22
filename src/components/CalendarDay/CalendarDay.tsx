import React from "react";
import { CalendarDay as CalendarDayType } from "../../types";
import { getFlagEmoji } from "../../utils/countryFlags";
import styles from "./CalendarDay.module.css";
import { getLink } from "../../data/holidays_descriptions/getLink";
import { UTCDate } from "../../utils/UTCDate";
import type { Description } from "../../data/holidays_descriptions/all";

interface CalendarDayProps {
    day: CalendarDayType;
    isSelected?: boolean;
    isEditable: boolean;
    countryData: Record<string, Description>;
    setDateForPopup(date: UTCDate): void;
}

const CalendarDay: React.FC<CalendarDayProps> = ({
    day,
    setDateForPopup,
    isSelected,
    isEditable,
    countryData,
}) => {
    const dayClasses = [
        styles.calendarDay,
        !day.isCurrentMonth && styles.otherMonth,
        day.isToday && styles.today,
        isSelected ? styles.selectedDate : "",
        isEditable ? styles.isClickable : "",
        day.isWeekend ? styles.holiday : "",
    ].filter(Boolean).join(" ");

    return (
        <div
            key={day.date.toDateString()}
            className={dayClasses}
            onClick={() => setDateForPopup(day.date)}
        >
            <div className={styles.dayNumber}>{day.dayNumber}</div>
            {day.isCurrentMonth && day.events.map((holiday, idx) => holiday.kind === "publicHoliday" ? (
                <a
                    key={idx}
                    href={getLink(holiday.date, holiday.country, holiday.name, countryData)}
                    onClick={(e) => e.stopPropagation()}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <div className={styles.event} title={`${holiday.localName}`}>
                        {getFlagEmoji(holiday.countryCode)} {holiday.country}: {holiday.name}
                    </div>
                </a>
            ) : (
                <div key={idx} className={styles.event} title={`${holiday.localName}`} onClick={(e) => e.stopPropagation()}>
                    {holiday.icon} {holiday.name}
                </div>
            ))}
        </div>
    );
};

export default CalendarDay;
