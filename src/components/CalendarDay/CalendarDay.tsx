import React, { useEffect, useState } from "react";
import { CalendarDay as CalendarDayType } from "../../types";
import { getFlagEmoji } from "../../utils/countryFlags";
import styles from "./CalendarDay.module.css";
import { getLink } from "../../data/holidays_descriptions/getLink";
import { UTCDate } from "../../utils/UTCDate";

interface CalendarDayProps {
    day: CalendarDayType;
    setIsPopupOpen(date: UTCDate): void;
}

const CalendarDay: React.FC<CalendarDayProps> = ({ day, setIsPopupOpen }) => {
    const dayClasses = [
        styles.calendarDay,
        !day.isCurrentMonth && styles.otherMonth,
        day.isToday && styles.today
    ].filter(Boolean).join(" ");

    const [countryData, setCountryData] = useState({});
    useEffect(() => {
        import("../../data/holidays_descriptions/all").then(data => {
            setCountryData(data.descriptions);
        });
    }, []);

    return (
        <div
            key={day.date.toDateString()}
            className={dayClasses}
            onClick={() => setIsPopupOpen(day.date)}
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
                    <div className={styles.holiday} title={`${holiday.localName}`}>
                        {getFlagEmoji(holiday.countryCode)} {holiday.country}: {holiday.name}
                    </div>
                </a>
            ) : (
                <div className={styles.holiday} title={`${holiday.localName}`} onClick={(e) => e.stopPropagation()}>
                    {holiday.icon} {holiday.name}
                </div>
            ))}
        </div>
    );
};

export default CalendarDay;
