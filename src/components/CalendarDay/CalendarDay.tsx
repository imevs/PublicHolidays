import React from 'react';
import { CalendarDay as CalendarDayType } from '../../types';
import styles from './CalendarDay.module.css';
import countryColors from '../shared/countryColors.module.css';

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
      {day.holidays.map((holiday, idx) => {
        // Compose the class for the country-specific holiday using shared CSS
        const countryClass = countryColors[`country-${holiday.countryCode}`] || '';
        return (
          <div
            key={idx}
            className={`${styles.holiday} ${countryClass}`}
            title={`${holiday.localName}`}
          >
            {holiday.country}: {holiday.name}
          </div>
        );
      })}
    </div>
  );
};

export default CalendarDay;
