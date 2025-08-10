import React from 'react';
import { useCalendar } from './hooks/useCalendar';
import Controls from './components/Controls/Controls';
import MonthNavigation from './components/MonthNavigation/MonthNavigation';
import CalendarGrid from './components/CalendarGrid/CalendarGrid';
import styles from './App.module.css';

const App: React.FC = () => {
  const {
    currentDate,
    selectedCountries,
    selectedYear,
    calendarDays,
    navigateMonth,
    toggleCountry,
    handleYearChange
  } = useCalendar();

  return (
    <div className={styles.app}>
      <div className={styles.header}>
        <h1>🌍 Public Holidays Calendar</h1>
        <p>Track public holidays across multiple countries</p>
      </div>

      <div className={styles.container}>
        <Controls
          selectedYear={selectedYear}
          selectedCountries={selectedCountries}
          onYearChange={handleYearChange}
          onToggleCountry={toggleCountry}
        />

        <MonthNavigation
          currentDate={currentDate}
          onNavigateMonth={navigateMonth}
        />

        <CalendarGrid calendarDays={calendarDays} />
      </div>
    </div>
  );
};

export default App;
