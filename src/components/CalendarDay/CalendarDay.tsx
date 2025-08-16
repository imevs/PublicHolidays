import React from 'react';
import { CalendarDay as CalendarDayType } from '../../types';
import { getFlagEmoji } from "../../utils/countryFlags";
import styles from './CalendarDay.module.css';

interface CalendarDayProps {
  day: CalendarDayType;
}

const CalendarDay: React.FC<CalendarDayProps> = ({ day }) => {
  const dayClasses = [
    styles.calendarDay,
    !day.isCurrentMonth && styles.otherMonth,
    day.isToday && styles.today
  ].filter(Boolean).join(' ');

  return (
    <div className={dayClasses}>
      <div className={styles.dayNumber}>{day.dayNumber}</div>
      {day.holidays.map((holiday, idx) => (
        <div
          key={idx}
          className={styles.holiday}
          title={`${holiday.localName}`}
        >
          {getFlagEmoji(holiday.countryCode)} {holiday.country}: {holiday.name}
        </div>
      ))}
    </div>
  );
};

export default CalendarDay;
