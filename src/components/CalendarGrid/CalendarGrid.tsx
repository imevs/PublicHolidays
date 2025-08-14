import React from 'react';
import { CalendarDay as CalendarDayType } from '../../types';
import CalendarDay from '../CalendarDay/CalendarDay';
import { dayNames } from '../../utils/dateUtils';
import styles from './CalendarGrid.module.css';

interface CalendarGridProps {
  calendarDays: CalendarDayType[];
}

const CalendarGrid: React.FC<CalendarGridProps> = ({ calendarDays }) => {
  return (
      <div style={{ width: '100%' }}>
        <div className={styles.calendarGrid}>
          {dayNames.map(day => (
              <div key={day} className={styles.calendarHeader + " " + (['Sat', 'Sun'].includes(day) ? styles.weekend : "")}>
                {day}
              </div>
          ))}

          {calendarDays.map((day, index) => (
              <CalendarDay key={index} day={day} />
          ))}
        </div>
      </div>
  );
};

export default CalendarGrid;
