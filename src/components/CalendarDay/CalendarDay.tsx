import React, { useEffect, useState } from "react";
import { CalendarDay as CalendarDayType } from "../../types";
import { getFlagEmoji } from "../../utils/countryFlags";
import styles from "./CalendarDay.module.css";
import { getLink } from "../../data/holidays_descriptions/getLink";

interface CalendarDayProps {
    day: CalendarDayType;
}

const CalendarDay: React.FC<CalendarDayProps> = ({ day }) => {
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
        <div key={day.date.toDateString()} className={dayClasses}>
            <div className={styles.dayNumber}>{day.dayNumber}</div>
            {day.holidays.map((holiday, idx) => (
                <a
                    key={idx}
                    href={getLink(holiday.date, holiday.country, holiday.name, countryData)}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <div className={styles.holiday} title={`${holiday.localName}`}>
                        {getFlagEmoji(holiday.countryCode)} {holiday.country}: {holiday.name}
                    </div>
                </a>
            ))}
        </div>
    );
};

export default CalendarDay;
