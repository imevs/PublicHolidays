import React from "react";
import { useCalendar } from "./hooks/useCalendar";
import Controls from "./components/Controls/Controls";
import CalendarGrid from "./components/CalendarGrid/CalendarGrid";
import styles from "./App.module.css";

const App: React.FC = () => {
    const {
        currentDate,
        selectedCountries,
        selectedYear,
        selectedMonthDays,
        selectedYearDays,
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

                <CalendarGrid
                    selectedYearDays={selectedYearDays}
                    selectedMonthDays={selectedMonthDays}
                    currentDate={currentDate}
                    onNavigateMonth={navigateMonth}
                />
            </div>
        </div>
    );
};

export default App;
